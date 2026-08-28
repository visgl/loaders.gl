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

test('parsePCD decodes optional ASCII point attributes', () => {
  const packedColor = new Float32Array(new Uint8Array([10, 20, 30, 0]).buffer)[0];
  const data = new TextEncoder().encode(`
# optional attributes are commonly emitted by PCL
VERSION .7
FIELDS x y z rgb normal_x normal_y normal_z intensity label
SIZE 4 4 4 4 4 4 4 4 4
TYPE F F F F F F F F I
WIDTH 1
HEIGHT 1
DATA ascii
1 2 3 ${packedColor} 0 1 0 0.5 7
`);
  const result = parsePCD(data.buffer);

  expect(Array.from(result.attributes.POSITION.value)).toEqual([1, 2, 3]);
  expect(Array.from(result.attributes.NORMAL.value)).toEqual([0, 1, 0]);
  expect(Array.from(result.attributes.COLOR_0.value)).toEqual([10, 20, 30]);
});

test('parsePCD decodes optional binary point attributes', () => {
  const headerText = `
VERSION .7
FIELDS x y z rgb normal_x normal_y normal_z intensity label
SIZE 4 4 4 4 4 4 4 4 4
TYPE F F F U F F F F I
COUNT 1 1 1 1 1 1 1 1 1
WIDTH 1
HEIGHT 1
POINTS 1
DATA binary
`;
  const headerBytes = new TextEncoder().encode(headerText);
  const buffer = new ArrayBuffer(headerBytes.length + 36);
  new Uint8Array(buffer).set(headerBytes);
  const view = new DataView(buffer, headerBytes.length);
  [1, 2, 3].forEach((value, index) => view.setFloat32(index * 4, value, true));
  new Uint8Array(buffer, headerBytes.length + 12, 4).set([10, 20, 30, 255]);
  [0, 1, 0].forEach((value, index) => view.setFloat32(16 + index * 4, value, true));
  view.setFloat32(28, 0.5, true);
  view.setInt32(32, 7, true);

  const result = parsePCD(buffer);
  expect(Array.from(result.attributes.POSITION.value)).toEqual([1, 2, 3]);
  expect(Array.from(result.attributes.NORMAL.value)).toEqual([0, 1, 0]);
  expect(Array.from(result.attributes.COLOR_0.value)).toEqual([7]);
});

test('parsePCD decodes binary_compressed point attributes', () => {
  const headerText = `
VERSION .7
FIELDS x y z rgb normal_x normal_y normal_z intensity label
SIZE 4 4 4 4 4 4 4 4 4
TYPE F F F U F F F F I
COUNT 1 1 1 1 1 1 1 1 1
WIDTH 1
HEIGHT 1
POINTS 1
DATA binary_compressed
`;
  const headerBytes = new TextEncoder().encode(headerText);
  const decompressed = new Uint8Array(36);
  const view = new DataView(decompressed.buffer);
  [1, 2, 3].forEach((value, index) => view.setFloat32(index * 4, value, true));
  decompressed.set([10, 20, 30, 255], 12);
  [0, 1, 0].forEach((value, index) => view.setFloat32(16 + index * 4, value, true));
  view.setFloat32(28, 0.5, true);
  view.setInt32(32, 7, true);
  const compressed = new Uint8Array(38);
  compressed[0] = 31;
  compressed.set(decompressed.subarray(0, 32), 1);
  compressed[33] = 3;
  compressed.set(decompressed.subarray(32), 34);
  const buffer = new ArrayBuffer(headerBytes.length + 8 + compressed.length);
  new Uint8Array(buffer).set(headerBytes);
  const sizes = new DataView(buffer, headerBytes.length, 8);
  sizes.setUint32(0, compressed.length, true);
  sizes.setUint32(4, decompressed.length, true);
  new Uint8Array(buffer, headerBytes.length + 8).set(compressed);

  const result = parsePCD(buffer);
  expect(Array.from(result.attributes.POSITION.value)).toEqual([1, 2, 3]);
  expect(Array.from(result.attributes.NORMAL.value)).toEqual([0, 1, 0]);
  expect(Array.from(result.attributes.COLOR_0.value)).toEqual([7]);
});

test('parsePCD rejects unsupported encodings and preserves unorganized bounds', () => {
  const unsupported = new TextEncoder().encode(`
VERSION .7
FIELDS x y z
SIZE 4 4 4
TYPE F F F
POINTS 0
DATA future
`);
  expect(() => parsePCD(unsupported.buffer)).toThrow('future files are not supported');
});

test('decompressLZF handles literal and back-reference blocks', () => {
  expect(Array.from(decompressLZF(new Uint8Array([2, 97, 98, 99]), 3))).toEqual([97, 98, 99]);
  expect(Array.from(decompressLZF(new Uint8Array([2, 97, 98, 99, 32, 2]), 6))).toEqual([
    97, 98, 99, 97, 98, 99
  ]);
  expect(() => decompressLZF(new Uint8Array([2, 97]), 3)).toThrow('Invalid compressed data');
  expect(() => decompressLZF(new Uint8Array([32, 2]), 3)).toThrow('Invalid compressed data');
});
