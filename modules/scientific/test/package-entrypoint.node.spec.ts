// loaders.gl
// SPDX-License-Identifier: MIT

import {execFileSync} from 'node:child_process';
import {expect, test} from 'vitest';

test.each([
  'commonjs',
  'module'
])('published scientific root stays metadata-only in Node %s', moduleType => {
  const load =
    moduleType === 'commonjs'
      ? "const packageExports = require('@loaders.gl/scientific');"
      : "import * as packageExports from '@loaders.gl/scientific';";
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
  expect(packageInfo.keys).toContain('NetCDFLoader');
  expect(packageInfo.keys).toContain('OMEZarrLoader');
  expect(packageInfo.hasParser).toBe(false);
  expect(packageInfo.hasPreload).toBe('function');
});

test('scientific metadata loaders preload their parser subpaths', async () => {
  const {NetCDFLoader, OMEZarrLoader} = await import('../src');
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
      "const {NetCDFSourceLoader} = require('@loaders.gl/scientific/netcdf'); const {NetCDFSourceLoaderWithParser} = require('@loaders.gl/scientific/netcdf/netcdf-source-loader'); console.log(JSON.stringify({sourceLoader: typeof NetCDFSourceLoader.createDataSourceSync, implementation: typeof NetCDFSourceLoaderWithParser.createDataSourceSync}));"
    ],
    {encoding: 'utf8'}
  );
  expect(JSON.parse(output)).toEqual({sourceLoader: 'function', implementation: 'function'});
});
