// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  decodeHDF5Primitive,
  parseHDF5ContiguousLayout,
  parseHDF5Dataspace,
  parseHDF5PrimitiveType
} from '../../src/hdf5/hdf5-dataset-messages';

/** Encode a standard HDF5 primitive datatype message. */
function makeDatatype(
  kind: 'integer' | 'float',
  size: number,
  signed = false,
  littleEndian = true
) {
  const bytes = new Uint8Array(12);
  bytes[0] = kind === 'float' ? 0x11 : 0x10;
  bytes[1] = (littleEndian ? 0 : 1) | (signed ? 8 : 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(4, size, true);
  view.setUint16(10, size * 8, true);
  return bytes;
}

test.each([
  ['int8', 'integer', 1, true, true, [255], -1],
  ['uint8', 'integer', 1, false, true, [255], 255],
  ['int16', 'integer', 2, true, true, [254, 255], -2],
  ['uint16 big-endian', 'integer', 2, false, false, [2, 1], 513],
  ['int32', 'integer', 4, true, true, [253, 255, 255, 255], -3],
  ['uint32', 'integer', 4, false, true, [255, 255, 255, 255], 4294967295],
  ['int64', 'integer', 8, true, true, [252, 255, 255, 255, 255, 255, 255, 255], -4n],
  ['uint64', 'integer', 8, false, true, [5, 0, 0, 0, 0, 0, 0, 0], 5n]
] as const)('HDF5 decodes %s values', (_name, kind, size, signed, littleEndian, input, expected) => {
  const type = parseHDF5PrimitiveType(makeDatatype(kind, size, signed, littleEndian));
  const values = decodeHDF5Primitive(Uint8Array.from(input), type);
  expect((values as unknown as {readonly [index: number]: number | bigint})[0]).toBe(expected);
});

test('HDF5 decodes float32 and big-endian float64', () => {
  const float32 = new Uint8Array(4);
  new DataView(float32.buffer).setFloat32(0, 1.25, true);
  expect(
    Array.from(
      decodeHDF5Primitive(float32, parseHDF5PrimitiveType(makeDatatype('float', 4))) as Float32Array
    )
  ).toEqual([1.25]);
  const float64 = new Uint8Array(8);
  new DataView(float64.buffer).setFloat64(0, -3.5, false);
  expect(
    Array.from(
      decodeHDF5Primitive(
        float64,
        parseHDF5PrimitiveType(makeDatatype('float', 8, true, false))
      ) as Float64Array
    )
  ).toEqual([-3.5]);
});

test('HDF5 primitive decoder rejects unsupported classes, widths and bitfields', () => {
  const invalidVersion = makeDatatype('integer', 4);
  invalidVersion[0] = 0;
  expect(() => parseHDF5PrimitiveType(invalidVersion)).toThrow(/unsupported datatype class/);
  const invalidClass = makeDatatype('integer', 4);
  invalidClass[0] = 0x12;
  expect(() => parseHDF5PrimitiveType(invalidClass)).toThrow(/unsupported datatype class/);
  expect(() => parseHDF5PrimitiveType(makeDatatype('integer', 3))).toThrow(
    /unsupported primitive size/
  );
  expect(() => parseHDF5PrimitiveType(makeDatatype('float', 2))).toThrow(/unsupported float width/);
  const bitfield = makeDatatype('integer', 4);
  bitfield[8] = 1;
  expect(() => parseHDF5PrimitiveType(bitfield)).toThrow(/nonstandard integer bitfield/);
  const type = parseHDF5PrimitiveType(makeDatatype('integer', 4));
  expect(() => decodeHDF5Primitive(new Uint8Array(3), type)).toThrow(
    /misaligned primitive payload/
  );
});

test('HDF5 dataspace and contiguous layout enforce dimensions and storage bounds', () => {
  const dataspace = new Uint8Array(24);
  dataspace.set([1, 1, 1]);
  new DataView(dataspace.buffer).setBigUint64(8, 2n, true);
  new DataView(dataspace.buffer).setBigUint64(16, 4n, true);
  expect(parseHDF5Dataspace(dataspace, 8)).toEqual({shape: [2], elementCount: 2});
  const rank = dataspace.slice();
  rank[1] = 33;
  expect(() => parseHDF5Dataspace(rank, 8)).toThrow(/unsupported dataspace rank/);
  const version = dataspace.slice();
  version[0] = 3;
  expect(() => parseHDF5Dataspace(version, 8)).toThrow(/unsupported dataspace version/);
  const huge = dataspace.slice();
  new DataView(huge.buffer).setBigUint64(8, 1n << 53n, true);
  expect(() => parseHDF5Dataspace(huge, 8)).toThrow(/safe range/);
  const layout = new Uint8Array(18);
  layout.set([3, 1]);
  layout.fill(255, 2, 10);
  expect(() => parseHDF5ContiguousLayout(layout, 8, 8)).toThrow(/unallocated contiguous storage/);
  layout[0] = 2;
  expect(() => parseHDF5ContiguousLayout(layout, 8, 8)).toThrow(/only contiguous layout v3/);
});
