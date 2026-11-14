import {expect, test} from 'vitest';
import {NetCDFSource} from '../../src/netcdf/netcdf-source-loader';
import {NetCDFLoader} from '@loaders.gl/scientific/netcdf';

test('NetCDF root source loader preloads the explicit implementation', async () => {
  const implementation = await NetCDFLoader.preload();
  expect(implementation.createDataSourceSync(new Blob())).toBeInstanceOf(NetCDFSource);
});
