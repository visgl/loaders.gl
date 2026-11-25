// loaders.gl
// SPDX-License-Identifier: MIT

import {execFileSync} from 'node:child_process';
import {expect, test} from 'vitest';

test.each([
  'commonjs',
  'module'
])('published scientific Zarr entry stays metadata-only in Node %s', moduleType => {
  const load =
    moduleType === 'commonjs'
      ? "const packageExports = require('@loaders.gl/scientific/zarr');"
      : "import * as packageExports from '@loaders.gl/scientific/zarr';";
  const output = execFileSync(
    process.execPath,
    [
      `--input-type=${moduleType}`,
      '-e',
      `${load} console.log(JSON.stringify({keys: Object.keys(packageExports), hasParser: 'loadZarr' in packageExports, hasPreload: typeof packageExports.OMEZarrLoader.preload}));`
    ],
    {encoding: 'utf8'}
  );
  const packageInfo = JSON.parse(output);
  expect(packageInfo.keys).toContain('OMEZarrLoader');
  expect(packageInfo.hasParser).toBe(false);
  expect(packageInfo.hasPreload).toBe('function');
});

test('scientific metadata loaders preload their parser subpaths', async () => {
  const {NetCDFLoader} = await import('@loaders.gl/scientific/netcdf');
  const {OMEZarrLoader} = await import('@loaders.gl/scientific/zarr');
  const netcdfParser = await NetCDFLoader.preload();
  const zarrParser = await OMEZarrLoader.preload();
  expect(netcdfParser.parse).toBeTypeOf('function');
  expect(zarrParser.createDataSourceSync).toBeTypeOf('function');
});

test('NetCDF parser subpaths expose their CommonJS implementations', () => {
  const output = execFileSync(
    process.execPath,
    [
      '-e',
      "const {NetCDFLoaderWithParser} = require('@loaders.gl/scientific/netcdf/bundled'); console.log(JSON.stringify({parser: typeof NetCDFLoaderWithParser.parse, implementation: typeof NetCDFLoaderWithParser.createDataSourceSync}));"
    ],
    {encoding: 'utf8'}
  );
  expect(JSON.parse(output)).toEqual({parser: 'function', implementation: 'function'});
});
