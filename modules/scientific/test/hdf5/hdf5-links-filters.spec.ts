// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {parseHDF5HardLink, getHDF5CompactLinks} from '../../src/hdf5/hdf5-links';
import {unshuffleHDF5, decodeHDF5Filters} from '../../src/hdf5/hdf5-filters';

test('HDF5 compact hard-link parser', () => {
  const bytes = new Uint8Array(2 + 1 + 4 + 8);
  bytes.set([1, 0, 4, 119, 105, 110, 100], 0);
  new DataView(bytes.buffer).setBigUint64(7, 128n, true);
  const link = parseHDF5HardLink(bytes, 8);
  expect(link).toEqual({name: 'wind', address: 128n});
  expect(getHDF5CompactLinks([{type: 6, flags: 0, payload: bytes}], 8)).toEqual([link]);
  expect(() => getHDF5CompactLinks([{type: 2, flags: 0, payload: bytes}], 8)).toThrow(/dense link/);
});
test('HDF5 hard links decode optional fields and reject unsafe names and link kinds', () => {
  const bytes = new Uint8Array(26);
  bytes.set([1, 0x1d, 0], 0); // two-byte name length, hard link, creation order, character set
  bytes.set([0, 4, 0, 119, 105, 110, 100], 11);
  new DataView(bytes.buffer).setBigUint64(18, 256n, true);
  expect(parseHDF5HardLink(bytes, 8)).toEqual({name: 'wind', address: 256n});
  const soft = bytes.slice();
  soft[2] = 1;
  expect(() => parseHDF5HardLink(soft, 8)).toThrow(/soft\/external/);
  const invalidName = bytes.slice();
  invalidName[14] = 47;
  expect(() => parseHDF5HardLink(invalidName, 8)).toThrow(/invalid hard-link name/);
  const invalidUtf8 = bytes.slice();
  invalidUtf8[14] = 255;
  expect(() => parseHDF5HardLink(invalidUtf8, 8)).toThrow();
  expect(() =>
    getHDF5CompactLinks(
      [
        {type: 6, flags: 0, payload: bytes},
        {type: 6, flags: 0, payload: bytes}
      ],
      8
    )
  ).toThrow(/duplicate compact link/);
});
test('HDF5 hard links reject truncated optional fields and addresses', () => {
  expect(() => parseHDF5HardLink(new Uint8Array([2, 0, 1]), 8)).toThrow(/version/);
  expect(() => parseHDF5HardLink(new Uint8Array([1, 8]), 8)).toThrow(/version/);
  expect(() => parseHDF5HardLink(new Uint8Array([1, 8, 0]), 8)).toThrow(/truncated link/);
  expect(() => parseHDF5HardLink(new Uint8Array([1, 0, 0]), 8)).toThrow(/name or address/);
  expect(() => parseHDF5HardLink(new Uint8Array([1, 0, 1, 97]), 8)).toThrow(/name or address/);
  const bytes = new Uint8Array([1, 0, 1, 97, 0]);
  expect(() => parseHDF5HardLink(bytes, 0)).toThrow(/truncated link field/);
});
test('HDF5 shuffle filter and explicit unknown-filter rejection', async () => {
  const shuffled = new Uint8Array([1, 2, 3, 4, 10, 20, 30, 40]);
  expect(Array.from(unshuffleHDF5(shuffled, 2))).toEqual([1, 10, 2, 20, 3, 30, 4, 40]);
  expect(
    Array.from(await decodeHDF5Filters(shuffled, [{id: 2, flags: 0, clientData: [2]}]))
  ).toEqual([1, 10, 2, 20, 3, 30, 4, 40]);
  await expect(
    decodeHDF5Filters(shuffled, [{id: 32000, flags: 0, clientData: []}])
  ).rejects.toThrow(/unsupported filter/);
});
