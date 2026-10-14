// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {expect, test} from 'vitest';

test.each(['commonjs', 'module'])('published Zarr entrypoint loads in Node %s', moduleType => {
  const load = moduleType === 'commonjs'
    ? "const packageExports = require('@loaders.gl/zarr');"
    : "import * as packageExports from '@loaders.gl/zarr';";
  const output = execFileSync(process.execPath, [
    `--input-type=${moduleType}`, '-e',
    `${load} console.log(JSON.stringify(Object.keys(packageExports)));`
  ], {encoding: 'utf8'});
  expect(JSON.parse(output)).toEqual(expect.arrayContaining([
    'loadZarr', 'ZarrArraySource', 'OMEZarrSourceLoader', 'GeoZarrSourceLoader', 'SpatialDataSourceLoader'
  ]));
});
