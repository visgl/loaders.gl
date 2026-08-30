// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {
  getPLYBinaryPointCloudParsePlan,
  parsePLY,
  parsePLYBinaryPointCloudRecordsToArrowTable,
  parsePLYHeader,
  parsePLYToArrowTable
} from '../src/lib/parse-ply';
import {parsePLYInBatches} from '../src/lib/parse-ply-in-batches';

/** Collects every table emitted by the streaming PLY parser. */
async function collectPLYBatches(bytes: Uint8Array, options: Record<string, unknown>) {
  const chunks = [bytes.subarray(0, 7), bytes.subarray(7, 31), bytes.subarray(31)];
  const batches = [];
  for await (const batch of parsePLYInBatches(chunks, options)) {
    batches.push(batch);
  }
  return batches;
}

describe('PLY parser edge cases', () => {
  test('parses every scalar type through both endian direct point-cloud paths', () => {
    const properties = [
      ['char', 'signedByte', -7],
      ['uchar', 'unsignedByte', 250],
      ['short', 'signedShort', -1234],
      ['ushort', 'unsignedShort', 54321],
      ['int', 'signedInt', -1234567],
      ['uint', 'unsignedInt', 12345678],
      ['float', 'x', 1.25],
      ['float32', 'y', -2.5],
      ['double', 'z', 3.75]
    ] as const;

    for (const littleEndian of [true, false]) {
      const format = littleEndian ? 'binary_little_endian' : 'binary_big_endian';
      const headerText = [
        'ply',
        `format ${format} 1.0`,
        'element vertex 1',
        ...properties.map(([type, name]) => `property ${type} ${name}`),
        'end_header\n'
      ].join('\n');
      const headerBytes = new TextEncoder().encode(headerText);
      const record = new ArrayBuffer(30);
      const dataView = new DataView(record);
      let byteOffset = 0;
      dataView.setInt8(byteOffset, -7);
      byteOffset += 1;
      dataView.setUint8(byteOffset, 250);
      byteOffset += 1;
      dataView.setInt16(byteOffset, -1234, littleEndian);
      byteOffset += 2;
      dataView.setUint16(byteOffset, 54321, littleEndian);
      byteOffset += 2;
      dataView.setInt32(byteOffset, -1234567, littleEndian);
      byteOffset += 4;
      dataView.setUint32(byteOffset, 12345678, littleEndian);
      byteOffset += 4;
      dataView.setFloat32(byteOffset, 1.25, littleEndian);
      byteOffset += 4;
      dataView.setFloat32(byteOffset, -2.5, littleEndian);
      byteOffset += 4;
      dataView.setFloat64(byteOffset, 3.75, littleEndian);

      const bytes = new Uint8Array(headerBytes.length + record.byteLength);
      bytes.set(headerBytes);
      bytes.set(new Uint8Array(record), headerBytes.length);
      const table = parsePLYToArrowTable(bytes.buffer);

      expect(table?.data.numRows).toBe(1);
      expect(Array.from(table!.data.getChild('POSITION')!.get(0) as number[])).toEqual([
        1.25, -2.5, 3.75
      ]);
      for (const [, name, value] of properties.slice(0, 6)) {
        expect(table!.data.getChild(name)!.get(0)).toBe(value);
      }
    }
  });

  test('parses binary mesh lists and normalized attributes through the general parser', () => {
    const headerText = [
      'ply',
      'format binary_big_endian 1.0',
      'element vertex 4',
      'property float x',
      'property float y',
      'property float z',
      'property float nx',
      'property float ny',
      'property float nz',
      'property float s',
      'property float t',
      'property uchar red',
      'property uchar green',
      'property uchar blue',
      'property double confidence',
      'element face 1',
      'property list uchar int vertex_index',
      'end_header\n'
    ].join('\n');
    const headerBytes = new TextEncoder().encode(headerText);
    const vertexStride = 43;
    const body = new ArrayBuffer(vertexStride * 4 + 17);
    const dataView = new DataView(body);
    for (let vertexIndex = 0; vertexIndex < 4; vertexIndex++) {
      const offset = vertexIndex * vertexStride;
      for (let component = 0; component < 8; component++) {
        dataView.setFloat32(offset + component * 4, vertexIndex + component / 10, false);
      }
      dataView.setUint8(offset + 32, 10 + vertexIndex);
      dataView.setUint8(offset + 33, 20 + vertexIndex);
      dataView.setUint8(offset + 34, 30 + vertexIndex);
      dataView.setFloat64(offset + 35, vertexIndex + 0.5, false);
    }
    const faceOffset = vertexStride * 4;
    dataView.setUint8(faceOffset, 4);
    for (let index = 0; index < 4; index++) {
      dataView.setInt32(faceOffset + 1 + index * 4, index, false);
    }
    const bytes = new Uint8Array(headerBytes.length + body.byteLength);
    bytes.set(headerBytes);
    bytes.set(new Uint8Array(body), headerBytes.length);

    const mesh = parsePLY(bytes.buffer, {_useLegacyBinaryPointCloudParser: true});
    expect(mesh.indices?.value).toEqual(new Uint32Array([0, 1, 3, 1, 2, 3]));
    expect(mesh.attributes.NORMAL.value).toHaveLength(12);
    expect(mesh.attributes.TEXCOORD_0.value).toHaveLength(8);
    expect(mesh.attributes.COLOR_0.value).toHaveLength(12);
    expect(mesh.attributes.confidence.value).toEqual(new Float32Array([0.5, 1.5, 2.5, 3.5]));
  });

  test('covers ASCII scalar aliases and reports unsupported scalar types', () => {
    const integerTypes = ['int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32'];
    const ply = [
      'ply',
      'format ascii 1.0',
      'element vertex 1',
      'property float32 x',
      'property float64 y',
      'property double z',
      ...integerTypes.map(type => `property ${type} value_${type}`),
      'end_header',
      '1.5 2.5 3.5 -1 2 -3 4 -5 6'
    ].join('\n');
    const mesh = parsePLY(ply);
    expect(mesh.attributes.POSITION.value).toEqual(new Float32Array([1.5, 2.5, 3.5]));
    for (const type of integerTypes) {
      expect(mesh.attributes[`value_${type}`]).toBeDefined();
    }

    expect(() =>
      parsePLY(
        [
          'ply',
          'format ascii 1.0',
          'element vertex 1',
          'property potato x',
          'end_header',
          '1'
        ].join('\n')
      )
    ).toThrow(/potato/);
    expect(() =>
      getPLYBinaryPointCloudParsePlan(
        parsePLYHeader(
          [
            'ply',
            'format binary_little_endian 1.0',
            'element vertex 1',
            'property potato x',
            'end_header\n'
          ].join('\n')
        )
      )
    ).toThrow(/potato/);
  });

  test('parses mapped ASCII attributes, lists, comments, and CRLF headers', () => {
    const ply = [
      'ply',
      'format ascii 1.0',
      'comment compact fixture',
      'element vertex 2',
      'property float px',
      'property float py',
      'property float pz',
      'property uchar red',
      'property uchar green',
      'property uchar blue',
      'element face 1',
      'property list uchar int vertex_indices',
      'end_header',
      '1 2 3 10 20 30',
      '4 5 6 20 30 40',
      '3 0 1 0'
    ].join('\r\n');
    const header = parsePLYHeader(ply, {propertyNameMapping: {px: 'x', py: 'y', pz: 'z'}});
    expect(header.comments).toEqual(['compact fixture']);
    expect(header.headerLength).toBeGreaterThan(0);

    const mesh = parsePLY(ply, {propertyNameMapping: {px: 'x', py: 'y', pz: 'z'}});
    expect(Array.from(mesh.attributes.POSITION.value as Float32Array)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(Array.from(mesh.attributes.COLOR_0.value as Uint8Array)).toEqual([
      10, 20, 30, 20, 30, 40
    ]);
  });

  test('parses binary little-endian point records and reuses a parse plan', () => {
    const headerText = [
      'ply',
      'format binary_little_endian 1.0',
      'element vertex 2',
      'property float x',
      'property float y',
      'property float z',
      'property uchar intensity',
      'end_header\n'
    ].join('\n');
    const header = parsePLYHeader(headerText);
    const records = new ArrayBuffer(26);
    const dataView = new DataView(records);
    dataView.setFloat32(0, 1.5, true);
    dataView.setFloat32(4, -2, true);
    dataView.setFloat32(8, 3, true);
    dataView.setUint8(12, 7);
    dataView.setFloat32(13, 4, true);
    dataView.setFloat32(17, 5, true);
    dataView.setFloat32(21, 6, true);
    dataView.setUint8(25, 8);
    const plan = getPLYBinaryPointCloudParsePlan(header);
    const table = parsePLYBinaryPointCloudRecordsToArrowTable(
      new Uint8Array(records),
      header,
      {},
      plan
    );
    expect(table?.data.numRows).toBe(2);
    expect(Array.from(table!.data.getChild('POSITION')!.toArray()[1] as any)).toEqual([4, 5, 6]);
    expect(table!.data.getChild('intensity')!.get(0)).toBe(7);
    expect(parsePLYToArrowTable(headerText)).toBeNull();
  });

  test('packs every normalized binary point-cloud attribute on the direct path', () => {
    const propertyNames = [
      'x',
      'y',
      'z',
      'nx',
      'ny',
      'nz',
      's',
      't',
      'red',
      'green',
      'blue',
      'confidence'
    ];
    const headerText = [
      'ply',
      'format binary_little_endian 1.0',
      'element vertex 1',
      ...propertyNames.map(
        propertyName =>
          `property ${['red', 'green', 'blue'].includes(propertyName) ? 'uchar' : 'float'} ${propertyName}`
      ),
      'end_header\n'
    ].join('\n');
    const header = parsePLYHeader(headerText);
    const plan = getPLYBinaryPointCloudParsePlan(header)!;
    const records = new Uint8Array(plan.vertexStride);
    const dataView = new DataView(records.buffer);
    let byteOffset = 0;
    for (let propertyIndex = 0; propertyIndex < propertyNames.length; propertyIndex++) {
      const propertyName = propertyNames[propertyIndex];
      if (['red', 'green', 'blue'].includes(propertyName)) {
        dataView.setUint8(byteOffset, 100 + propertyIndex);
        byteOffset += 1;
      } else {
        dataView.setFloat32(byteOffset, propertyIndex + 0.5, true);
        byteOffset += 4;
      }
    }

    const table = parsePLYBinaryPointCloudRecordsToArrowTable(records, header, {}, plan)!;
    expect(Array.from(table.data.getChild('POSITION')!.get(0) as number[])).toEqual([
      0.5, 1.5, 2.5
    ]);
    expect(Array.from(table.data.getChild('NORMAL')!.get(0) as number[])).toEqual([3.5, 4.5, 5.5]);
    expect(Array.from(table.data.getChild('TEXCOORD_0')!.get(0) as number[])).toEqual([6.5, 7.5]);
    expect(Array.from(table.data.getChild('COLOR_0')!.get(0) as number[])).toEqual([108, 109, 110]);
    expect(table.data.getChild('confidence')!.get(0)).toBe(11.5);
  });

  test('rejects unsupported point-cloud layouts and malformed headers', () => {
    const headerText = [
      'ply',
      'format binary_little_endian 1.0',
      'element vertex 1',
      'property list uchar int indices',
      'end_header\n'
    ].join('\n');
    const header = parsePLYHeader(headerText);
    expect(getPLYBinaryPointCloudParsePlan(header)).toBeNull();
    expect(parsePLYBinaryPointCloudRecordsToArrowTable(new Uint8Array(0), header)).toBeNull();
    expect(parsePLY('not a ply').attributes).toEqual({});
  });

  test('streams fixed-width binary point clouds across arbitrary chunk boundaries', async () => {
    const headerBytes = new TextEncoder().encode(
      [
        'ply',
        'format binary_little_endian 1.0',
        'comment streamed',
        'element vertex 3',
        'property float x',
        'property float y',
        'property float z',
        'property ushort intensity',
        'end_header\r\n'
      ].join('\n')
    );
    const body = new Uint8Array(42);
    const dataView = new DataView(body.buffer);
    for (let index = 0; index < 3; index++) {
      const offset = index * 14;
      dataView.setFloat32(offset, index + 0.25, true);
      dataView.setFloat32(offset + 4, index + 1.25, true);
      dataView.setFloat32(offset + 8, index + 2.25, true);
      dataView.setUint16(offset + 12, 100 + index, true);
    }
    const bytes = new Uint8Array(headerBytes.length + body.length);
    bytes.set(headerBytes);
    bytes.set(body, headerBytes.length);

    const batches = await collectPLYBatches(bytes, {
      shape: 'arrow-table',
      pointCloud: true,
      batchSize: 2
    });
    expect(batches.map((batch: any) => batch.data.numRows)).toEqual([2, 1]);
    expect((batches[1] as any).data.getChild('intensity').get(0)).toBe(102);
  });

  test('streams ASCII Arrow batches and legacy meshes with empty lines', async () => {
    const text = [
      'ply',
      'format ascii 1.0',
      'comment streamed ascii',
      'element vertex 3',
      'property float x',
      'property float y',
      'property float z',
      'end_header',
      '1 2 3',
      '',
      '4 5 6',
      '7 8 9'
    ].join('\n');
    const bytes = new TextEncoder().encode(text);
    const options = {};
    const arrowBatches = await collectPLYBatches(bytes, {
      ...options,
      shape: 'arrow-table',
      batchSize: 2
    });
    expect(arrowBatches.map((batch: any) => batch.data.numRows)).toEqual([2, 1]);

    const meshBatches = await collectPLYBatches(bytes, options);
    expect(meshBatches).toHaveLength(1);
    expect(Array.from((meshBatches[0] as any).attributes.POSITION.value)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9
    ]);
  });

  test('streams variable-width binary vertex rows and validates incomplete layouts', async () => {
    const headerBytes = new TextEncoder().encode(
      [
        'ply',
        'format binary_big_endian 1.0',
        'element vertex 2',
        'property float x',
        'property float y',
        'property float z',
        'property list uchar ushort samples',
        'end_header\n'
      ].join('\n')
    );
    const body = new Uint8Array(31);
    const dataView = new DataView(body.buffer);
    dataView.setFloat32(0, 1, false);
    dataView.setFloat32(4, 2, false);
    dataView.setFloat32(8, 3, false);
    dataView.setUint8(12, 2);
    dataView.setUint16(13, 10, false);
    dataView.setUint16(15, 20, false);
    dataView.setFloat32(17, 4, false);
    dataView.setFloat32(21, 5, false);
    dataView.setFloat32(25, 6, false);
    dataView.setUint8(29, 0);
    const bytes = new Uint8Array(headerBytes.length + body.length);
    bytes.set(headerBytes);
    bytes.set(body, headerBytes.length);
    const batches = await collectPLYBatches(bytes, {shape: 'arrow-table', batchSize: 1});
    expect(batches.map((batch: any) => batch.data.numRows)).toEqual([1, 1]);

    await expect(
      collectPLYBatches(new TextEncoder().encode('ply\nformat ascii 1.0\n'), {
        shape: 'arrow-table'
      })
    ).rejects.toThrow('Incomplete PLY header');
    await expect(
      collectPLYBatches(
        new TextEncoder().encode(
          'ply\nformat ascii 1.0\nelement face 1\nproperty list uchar int indices\nend_header\n3 0 1 2\n'
        ),
        {shape: 'arrow-table'}
      )
    ).rejects.toThrow('requires one vertex element');
  });
});
