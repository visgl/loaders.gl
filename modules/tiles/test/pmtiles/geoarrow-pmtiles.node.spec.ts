// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {expect, test} from 'vitest';
import {convertFeaturesToGeoArrowTable} from '@loaders.gl/arrow-geometry/feature-table';

const require = createRequire(import.meta.url);

test.each([
  'mvt',
  'mlt'
] as const)('built GeoArrow PMTiles ESM and CommonJS subpaths encode %s', async tileType => {
  const esm = await import('../../dist/pmtiles/geoarrow.js');
  const commonjs = require('../../dist/pmtiles/geoarrow.cjs');
  const cjsGeometry = require('@loaders.gl/arrow-geometry/feature-table');
  const features = [
    {
      type: 'Feature' as const,
      geometry: {type: 'Point' as const, coordinates: [0, 0]},
      properties: {name: 'sample'}
    }
  ];
  const options = {tileType, tiles: [{z: 0, x: 0, y: 0}]};
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
      contents: "export {PMTilesWriter} from './modules/tiles/src/pmtiles/index.ts';",
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
  expect(files).not.toContain('modules/tiles/src/pmtiles/geoarrow.ts');
  expect(files).not.toContain('modules/tiles/src/pmtiles/raster.ts');
  expect(result.outputFiles[0].text).not.toContain(
    '@loaders.gl/tiles/mvt/arrow-table-tile-source-loader'
  );
});

test('installed native Node ESM authoring imports do not eagerly load the MLT decoder', () => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
    import {MLTWriter} from '@loaders.gl/tiles/mlt';
    import {encodeGeoArrowPMTiles} from '@loaders.gl/tiles/pmtiles/geoarrow';
    import {convertFeaturesToGeoArrowTable} from '@loaders.gl/arrow-geometry/feature-table';
    const table = convertFeaturesToGeoArrowTable([{type: 'Feature', geometry: {type: 'Point', coordinates: [0, 0]}, properties: {name: 'sample'}}]);
    const bytes = await encodeGeoArrowPMTiles(table, {tileType: 'mlt', tiles: [{z: 0, x: 0, y: 0}]});
    if (typeof MLTWriter.encodeSync !== 'function' || bytes.byteLength <= 127) throw new Error('Invalid native ESM authoring result');
    process.stdout.write('ok');
  `
    ],
    {cwd: process.cwd(), encoding: 'utf8'}
  );
  expect(output).toBe('ok');
});
