// SPDX-License-Identifier: MIT
import type {ColorLUT} from './lut-types';

/** Parses a single 1D or 3D .cube table, retaining out-of-range float samples. */
export function parseCubeLUT(text: string): ColorLUT {
  let size = 0;
  let dimension: 1 | 3 = 3;
  let title: string | undefined;
  let domainMinimum = [0, 0, 0];
  let domainMaximum = [1, 1, 1];
  const samples: number[] = [];
  const declarations = new Set<string>();
  for (const line of getLines(text)) {
    const [keyword, ...values] = line.split(/\s+/);
    if (/^[+-]?(?:\d|\.)/.test(keyword)) {
      if (!size) throw new Error('LUT: size must precede samples');
      samples.push(...parseNumbers(values.length ? [keyword, ...values] : [keyword], 3));
      continue;
    }
    if (declarations.has(keyword) || samples.length)
      throw new Error('LUT: duplicate or late declaration');
    declarations.add(keyword);
    switch (keyword) {
      case 'TITLE': {
        const match = /^TITLE\s+"(.*)"$/.exec(line);
        if (!match) throw new Error('LUT: invalid title');
        title = match[1];
        break;
      }
      case 'LUT_1D_SIZE':
      case 'LUT_3D_SIZE':
        if (size) throw new Error('LUT: combined tables are unsupported');
        size = parseNumbers(values, 1)[0];
        dimension = keyword === 'LUT_1D_SIZE' ? 1 : 3;
        if (!Number.isSafeInteger(size) || size < 2) throw new Error('LUT: invalid size');
        break;
      case 'DOMAIN_MIN':
        domainMinimum = parseNumbers(values, 3);
        break;
      case 'DOMAIN_MAX':
        domainMaximum = parseNumbers(values, 3);
        break;
      default:
        throw new Error(`LUT: unsupported directive ${keyword}`);
    }
  }
  if (!size || samples.length !== size ** dimension * 3)
    throw new Error('LUT: sample count does not match size');
  if (domainMaximum.some((value, index) => value <= domainMinimum[index]))
    throw new Error('LUT: invalid domain');
  const data = new Float32Array(samples);
  if (!data.every(Number.isFinite)) throw new Error('LUT: float32 sample overflow');
  return {dimension, size, data, domainMinimum, domainMaximum, title};
}

/** Parses grid-first .3dl files using an explicit output bit depth (no range guessing). */
export function parse3DLLUT(text: string, outputBitDepth: number): ColorLUT {
  if (!Number.isInteger(outputBitDepth) || outputBitDepth < 1 || outputBitDepth > 24)
    throw new Error('LUT: outputBitDepth must be 1 through 24');
  const lines = getLines(text);
  const grid = parseNumbers((lines.shift() || '').split(/\s+/));
  if (
    grid.length < 2 ||
    grid[0] !== 0 ||
    grid.some(
      (value, index) => !Number.isSafeInteger(value) || (index > 0 && value <= grid[index - 1])
    )
  )
    throw new Error('LUT: invalid 3dl grid');
  const maximum = 2 ** outputBitDepth - 1;
  const samples = lines.flatMap(line => parseNumbers(line.split(/\s+/), 3));
  if (
    samples.length !== grid.length ** 3 * 3 ||
    samples.some(value => !Number.isInteger(value) || value < 0 || value > maximum)
  )
    throw new Error('LUT: invalid 3dl samples');
  // Grid-first 3dl stores blue input fastest; normalize to the cube red-fastest contract.
  const size = grid.length;
  const data = new Float32Array(samples.length);
  for (let red = 0; red < size; red++)
    for (let green = 0; green < size; green++)
      for (let blue = 0; blue < size; blue++) {
        const source = ((red * size + green) * size + blue) * 3;
        const target = ((blue * size + green) * size + red) * 3;
        for (let channel = 0; channel < 3; channel++)
          data[target + channel] = samples[source + channel] / maximum;
      }
  return {
    dimension: 3,
    size,
    data,
    domainMinimum: [0, 0, 0],
    domainMaximum: [1, 1, 1],
    inputGrid: Float64Array.from(grid, value => value / grid[grid.length - 1]),
    sourceInputGrid: Float64Array.from(grid),
    sourceOutputBitDepth: outputBitDepth
  };
}

/** Extracts nonempty records after removing comments outside quoted titles. */
function getLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(line => {
      let quoted = false;
      let end = line.length;
      for (let index = 0; index < line.length; index++) {
        if (line[index] === '"') quoted = !quoted;
        else if (line[index] === '#' && !quoted) {
          end = index;
          break;
        }
      }
      return line.slice(0, end).trim();
    })
    .filter(Boolean);
}

/** Parses strict finite decimal records. */
function parseNumbers(values: string[], count?: number): number[] {
  if (
    (count !== undefined && values.length !== count) ||
    values.some(
      value =>
        !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) ||
        !Number.isFinite(Number(value))
    )
  )
    throw new Error('LUT: invalid numeric record');
  return values.map(Number);
}
