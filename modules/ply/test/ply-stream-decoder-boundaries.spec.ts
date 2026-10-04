// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {parsePLY} from '../src/lib/parse-ply';
import {parsePLYInBatches} from '../src/lib/parse-ply-in-batches';

/** Collects PLY batches from explicitly split byte chunks. */
async function collectBatches(chunks: Uint8Array[], options: Record<string, unknown> = {}) {
  const batches = [];
  for await (const batch of parsePLYInBatches(chunks, options)) batches.push(batch);
  return batches;
}

test('PLY streaming mesh headers keep element state local to each parse', async () => {
  const text = [
    'ply',
    'format ascii 1.0',
    '',
    'comment compact mesh',
    'element vertex 4',
    'property float32 x',
    'property float64 y',
    'property double z',
    'property float nx',
    'property float ny',
    'property float nz',
    'property float s',
    'property float t',
    'property uchar red',
    'property uchar green',
    'property uchar blue',
    'element face 3',
    'property list uchar int vertex_index',
    'element edge 1',
    'property int8 start',
    'property uint8 end',
    'end_header',
    '1 2 3 0 1 0 .25 .75 255 0 255',
    '',
    '4 5 6 1 0 0 0 1 0 255 0',
    '7 8 9 0 0 1 1 0 0 0 255',
    '10 11 12 1 1 0 1 1 255 255 255',
    '3 0 1 2',
    '4 0 1 2 3',
    '2 0 1',
    '0 1',
    ''
  ].join('\n');
  const bytes = new TextEncoder().encode(text);
  // Concurrent headers must not share the active element while their iterators yield.
  const results = await Promise.all([
    collectBatches([bytes.subarray(0, 5), bytes.subarray(5)]),
    collectBatches([bytes.subarray(0, 5), bytes.subarray(5)])
  ]);
  for (const batches of results) {
    expect(batches).toHaveLength(1);
    const mesh = batches[0];
    expect(mesh).toHaveProperty('attributes');
    if ('attributes' in mesh) {
      expect(mesh.attributes.POSITION.value).toEqual(
        new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
      );
      expect(mesh.attributes.NORMAL.value).toEqual(
        new Float32Array([0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0])
      );
      expect(mesh.attributes.TEXCOORD_0.value).toEqual(
        new Float32Array([0.25, 0.75, 0, 1, 1, 0, 1, 1])
      );
      expect(mesh.attributes.COLOR_0.value).toEqual(
        new Uint8Array([255, 0, 255, 0, 255, 0, 0, 0, 255, 255, 255, 255])
      );
      expect(mesh.indices?.value).toEqual(new Uint32Array([0, 1, 2, 0, 1, 3, 1, 2, 3]));
      expect(mesh.loaderData.elements.map(element => element.name)).toEqual([
        'vertex',
        'face',
        'edge'
      ]);
    }
  }
});

test.each([
  'binary_little_endian',
  'binary_big_endian'
])('PLY %s preserves records when the CRLF header terminator splits', async format => {
  const headerText = [
    'ply',
    `format ${format} 1.0`,
    'element vertex 2',
    'property float x',
    'property float y',
    'property float z',
    'property ushort intensity',
    'end_header\r\n'
  ].join('\n');
  const header = new TextEncoder().encode(headerText);
  const bytes = new Uint8Array(header.length + 28);
  bytes.set(header);
  const view = new DataView(bytes.buffer, header.length);
  const littleEndian = format === 'binary_little_endian';
  for (let index = 0; index < 2; index++) {
    view.setFloat32(index * 14, 1.25 + index, littleEndian);
    view.setFloat32(index * 14 + 4, -2.5 - index, littleEndian);
    view.setFloat32(index * 14 + 8, 3.75 + index, littleEndian);
    view.setUint16(index * 14 + 12, 65000 + index, littleEndian);
  }
  for (const split of [header.length - 2, header.length - 1, header.length, header.length + 1]) {
    const batches = (await collectBatches([bytes.subarray(0, split), bytes.subarray(split)], {
      shape: 'arrow-table',
      batchSize: 1
    })) as MeshArrowTable[];
    expect(batches.map(batch => batch.data.numRows)).toEqual([1, 1]);
    expect(batches.map(batch => Array.from(batch.data.getChild('POSITION')!.get(0)))).toEqual([
      [1.25, -2.5, 3.75],
      [2.25, -3.5, 4.75]
    ]);
    expect(batches.map(batch => batch.data.getChild('intensity')!.get(0))).toEqual([65000, 65001]);
  }
});

test('PLY legacy binary decoder reads signed and unsigned scalar aliases with independent values', () => {
  const header = new TextEncoder().encode(
    [
      'ply',
      'format binary_big_endian 1.0',
      'element vertex 1',
      'property float x',
      'property float y',
      'property float z',
      'property int8 signedByte',
      'property uint8 unsignedByte',
      'property int16 signedShort',
      'property uint16 unsignedShort',
      'property int32 signedInteger',
      'property uint32 unsignedInteger',
      'property float64 confidence',
      'end_header\n'
    ].join('\n')
  );
  const bytes = new Uint8Array(header.length + 34);
  bytes.set(header);
  const view = new DataView(bytes.buffer, header.length);
  view.setFloat32(0, 1.5);
  view.setFloat32(4, -2.5);
  view.setFloat32(8, 3.5);
  view.setInt8(12, -7);
  view.setUint8(13, 251);
  view.setInt16(14, -30000);
  view.setUint16(16, 60000);
  view.setInt32(18, -100000);
  view.setUint32(22, 4000000);
  view.setFloat64(26, 0.125);
  const mesh = parsePLY(bytes.buffer, {_useLegacyBinaryPointCloudParser: true});
  expect(mesh.attributes.POSITION.value).toEqual(new Float32Array([1.5, -2.5, 3.5]));
  for (const [name, expected] of Object.entries({
    signedByte: -7,
    unsignedByte: 251,
    signedShort: -30000,
    unsignedShort: 60000,
    signedInteger: -100000,
    unsignedInteger: 4000000,
    confidence: 0.125
  })) {
    expect(mesh.attributes[name].value).toEqual(new Float32Array([expected]));
  }
});

test('PLY streaming mesh rejects unsupported ASCII types and binary input', async () => {
  const makeHeader = (format: string, type: string) =>
    new TextEncoder().encode(
      [
        'ply',
        `format ${format} 1.0`,
        'element vertex 1',
        `property ${type} x`,
        'end_header',
        '1',
        ''
      ].join('\n')
    );
  await expect(collectBatches([makeHeader('ascii', 'potato')])).rejects.toThrow('potato');
  await expect(collectBatches([makeHeader('binary_little_endian', 'float')])).rejects.toThrow(
    'Binary PLY can not yet be parsed in streaming mode'
  );
});
