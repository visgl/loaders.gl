// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  parseHDF5Dataspace,
  parseHDF5PrimitiveType,
  parseHDF5ContiguousLayout,
  decodeHDF5Primitive
} from '../../src/hdf5/hdf5-dataset-messages';

test('native HDF5 simple dataspace and contiguous numeric primitives', () => {
  const space = new Uint8Array(20);
  const view = new DataView(space.buffer);
  space[0] = 2;
  space[1] = 2;
  view.setBigUint64(4, 2n, true);
  view.setBigUint64(12, 3n, true);
  expect(parseHDF5Dataspace(space, 8)).toEqual({shape: [2, 3], elementCount: 6});
  const dtype = new Uint8Array(12);
  dtype[0] = 0x11;
  view.setBigUint64(4, 2n, true); // separate buffer; set dtype directly below
  new DataView(dtype.buffer).setUint32(4, 4, true);
  const parsed = parseHDF5PrimitiveType(dtype);
  expect(parsed.kind).toBe('float');
  const values = new Uint8Array(8);
  new DataView(values.buffer).setFloat32(0, 1.5, true);
  new DataView(values.buffer).setFloat32(4, -2.25, true);
  expect(Array.from(decodeHDF5Primitive(values, parsed) as Float32Array)).toEqual([1.5, -2.25]);
  const layout = new Uint8Array(18);
  layout[0] = 3;
  layout[1] = 1;
  new DataView(layout.buffer).setBigUint64(2, 128n, true);
  new DataView(layout.buffer).setBigUint64(10, 24n, true);
  expect(parseHDF5ContiguousLayout(layout, 8, 8)).toEqual({address: 128n, byteLength: 24});
});
