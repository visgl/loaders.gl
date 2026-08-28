import {expect, test} from 'vitest';
import {decompressLZF} from '../src/lib/decompress-lzf';
import {getPCDSchema} from '../src/lib/get-pcd-schema';
import {parsePCD, parsePCDHeader} from '../src/lib/parse-pcd';

test('parsePCDHeader derives point counts and binary field offsets', () => {
  const header = parsePCDHeader(`
VERSION .7
FIELDS x y z intensity
SIZE 4 4 4 2
TYPE F F F U
WIDTH 2
HEIGHT 3
VIEWPOINT 0 0 0 1 0 0 0
DATA binary
`);

  expect(header.points).toBe(6);
  expect(header.count).toEqual([1, 1, 1, 1]);
  expect(header.offset).toEqual({x: 0, y: 4, z: 8, intensity: 12});
  expect(header.rowSize).toBe(14);
});

test('parsePCD decodes ASCII positions and normals into a point-list schema', () => {
  const data = new TextEncoder().encode(`
VERSION .7
FIELDS x y z normal_x normal_y normal_z
SIZE 4 4 4 4 4 4
TYPE F F F F F F
COUNT 1 1 1 1 1 1
WIDTH 2
HEIGHT 1
POINTS 2
DATA ascii
1 2 3 0 0 1
-1 4 5 1 0 0
`);
  const result = parsePCD(data.buffer);

  expect(Array.from(result.attributes.POSITION.value)).toEqual([1, 2, 3, -1, 4, 5]);
  expect(Array.from(result.attributes.NORMAL.value)).toEqual([0, 0, 1, 1, 0, 0]);
  expect(result.header.vertexCount).toBe(2);
  expect(result.schema.fields.map(field => field.name)).toEqual(['POSITION', 'NORMAL']);
  expect(result.schema.metadata?.topology).toBe('point-list');
});

test('getPCDSchema ignores component fields and preserves supplied metadata', () => {
  const schema = getPCDSchema(
    {
      offset: {x: 0, y: 1, z: 2, normal_x: 3, normal_y: 4, normal_z: 5, rgb: 6},
      fields: [],
      data: 'ascii'
    } as any,
    {source: 'fixture'}
  );

  expect(schema.fields.map(field => field.name)).toEqual(['POSITION', 'NORMAL', 'COLOR_0']);
  expect(schema.metadata).toEqual({source: 'fixture'});
});

test('parsePCD decodes binary point records', () => {
  const headerText = `
VERSION .7
FIELDS x y z
SIZE 4 4 4
TYPE F F F
COUNT 1 1 1
WIDTH 1
HEIGHT 1
POINTS 1
DATA binary
`;
  const headerBytes = new TextEncoder().encode(headerText);
  const buffer = new ArrayBuffer(headerBytes.length + 12);
  new Uint8Array(buffer).set(headerBytes);
  const view = new DataView(buffer);
  view.setFloat32(headerBytes.length, 1.5, true);
  view.setFloat32(headerBytes.length + 4, -2.5, true);
  view.setFloat32(headerBytes.length + 8, 3.5, true);

  const result = parsePCD(buffer);
  expect(Array.from(result.attributes.POSITION.value)).toEqual([1.5, -2.5, 3.5]);
  expect(result.header.vertexCount).toBe(1);
});

test('decompressLZF handles literal and back-reference blocks', () => {
  expect(Array.from(decompressLZF(new Uint8Array([2, 97, 98, 99]), 3))).toEqual([97, 98, 99]);
  expect(Array.from(decompressLZF(new Uint8Array([2, 97, 98, 99, 32, 2]), 6))).toEqual([
    97, 98, 99, 97, 98, 99
  ]);
  expect(() => decompressLZF(new Uint8Array([2, 97]), 3)).toThrow('Invalid compressed data');
  expect(() => decompressLZF(new Uint8Array([32, 2]), 3)).toThrow('Invalid compressed data');
});
