// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HTTPRangeReader} from '../../src/hdf5/http-range-reader';
import {decodeCFNumericValues, parseCFVariableMetadata} from '../../src/netcdf/cf-conventions';
import {HDF5Source} from '../../src/hdf5/hdf5-source';

test('strict HTTP byte-range transport', async () => {
  const reader = new HTTPRangeReader('https://example.invalid/data.nc', async (_url, init) => {
    expect((init?.headers as Record<string, string>).Range).toBe('bytes=2-4');
    return new Response(new Uint8Array([2, 3, 4]), {
      status: 206,
      headers: {'Content-Range': 'bytes 2-4/10'}
    });
  });
  expect(Array.from(await reader.read(2, 3))).toEqual([2, 3, 4]);
  await expect(
    new HTTPRangeReader(
      'https://example.invalid',
      async () => new Response('full file', {status: 200})
    ).read(0, 4)
  ).rejects.toThrow(/206 required/);
});

test('HTTP byte ranges reject invalid requests and mismatched responses', async () => {
  const reader = new HTTPRangeReader(
    'https://example.invalid/data.nc',
    async () =>
      new Response(new Uint8Array([1, 2]), {
        status: 206,
        headers: {'Content-Range': 'bytes 4-5/10'}
      })
  );
  await expect(reader.read(-1, 2)).rejects.toThrow(/invalid HTTP byte range/);
  await expect(reader.read(0, 0)).rejects.toThrow(/invalid HTTP byte range/);
  await expect(reader.read(2, 2)).rejects.toThrow(/unexpected Content-Range/);
  const truncated = new HTTPRangeReader(
    'https://example.invalid/data.nc',
    async () =>
      new Response(new Uint8Array([1]), {
        status: 206,
        headers: {'Content-Range': 'bytes 2-3/10'}
      })
  );
  await expect(truncated.read(2, 2)).rejects.toThrow(/truncated range response/);
});

test('CF packed values and backend selection pushdown', async () => {
  const cfMetadata = parseCFVariableMetadata({
    units: 'K',
    standard_name: 'air_temperature',
    _FillValue: -9999,
    scale_factor: 0.5,
    add_offset: 200,
    valid_range: [0, 100]
  });
  expect(Array.from(decodeCFNumericValues([10, -9999, 110], cfMetadata))).toEqual([205, NaN, NaN]);
  let fullReads = 0;
  const source = new HDF5Source({
    async listDatasets() {
      return [
        {
          path: '/t',
          dataset: {
            shape: [2, 3],
            dtype: 'float32',
            async read() {
              fullReads++;
              return new Float32Array(6);
            },
            async readSelection(ranges: readonly (readonly [number, number])[]) {
              expect(ranges).toEqual([
                [0, 2],
                [1, 3]
              ]);
              return new Float32Array([2, 3, 5, 6]);
            }
          }
        }
      ];
    }
  });
  const values = await source.readScientificVariable('/t', {'/t:dim_1': [1, 3]});
  expect(fullReads).toBe(0);
  expect(Array.from(values.data as Float32Array)).toEqual([2, 3, 5, 6]);
});
