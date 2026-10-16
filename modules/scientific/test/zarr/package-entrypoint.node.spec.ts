// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {expect, test} from 'vitest';

test.each([
  'commonjs',
  'module'
])('published scientific Zarr parser entrypoint loads in Node %s', moduleType => {
  const load =
    moduleType === 'commonjs'
      ? "const packageExports = require('@loaders.gl/scientific/zarr');"
      : "import * as packageExports from '@loaders.gl/scientific/zarr';";
  const output = execFileSync(
    process.execPath,
    [
      `--input-type=${moduleType}`,
      '-e',
      `${load} console.log(JSON.stringify(Object.keys(packageExports)));`
    ],
    {encoding: 'utf8'}
  );
  expect(JSON.parse(output)).toEqual(
    expect.arrayContaining([
      'loadZarr',
      'ZarrArraySource',
      'OMEZarrSourceLoader',
      'GeoZarrSourceLoader',
      'SpatialDataSourceLoader'
    ])
  );
});
