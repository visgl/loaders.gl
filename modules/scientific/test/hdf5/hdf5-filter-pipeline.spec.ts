// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  decodeHDF5Filters,
  parseHDF5FilterPipeline,
  unshuffleHDF5,
  verifyHDF5Fletcher32
} from '../../src/hdf5/hdf5-filters';

/** Append the big-endian Fletcher32 checksum used by an HDF5 filter chunk. */
function addFletcher32(data: Uint8Array): Uint8Array {
  let sum1 = 0xffff;
  let sum2 = 0xffff;
  for (let index = 0; index < data.length; index += 2) {
    const word = data[index] | (index + 1 < data.length ? data[index + 1] << 8 : 0);
    sum1 = (sum1 + word) % 65535;
    sum2 = (sum2 + sum1) % 65535;
  }
  return Uint8Array.from([...data, (sum2 >>> 8) & 255, sum2 & 255, (sum1 >>> 8) & 255, sum1 & 255]);
}

test('HDF5 filter metadata parses v1 and v2 pipelines', () => {
  const v2 = Uint8Array.from([2, 1, 2, 0, 0, 0, 1, 0, 2, 0, 0, 0]);
  expect(parseHDF5FilterPipeline(v2)).toEqual([{id: 2, flags: 0, clientData: [2]}]);
  const v1 = Uint8Array.from([
    1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0
  ]);
  expect(parseHDF5FilterPipeline(v1)).toEqual([{id: 2, flags: 0, clientData: [2]}]);
});

test.each([
  [new Uint8Array(1), /truncated filter pipeline/],
  [Uint8Array.from([3, 0]), /unsupported filter pipeline version/],
  [Uint8Array.from([2, 33]), /too many filters/],
  [Uint8Array.from([2, 1]), /truncated filter header/],
  [Uint8Array.from([2, 1, 2, 0, 0, 0, 65, 0]), /oversized filter parameters/],
  [Uint8Array.from([2, 1, 2, 0, 0, 0, 1, 0]), /truncated filter parameter/]
])('HDF5 filter metadata rejects malformed input', (bytes, error) => {
  expect(() => parseHDF5FilterPipeline(bytes)).toThrow(error);
});

test('HDF5 filter pipeline reverses checksum, shuffle, and deflate steps', async () => {
  const original = Uint8Array.from([1, 10, 2, 20, 3, 30]);
  const shuffled = Uint8Array.from([1, 2, 3, 10, 20, 30]);
  const encoded = addFletcher32(shuffled);
  expect(Array.from(verifyHDF5Fletcher32(encoded))).toEqual(Array.from(shuffled));
  expect(
    Array.from(
      await decodeHDF5Filters(encoded, [
        {id: 2, flags: 0, clientData: [2]},
        {id: 3, flags: 0, clientData: []}
      ])
    )
  ).toEqual(Array.from(original));
  expect(
    Array.from(
      await decodeHDF5Filters(
        shuffled,
        [{id: 1, flags: 0, clientData: []}],
        0,
        async bytes => bytes
      )
    )
  ).toEqual(Array.from(shuffled));
  expect(
    Array.from(await decodeHDF5Filters(shuffled, [{id: 1, flags: 0, clientData: []}], 1))
  ).toEqual(Array.from(shuffled));
  await expect(decodeHDF5Filters(shuffled, [{id: 1, flags: 0, clientData: []}])).rejects.toThrow(
    /deflate decoder not configured/
  );
  const corrupted = encoded.slice();
  corrupted[0] ^= 1;
  expect(() => verifyHDF5Fletcher32(corrupted)).toThrow(/checksum mismatch/);
  expect(() => verifyHDF5Fletcher32(new Uint8Array(3))).toThrow(/truncated Fletcher32/);
  expect(() => unshuffleHDF5(shuffled, 0)).toThrow(/invalid shuffle element size/);
});
