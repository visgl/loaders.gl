// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {expect, test} from 'vitest';
import {convertFeaturesToGeoArrowTable} from '@loaders.gl/arrow-geometry/feature-table';

const require = createRequire(import.meta.url);

test('built GeoArrow PMTiles ESM and CommonJS subpaths encode a hermetic table', async () => {
  const esm = await import('../dist/geoarrow.js');
  const commonjs = require('../dist/geoarrow.cjs');
  const cjsGeometry = require('@loaders.gl/arrow-geometry/feature-table');
  const features = [
    {
      type: 'Feature' as const,
      geometry: {type: 'Point' as const, coordinates: [0, 0]},
      properties: {name: 'sample'}
    }
  ];
  const options = {tiles: [{z: 0, x: 0, y: 0}]};
  const expected = await esm.encodeGeoArrowPMTiles(
    convertFeaturesToGeoArrowTable(features),
    options
  );
  expect(
    await commonjs.encodeGeoArrowPMTiles(
      cjsGeometry.convertFeaturesToGeoArrowTable(features),
      options
    )
  ).toEqual(expected);
});

test('PMTiles root packaging import leaves GeoArrow export orchestration in its subpath', async () => {
  const result = await build({
    stdin: {
      contents: "export {PMTilesWriter} from './modules/pmtiles/src/index.ts';",
      resolveDir: process.cwd()
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    packages: 'external',
    metafile: true,
    write: false
  });
  const files = Object.values(result.metafile.outputs).flatMap(output =>
    Object.keys(output.inputs)
  );
  expect(files).not.toContain('modules/pmtiles/src/geoarrow.ts');
  expect(result.outputFiles[0].text).not.toContain(
    '@loaders.gl/mvt/arrow-table-tile-source-loader'
  );
});
