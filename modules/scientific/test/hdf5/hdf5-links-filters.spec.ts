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
