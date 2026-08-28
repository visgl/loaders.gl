// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {parseOBJMeshes} from '../src/lib/parse-obj-meshes';

test('parseOBJMeshes handles faces, materials, colors, normals, UVs, lines, and points', () => {
  const text = [
    'mtllib sample.mtl',
    'v 0 0 0 1 0 0',
    'v 1 0 0 0 1 0',
    'v 1 1 0 0 0 1',
    'v 0 1 0 1 1 1',
    'v 0 0 \\\n+0',
    'vt 0 0',
    'vt 1 0',
    'vt 1 1',
    'vt 0 1',
    'vn 0 0 1',
    'o faces',
    'usemtl colored',
    's off',
    'f 1/1/1 2/2/1 3/3/1 4/4/1',
    'g lines',
    'l 1/1 2/2 3/3',
    'g plain-lines',
    'l 1 2',
    'g points',
    'p -1 -2',
    's',
    '\0'
  ].join('\r\n');

  const result = parseOBJMeshes(text);

  expect(result.meshes).toHaveLength(4);
  expect(result.meshes[0].mode).toBe(4);
  expect(result.meshes[0].attributes.POSITION.value).toHaveLength(18);
  expect(result.meshes[0].attributes.NORMAL.value).toHaveLength(18);
  expect(result.meshes[0].attributes.COLOR_0.value).toHaveLength(18);
  expect(result.meshes[0].attributes.TEXCOORD_0.value).toHaveLength(12);
  expect(result.meshes[1].mode).toBe(1);
  expect(result.meshes[1].attributes.POSITION.value).toHaveLength(9);
  expect(result.meshes[1].attributes.TEXCOORD_0.value).toHaveLength(6);
  expect(result.meshes[2].mode).toBe(1);
  expect(result.meshes[2].attributes.POSITION.value).toHaveLength(6);
  expect(result.meshes[3].mode).toBe(0);
  expect(Array.from(result.meshes[3].attributes.POSITION.value)).toEqual([0, 0, 0, 0, 1, 0]);
  expect(result.meshes[0].materials[0]).toMatchObject({name: 'colored', flatShading: true});
  expect(result.meshes[0].materials[0].mtllib).toBeUndefined();
  expect(result.materials).toHaveLength(4);
});

test('parseOBJMeshes rejects unknown statements after tolerating empty input', () => {
  expect(parseOBJMeshes('')).toEqual({meshes: [], materials: []});
  expect(() => parseOBJMeshes('v 0 0 0\nunsupported value')).toThrow(
    'Unexpected line: "unsupported value"'
  );
});
