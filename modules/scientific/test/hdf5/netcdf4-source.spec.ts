// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {NetCDF4Source} from '../../src/netcdf/netcdf4-source';

test('NetCDF-4 adapter preserves raw values and opts into CF numeric decoding', async () => {
  let closed = false;
  const source = new NetCDF4Source({
    async listDatasets() {
      if (closed) throw new Error('backend closed');
      return [
        {
          path: '/temperature',
          dataset: {
            shape: [3],
            dtype: 'int16',
            attributes: {
              units: 'K',
              scale_factor: 0.5,
              add_offset: 200,
              _FillValue: -9999
            },
            async read() {
              return new Int16Array([10, -9999, 20]);
            },
            async readSelection() {
              return new Int16Array([20]);
            }
          }
        }
      ];
    },
    close() {
      closed = true;
    }
  });
  expect(source.scientificCapabilities.selection).toBe('residual');
  const metadata = await source.getScientificMetadata();
  expect(metadata.variables[0].units).toBe('K');
  expect(
    Array.from(
      (await source.readScientificVariable('/temperature', {'/temperature:dim_0': [2, 3]}))
        .data as Int16Array
    )
  ).toEqual([20]);
  const decoded = await source.readCFVariable('/temperature', {'/temperature:dim_0': [2, 3]});
  expect(Array.from(decoded.data as Float64Array)).toEqual([210]);
  expect(decoded.attributes?.units).toBe('K');
  await source.close();
  await expect(source.getScientificMetadata()).rejects.toThrow(/backend closed/);
});
