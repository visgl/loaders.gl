import {expect, test} from 'vitest';
import {NetCDFSource} from '../src/netcdf-source-loader';
import {NetCDFSourceLoader} from '../src/netcdf-source-loader-types';

test('NetCDF root source loader preloads the explicit implementation', async () => {
  const implementation = await NetCDFSourceLoader.preload();
  expect(implementation.createDataSource(new Blob())).toBeInstanceOf(NetCDFSource);
});
