// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import test from 'tape-promise/tape';
import {HDF5Source} from '../../src/hdf5';
import {NetCDF4Source} from '../../src/netcdf/netcdf4-source';

test('HDF5 backend separation, multidimensional slicing, and NetCDF units', async t => {
  const backend = {
    async listDatasets() {
      return [{path: '/wind/u', dataset: {
        shape: [2, 3], dtype: 'float32',
        attributes: {units: 'm s-1'},
        async read() {return new Float32Array([1, 2, 3, 4, 5, 6]);}
      }}];
    }
  };
  const hdf5 = new HDF5Source(backend);
  const metadata = await hdf5.getScientificMetadata();
  t.equal(metadata.variables[0].name, '/wind/u');
  t.deepEqual(metadata.dimensions.map(d => d.length), [2, 3]);
  const result = await hdf5.readScientificVariable('/wind/u', {'/wind/u:dim_1': [1, 3]});
  t.deepEqual(Array.from(result.data as Float32Array), [2, 3, 5, 6]);
  t.deepEqual(result.shape, [2, 2]);
  const netcdf = new NetCDF4Source(backend);
  const ncMetadata = await netcdf.getScientificMetadata();
  t.equal(ncMetadata.variables[0].units, 'm s-1');
  await t.rejects(hdf5.readScientificVariable('/missing'), /unknown dataset/);
  t.end();
});
