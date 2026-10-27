// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HDF5Source} from '../../src/hdf5';
import {NetCDF4Source} from '../../src/netcdf/netcdf4-source';

test('HDF5 backend separation, multidimensional slicing, and NetCDF units', async () => {
  const backend = {
    async listDatasets() {
      return [
        {
          path: '/wind/u',
          dataset: {
            shape: [2, 3],
            dtype: 'float32',
            attributes: {units: 'm s-1'},
            async read() {
              return new Float32Array([1, 2, 3, 4, 5, 6]);
            }
          }
        }
      ];
    }
  };
  const hdf5 = new HDF5Source(backend);
  const metadata = await hdf5.getScientificMetadata();
  expect(metadata.variables[0].name).toBe('/wind/u');
  expect(metadata.dimensions.map(dimension => dimension.length)).toEqual([2, 3]);
  const result = await hdf5.readScientificVariable('/wind/u', {'/wind/u:dim_1': [1, 3]});
  expect(Array.from(result.data as Float32Array)).toEqual([2, 3, 5, 6]);
  expect(result.shape).toEqual([2, 2]);
  const netcdf = new NetCDF4Source(backend);
  const netcdfMetadata = await netcdf.getScientificMetadata();
  expect(netcdfMetadata.variables[0].units).toBe('m s-1');
  await expect(hdf5.readScientificVariable('/missing')).rejects.toThrow(/unknown dataset/);
});
