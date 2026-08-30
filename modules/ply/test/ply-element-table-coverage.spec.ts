// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  convertPLYElementTablesToMesh,
  convertPLYElementTablesToMeshArrowTable,
  parsePLYToElementTables
} from '../src/lib/parse-ply-arrow';
import {parsePLYInBatches} from '../src/lib/parse-ply-in-batches';

const SCALAR_PROPERTIES = [
  ['char', 'signedByte', -1],
  ['uchar', 'unsignedByte', 2],
  ['short', 'signedShort', -300],
  ['ushort', 'unsignedShort', 400],
  ['int', 'signedInt', -50_000],
  ['uint', 'unsignedInt', 60_000],
  ['float', 'x', 1.25],
  ['float32', 'y', 2.5],
  ['double', 'z', 3.75]
] as const;

const LIST_COUNT_TYPES = [
  'char',
  'int8',
  'uchar',
  'uint8',
  'short',
  'int16',
  'ushort',
  'uint16',
  'int',
  'int32',
  'uint',
  'uint32',
  'float',
  'float32',
  'double',
  'float64'
] as const;

function getScalarSize(type: (typeof LIST_COUNT_TYPES)[number]): number {
  if (type.includes('8') || type === 'char' || type === 'uchar') {
    return 1;
  }
  if (type.includes('16') || type === 'short' || type === 'ushort') {
    return 2;
  }
  return type === 'double' || type === 'float64' ? 8 : 4;
}

function writeScalar(
  dataView: DataView,
  type: (typeof LIST_COUNT_TYPES)[number],
  littleEndian: boolean
): void {
  if (type === 'char' || type === 'int8') {
    dataView.setInt8(0, 1);
  } else if (type === 'uchar' || type === 'uint8') {
    dataView.setUint8(0, 1);
  } else if (type === 'short' || type === 'int16') {
    dataView.setInt16(0, 1, littleEndian);
  } else if (type === 'ushort' || type === 'uint16') {
    dataView.setUint16(0, 1, littleEndian);
  } else if (type === 'int' || type === 'int32') {
    dataView.setInt32(0, 1, littleEndian);
  } else if (type === 'uint' || type === 'uint32') {
    dataView.setUint32(0, 1, littleEndian);
  } else if (type === 'float' || type === 'float32') {
    dataView.setFloat32(0, 1, littleEndian);
  } else {
    dataView.setFloat64(0, 1, littleEndian);
  }
}

async function collectBatches(chunks: Uint8Array[], options: Record<string, unknown> = {}) {
  const batches = [];
  for await (const batch of parsePLYInBatches(chunks, {shape: 'arrow-table', ...options})) {
    batches.push(batch);
  }
  return batches;
}

