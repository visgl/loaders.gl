// SPDX-License-Identifier: MIT
import {test, expect} from 'vitest';
import {CubeLUTLoaderWithParser} from '../../src/cube-lut-loader';
import {ThreeDLLUTLoaderWithParser} from '../../src/3dl-lut-loader';
import {parseImageLUT} from '../../src/lut';

test('cube preserves domains, title, HDR samples and red-fastest order', () => {
  const result = CubeLUTLoaderWithParser.parseTextSync(
    'TITLE "a # title"\nLUT_1D_SIZE 2\nDOMAIN_MIN -1 -2 -3\nDOMAIN_MAX 1 2 3\n0 0 0 # comment\n2 3 4'
  );
  expect(result.dimension).toBe(1);
  expect(result.title).toBe('a # title');
  expect(result.domainMinimum).toEqual([-1, -2, -3]);
  expect(Array.from(result.data)).toEqual([0, 0, 0, 2, 3, 4]);
});

test('grid-first 3dl explicitly scales and reorders asymmetric samples', () => {
  const rows: string[] = [];
  for (let red = 0; red < 2; red++)
    for (let green = 0; green < 2; green++)
      for (let blue = 0; blue < 2; blue++)
        rows.push(`${red * 1023} ${green * 1023} ${blue * 1023}`);
  const input = '0 1023\n' + rows.join('\n');
  const result = ThreeDLLUTLoaderWithParser.parseTextSync(input, {lut: {outputBitDepth: 10}});
  expect(Array.from(result.data.slice(3, 6))).toEqual([1, 0, 0]);
  expect(Array.from(result.inputGrid!)).toEqual([0, 1]);
  expect(result.inputGrid).toBeInstanceOf(Float64Array);
  expect(Array.from(result.sourceInputGrid!)).toEqual([0, 1023]);
  expect(result.sourceOutputBitDepth).toBe(10);
  expect(() => ThreeDLLUTLoaderWithParser.parseTextSync(input)).toThrow(/outputBitDepth/);
});

test('image LUT decodes explicitly arranged opaque tiles', () => {
  const pixels = new Uint8Array(4 * 2 * 3);
  for (let blue = 0; blue < 2; blue++)
    for (let green = 0; green < 2; green++)
      for (let red = 0; red < 2; red++)
        pixels.set([red * 255, green * 255, blue * 255], (green * 4 + blue * 2 + red) * 3);
  const result = parseImageLUT(pixels, 4, 2, {size: 2, tilesPerRow: 2});
  expect(Array.from(result.data.slice(3, 6))).toEqual([1, 0, 0]);
  expect(Array.from(result.data.slice(-3))).toEqual([1, 1, 1]);
  expect(() => parseImageLUT(pixels, 4, 2, {size: 2, tilesPerRow: 1})).toThrow(/layout/);
});

test.each([
  'LUT_3D_SIZE 2\n0 0 0',
  'LUT_1D_SIZE 2\nLUT_3D_SIZE 2',
  'LUT_1D_SIZE 2\n0 0 0\nNaN 1 1',
  'LUT_1D_SIZE 2\nDOMAIN_MAX 0 1 1\n0 0 0\n1 1 1',
  'LUT_1D_SIZE 2\n0 0 0\n1e100 0 0'
])('cube rejects malformed records %#', input => {
  expect(() => CubeLUTLoaderWithParser.parseTextSync(input)).toThrow(/LUT/);
});

test('text LUT metadata preloads parser subpaths and preserves async/sync API contracts', async () => {
  const {CubeLUTLoader} = await import('../../src/cube-lut-loader-types');
  const {ThreeDLLUTLoader} = await import('../../src/3dl-lut-loader-types');
  const cubeText = 'LUT_1D_SIZE 2\n0 0 0\n1 1 1';
  const gridText = '0 1\n' + Array.from({length: 8}, () => '0 0 0').join('\n');
  const cases = [
    {metadata: CubeLUTLoader, text: cubeText},
    {metadata: ThreeDLLUTLoader, text: gridText}
  ];
  for (const entry of cases) {
    const implementation = await entry.metadata.preload();
    const options = {lut: {outputBitDepth: 10}};
    const bytes = new TextEncoder().encode(entry.text).buffer;
    expect((await implementation.parse(bytes, options)).size).toBe(2);
    expect(implementation.parseSync(bytes, options).size).toBe(2);
    expect((await implementation.parseText(entry.text, options)).size).toBe(2);
  }
});

test('cube ignores quotes inside comments without repeatedly scanning the line', () => {
  const input = 'LUT_1D_SIZE 2\n0 0 0\n1 1 1\n' + '#'.repeat(10000) + '"';
  expect(CubeLUTLoaderWithParser.parseTextSync(input).size).toBe(2);
});

test('cube 3D samples retain red-fastest ordering', () => {
  const input = 'LUT_3D_SIZE 2\n0 0 0\n1 0 0\n0 1 0\n1 1 0\n0 0 1\n1 0 1\n0 1 1\n1 1 1';
  const result = CubeLUTLoaderWithParser.parseTextSync(input);
  expect(result.dimension).toBe(3);
  expect(Array.from(result.data.slice(3, 6))).toEqual([1, 0, 0]);
});

test.each([
  '0 0 0',
  'LUT_3D_SIZE 1',
  'TITLE unquoted\nLUT_1D_SIZE 2\n0 0 0\n1 1 1',
  'LUT_1D_SIZE 2\nLUT_1D_SIZE 2',
  'LUT_1D_SIZE 2\n0 0\n1 1 1'
])('cube rejects invalid declaration or numeric arity %#', text => {
  expect(() => CubeLUTLoaderWithParser.parseTextSync(text)).toThrow(/LUT/);
});

test.each([
  '0 0\n0 0 0',
  '0 1\n' + Array.from({length: 8}, () => '2048 0 0').join('\n')
])('3dl rejects invalid grid or out-of-range samples %#', text => {
  expect(() => ThreeDLLUTLoaderWithParser.parseTextSync(text, {lut: {outputBitDepth: 10}})).toThrow(
    /LUT/
  );
});

test('image LUT rejects unsupported channel counts, transparency and oversized cubes', () => {
  expect(() => parseImageLUT(new Uint8Array(1), 4, 2, {size: 2, tilesPerRow: 2})).toThrow(
    /RGB or RGBA/
  );
  const pixels = new Uint8Array(4 * 2 * 4).fill(255);
  pixels[3] = 0;
  expect(() => parseImageLUT(pixels, 4, 2, {size: 2, tilesPerRow: 2})).toThrow(/transparent/);
  expect(() =>
    parseImageLUT(new Uint8Array(0), 262144, 512, {size: 512, tilesPerRow: 512})
  ).toThrow(/layout/);
});

test('3dl retains distinct large integer knots without float32 collapse', () => {
  const grid = [0, Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER];
  const input = grid.join(' ') + '\n' + Array.from({length: 27}, () => '0 0 0').join('\n');
  const result = ThreeDLLUTLoaderWithParser.parseTextSync(input, {lut: {outputBitDepth: 10}});
  expect(Array.from(result.sourceInputGrid!)).toEqual(grid);
  expect(result.inputGrid![1]).toBeLessThan(result.inputGrid![2]);
});
