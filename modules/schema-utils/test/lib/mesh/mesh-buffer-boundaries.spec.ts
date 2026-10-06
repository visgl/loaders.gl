// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  convertArrowTableToMesh,
  convertTableToMesh
} from '../../../src/lib/mesh/convert-table-to-mesh';
import {getFixedSizeListVector} from '../../../src/lib/arrow-utils/arrow-fixed-size-list-utils';

/** Builds a two-vertex Arrow mesh with explicit field and schema metadata. */
function createMeshTable(transform: unknown, boundingBox?: string) {
  const vector = getFixedSizeListVector(new Float32Array([1, 2, 3, 4, 5, 6]), 3);
  const field = new arrow.Field(
    'POSITION',
    vector.type,
    false,
    new Map([
      ['byteOffset', '4'],
      ['byteStride', '12'],
      ['normalized', 'false'],
      [
        'loaders.gl.transform',
        typeof transform === 'string' ? transform : JSON.stringify(transform)
      ]
    ])
  );
  const schema = new arrow.Schema(
    [field],
    new Map([
      ['mode', 'invalid'],
      ...(boundingBox === undefined ? [] : [['boundingBox', boundingBox]])
    ] as [string, string][])
  );
  const struct = new arrow.Data(new arrow.Struct([field]), 0, vector.length, 0, undefined, [
    vector.data[0]
  ]);
  const data = new arrow.Table(new arrow.RecordBatch(schema, struct));
  return {shape: 'arrow-table' as const, data};
}

test.each([
  undefined,
  'invalid JSON',
  '[[]]',
  '[[1,2,3],[4,5,"bad"]]',
  '[[1,2],[3,4]]',
  '[[1,2,3]]'
])('quantized mesh ignores invalid optional bounding box %s', boundingBox => {
  const transform = {type: 'quantization', bits: 10, origin: [0, 0, 0], range: 6};
  const mesh = convertArrowTableToMesh(createMeshTable(transform, boundingBox));
  expect(mesh.header?.boundingBox).toEqual([
    [1, 2, 3],
    [4, 5, 6]
  ]);
  expect(mesh.mode).toBe(0);
  expect(mesh.attributes.POSITION).toMatchObject({
    byteOffset: 4,
    byteStride: 12,
    normalized: false,
    transform
  });
});

test.each([
  null,
  [],
  {bits: 3},
  {type: 'octahedron', bits: 0},
  {type: 'octahedron', bits: 31},
  {type: 'quantization', bits: 1.5},
  {type: 'quantization', bits: 31},
  {type: 'quantization', bits: 8, origin: ['bad'], range: 1},
  {type: 'quantization', bits: 8, origin: [0], range: 'bad'},
  'invalid JSON'
])('mesh ignores malformed attribute transform %j', transform => {
  const mesh = convertArrowTableToMesh(createMeshTable(transform));
  expect(mesh.attributes.POSITION.transform).toBeUndefined();
  expect(Array.from(mesh.attributes.POSITION.value)).toEqual([1, 2, 3, 4, 5, 6]);
});

test('valid optional transforms and a logical bounding box are restored', () => {
  const boundingBox = [
    [-1, -2, -3],
    [10, 20, 30]
  ];
  const quantization = {type: 'quantization', bits: 1, origin: [0, 0, 0], range: 30};
  expect(
    convertTableToMesh(createMeshTable(quantization, JSON.stringify(boundingBox))).header
      ?.boundingBox
  ).toEqual(boundingBox);
  const octahedron = {type: 'octahedron', bits: 30};
  expect(
    convertArrowTableToMesh(createMeshTable(octahedron)).attributes.POSITION.transform
  ).toEqual(octahedron);
  expect(() => convertTableToMesh({shape: 'columnar-table', data: {}})).toThrow('columnar-table');
});

test('fixed-size list slices copy only selected values across chunk offsets', () => {
  const values = new Float32Array([99, 99, 99, 1, 2, 3, 4, 5, 6]);
  const vector = getFixedSizeListVector(values, 3);
  const slice = vector.slice(1, 3);
  const chunked = slice.slice(0, 1).concat(slice.slice(1, 2));
  const data = new arrow.Table({POSITION: chunked});
  const mesh = convertArrowTableToMesh({shape: 'arrow-table', data});
  expect(Array.from(mesh.attributes.POSITION.value)).toEqual([1, 2, 3, 4, 5, 6]);
  expect(mesh.attributes.POSITION.value.buffer).not.toBe(values.buffer);
  expect(mesh.header?.vertexCount).toBe(2);
});