describe('PLY element-table parser coverage', () => {
  test('parses every ASCII scalar type, list shape, and mesh conversion path', () => {
    const text = [
      'ply',
      'format ascii 1.0',
      'element vertex 1',
      ...SCALAR_PROPERTIES.map(([type, name]) => `property ${type} ${name}`),
      'property float nx',
      'property float ny',
      'property float nz',
      'property float s',
      'property float t',
      'property uchar red',
      'property uchar green',
      'property uchar blue',
      'property list uchar int samples',
      'element face 3',
      'property list uchar int vertex_indices',
      'end_header',
      `${SCALAR_PROPERTIES.map(([, , value]) => value).join(' ')} 4 5 6 .25 .75 7 8 9 2 10 11`,
      '3 0 1 2',
      '4 0 1 2 3',
      '2 0 1',
      '999 ignored after declared rows'
    ].join('\n');

    const elementTables = parsePLYToElementTables(text);
    expect(elementTables.elements.map(element => element.table.numRows)).toEqual([1, 3]);
    expect(Array.from(elementTables.elements[0].table.getChild('samples')!.get(0) as any)).toEqual([
      10, 11
    ]);
    const mesh = convertPLYElementTablesToMesh(elementTables);
    expect(Array.from(mesh.attributes.POSITION.value)).toEqual([1.25, 2.5, 3.75]);
    expect(Array.from(mesh.attributes.NORMAL.value)).toEqual([4, 5, 6]);
    expect(Array.from(mesh.attributes.TEXCOORD_0.value)).toEqual([0.25, 0.75]);
    expect(Array.from(mesh.attributes.COLOR_0.value)).toEqual([7, 8, 9]);
    expect(Array.from(mesh.indices!.value)).toEqual([0, 1, 2, 0, 1, 3, 1, 2, 3]);
    expect(mesh.topology).toBe('triangle-list');

    const arrowTable = convertPLYElementTablesToMeshArrowTable(elementTables);
    expect(arrowTable.data.schema.fields.map(field => field.name)).toContain('indices');
    expect(arrowTable.indices?.value).toEqual(mesh.indices?.value);

    const pointCloud = parsePLYToElementTables(text, {pointCloud: true});
    expect(pointCloud.elements).toHaveLength(1);
  });

  test.each([
    true,
    false
  ])('parses every binary scalar type and list with littleEndian=%s', littleEndian => {
    const format = littleEndian ? 'binary_little_endian' : 'binary_big_endian';
    const headerText = [
      'ply',
      `format ${format} 1.0`,
      'element vertex 1',
      ...SCALAR_PROPERTIES.map(([type, name]) => `property ${type} ${name}`),
      'property list ushort uint samples',
      'end_header\n'
    ].join('\n');
    const headerBytes = new TextEncoder().encode(headerText);
    const body = new ArrayBuffer(40);
    const view = new DataView(body);
    let offset = 0;
    view.setInt8(offset++, -1);
    view.setUint8(offset++, 2);
    view.setInt16(offset, -300, littleEndian);
    offset += 2;
    view.setUint16(offset, 400, littleEndian);
    offset += 2;
    view.setInt32(offset, -50_000, littleEndian);
    offset += 4;
    view.setUint32(offset, 60_000, littleEndian);
    offset += 4;
    view.setFloat32(offset, 1.25, littleEndian);
    offset += 4;
    view.setFloat32(offset, 2.5, littleEndian);
    offset += 4;
    view.setFloat64(offset, 3.75, littleEndian);
    offset += 8;
    view.setUint16(offset, 2, littleEndian);
    offset += 2;
    view.setUint32(offset, 10, littleEndian);
    offset += 4;
    view.setUint32(offset, 11, littleEndian);

    const bytes = new Uint8Array(headerBytes.length + body.byteLength);
    bytes.set(headerBytes);
    bytes.set(new Uint8Array(body), headerBytes.length);
    const table = parsePLYToElementTables(bytes.buffer).elements[0].table;
    expect(table.getChild('signedByte')?.get(0)).toBe(-1);
    expect(table.getChild('unsignedShort')?.get(0)).toBe(400);
    expect(table.getChild('z')?.get(0)).toBe(3.75);
    expect(Array.from(table.getChild('samples')!.get(0) as any)).toEqual([10, 11]);
  });

  test('covers empty, incomplete, point-cloud, and unsupported-type boundaries', () => {
    expect(() => parsePLYToElementTables('ply\nformat binary_little_endian 1.0\n')).toThrow(
      'Binary PLY parsing requires an ArrayBuffer'
    );
    expect(() =>
      parsePLYToElementTables(
        ['ply', 'format ascii 1.0', 'element face 0', 'end_header'].join('\n'),
        {pointCloud: true}
      )
    ).toThrow('requires a leading vertex element');
    expect(() =>
      parsePLYToElementTables(
        [
          'ply',
          'format ascii 1.0',
          'element vertex 1',
          'property potato value',
          'end_header',
          '1'
        ].join('\n')
      )
    ).toThrow('potato');

    const noVertex = parsePLYToElementTables(
      [
        'ply',
        'format ascii 1.0',
        'element face 1',
        'property list uchar int indices',
        'end_header',
        '0'
      ].join('\n')
    );
    const mesh = convertPLYElementTablesToMesh(noVertex);
    expect(mesh.attributes).toEqual({});
    expect(mesh.topology).toBe('point-list');
    expect(mesh.indices?.value).toHaveLength(0);

    expect(() => parsePLYToElementTables('')).toThrow('Binary PLY parsing requires an ArrayBuffer');
  });

  test.each([
    true,
    false
  ])('streams variable-width binary rows for every list count type with littleEndian=%s', async littleEndian => {
    for (const countType of LIST_COUNT_TYPES) {
      const format = littleEndian ? 'binary_little_endian' : 'binary_big_endian';
      const header = new TextEncoder().encode(
        [
          'ply',
          `format ${format} 1.0`,
          'comment preserve this header branch',
          'element vertex 1',
          `property list ${countType} uchar samples`,
          'end_header\r\n'
        ].join('\n')
      );
      const countSize = getScalarSize(countType);
      const body = new Uint8Array(countSize + 1);
      writeScalar(new DataView(body.buffer), countType, littleEndian);
      body[countSize] = 9;
      const bytes = new Uint8Array(header.length + body.length);
      bytes.set(header);
      bytes.set(body, header.length);

      const splitOffset = header.length + countSize;
      const batches = await collectBatches(
        [bytes.subarray(0, 4), bytes.subarray(4, splitOffset), bytes.subarray(splitOffset)],
        {pointCloud: true, batchSize: 1}
      );
      expect(batches).toHaveLength(1);
      expect(batches[0].topology).toBe('point-list');
    }
  });

  test('streams ASCII rows in batches and handles header and topology boundaries', async () => {
    const ascii = new TextEncoder().encode(
      [
        'ply',
        'format ascii 1.0',
        'element vertex 3',
        'property float x',
        'property float y',
        'property float z',
        'end_header\t',
        '',
        '1 2 3',
        '4 5 6',
        '7 8 9'
      ].join('\n')
    );
    const batches = await collectBatches([ascii.subarray(0, 17), ascii.subarray(17)], {
      batchSize: 2
    });
    expect(batches.map(batch => batch.data.numRows)).toEqual([2, 1]);

    await expect(
      collectBatches([new TextEncoder().encode('ply\nformat ascii 1.0')])
    ).rejects.toThrow('Incomplete PLY header');
    const faces = new TextEncoder().encode(
      ['ply', 'format ascii 1.0', 'element face 0', 'end_header\n'].join('\n')
    );
    await expect(collectBatches([faces])).rejects.toThrow('requires one vertex element');

    const mixed = new TextEncoder().encode(
      [
        'ply',
        'format binary_little_endian 1.0',
        'element vertex 0',
        'element face 0',
        'end_header\n'
      ].join('\n')
    );
    await expect(collectBatches([mixed])).rejects.toThrow('requires one vertex element');
  });
});
