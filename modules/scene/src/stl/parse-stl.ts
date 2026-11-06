// loaders.gl
// SPDX-License-Identifier: MIT
import type {Mesh} from '@loaders.gl/core/schema';
import {deduceMeshSchema, getMeshBoundingBox} from '@loaders.gl/core/schema-utils';

/** Parses strict ASCII or little-endian binary STL without changing authored normals. */
export function parseSTL(data: ArrayBuffer): Mesh {
  const view = new DataView(data);
  const binary = data.byteLength >= 84 && 84 + view.getUint32(80, true) * 50 === data.byteLength;
  let positions: Float32Array;
  let normals: Float32Array;
  let header: string;
  if (binary) {
    const triangleCount = view.getUint32(80, true);
    positions = new Float32Array(triangleCount * 9);
    normals = new Float32Array(triangleCount * 9);
    header = new TextDecoder().decode(data.slice(0, 80));
    for (let triangle = 0; triangle < triangleCount; triangle++) {
      const offset = 84 + triangle * 50;
      for (let component = 0; component < 9; component++) {
        positions[triangle * 9 + component] = view.getFloat32(offset + 12 + component * 4, true);
        normals[triangle * 9 + component] = view.getFloat32(offset + (component % 3) * 4, true);
      }
    }
  } else {
    const lines = new TextDecoder()
      .decode(data)
      .trim()
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    const vertices: number[] = [];
    const normalValues: number[] = [];
    header = lines[0] || '';
    let lineIndex = 0;
    while (lineIndex < lines.length) {
      if (!/^solid(?:\s|$)/.test(lines[lineIndex++]))
        throw new Error('STL: expected solid header or exact binary length');
      while (lineIndex < lines.length && !/^endsolid(?:\s|$)/.test(lines[lineIndex])) {
        const normal = parseVector(lines[lineIndex++], 'facet normal');
        if (lines[lineIndex++] !== 'outer loop') throw new Error('STL: expected outer loop');
        for (let vertex = 0; vertex < 3; vertex++) {
          vertices.push(...parseVector(lines[lineIndex++], 'vertex'));
          normalValues.push(...normal);
        }
        if (lines[lineIndex++] !== 'endloop' || lines[lineIndex++] !== 'endfacet')
          throw new Error('STL: incomplete facet');
      }
      if (lineIndex >= lines.length) throw new Error('STL: missing endsolid');
      lineIndex++;
    }
    if (!lines.length) throw new Error('STL: empty input');
    positions = new Float32Array(vertices);
    normals = new Float32Array(normalValues);
  }
  if (!positions.every(Number.isFinite) || !normals.every(Number.isFinite))
    throw new Error('STL: non-finite coordinates');
  const attributes = {POSITION: {value: positions, size: 3}, NORMAL: {value: normals, size: 3}};
  return {
    topology: 'triangle-list',
    mode: 4,
    attributes,
    schema: deduceMeshSchema(attributes),
    header: {
      vertexCount: positions.length / 3,
      boundingBox: getMeshBoundingBox(attributes) ?? undefined
    },
    loaderData: {header, format: binary ? 'binary' : 'ascii'}
  };
}

/** Reads exactly three finite decimal components after an ASCII record prefix. */
function parseVector(line: string | undefined, prefix: string): number[] {
  const tokens = line?.split(/\s+/) || [];
  const prefixTokens = prefix.split(' ');
  const components = tokens.slice(prefixTokens.length);
  if (
    prefixTokens.some((token, index) => tokens[index] !== token) ||
    components.length !== 3 ||
    components.some(value => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value))
  ) {
    throw new Error(`STL: invalid ${prefix} record`);
  }
  return components.map(Number);
}
