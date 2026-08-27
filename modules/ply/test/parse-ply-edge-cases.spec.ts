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

describe('PLY parser edge cases', () => {
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
});
