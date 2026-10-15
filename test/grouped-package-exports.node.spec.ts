// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fileSystem from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {expect, test} from 'vitest';
import {globSync} from 'tinyglobby';

const REPOSITORY_ROOT = process.cwd();
const requirePackage = createRequire(path.join(REPOSITORY_ROOT, 'package.json'));

test.each([
  'tables',
  'geospatial'
])('grouped %s package exports resolve to emitted files', group => {
  const directory = path.join(REPOSITORY_ROOT, 'modules', group);
  const manifest = JSON.parse(
    fileSystem.readFileSync(path.join(directory, 'package.json'), 'utf8')
  );
  for (const [subpath, conditions] of Object.entries(manifest.exports)) {
    for (const target of typeof conditions === 'string'
      ? [conditions]
      : Object.values(conditions as Record<string, string>)) {
      expect(globSync(target, {cwd: directory}).length, subpath + ': ' + target).toBeGreaterThan(0);
    }
  }
});

test('grouped and legacy CommonJS roots expose compatible metadata loaders', () => {
  for (const [legacy, group, loader] of [
    ['arrow', 'tables', 'ArrowLoader'],
    ['json', 'tables', 'JSONLoader'],
    ['lance', 'tables', 'LanceLoader'],
    ['orc', 'tables', 'ORCLoader'],
    ['parquet', 'tables', 'ParquetLoader'],
    ['bson', 'tables', 'BSONLoader'],
    ['excel', 'tables', 'ExcelLoader'],
    ['flatgeobuf', 'geospatial', 'FlatGeobufLoader'],
    ['geopackage', 'geospatial', 'GeoPackageLoader'],
    ['csv', 'tables', 'CSVLoader'],
    ['avro', 'tables', 'AvroLoader'],
    ['kml', 'geospatial', 'KMLLoader'],
    ['shapefile', 'geospatial', 'ShapefileLoader']
  ]) {
    const grouped = requirePackage('@loaders.gl/' + group);
    const legacyLoader = requirePackage('@loaders.gl/' + legacy)[loader];
    expect(legacyLoader).toMatchObject({
      id: grouped[loader].id,
      module: grouped[loader].module,
      options: grouped[loader].options
    });
    expect(grouped[loader]).not.toHaveProperty('parse');
    if (legacy === 'parquet') {
      expect(fileSystem.existsSync(grouped[loader].worker)).toBe(true);
      expect(fileSystem.existsSync(legacyLoader.worker)).toBe(true);
    }
    if (legacy === 'excel') {
      expect(typeof legacyLoader.serializeWorkerResult).toBe('function');
      expect(typeof legacyLoader.deserializeWorkerResult).toBe('function');
      expect(grouped[loader]).not.toHaveProperty('serializeWorkerResult');
      expect(grouped[loader]).not.toHaveProperty('deserializeWorkerResult');
    }
  }
});

test('geospatial does not transitively install the table engine group', () => {
  const dependencies = new Set<string>();
  /** Traverses workspace dependencies and required peers, omitting optional peers. */
  function visitPackage(packageName: string): void {
    if (dependencies.has(packageName)) return;
    dependencies.add(packageName);
    if (!packageName.startsWith('@loaders.gl/')) return;
    const manifest = JSON.parse(
      fileSystem.readFileSync(
        path.join(
          REPOSITORY_ROOT,
          'modules',
          packageName.slice('@loaders.gl/'.length),
          'package.json'
        ),
        'utf8'
      )
    );
    const requiredPeers = Object.fromEntries(
      Object.entries(manifest.peerDependencies || {}).filter(
        ([dependency]) => !manifest.peerDependenciesMeta?.[dependency]?.optional
      )
    );
    for (const dependency of Object.keys({
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
      ...requiredPeers
    }))
      visitPackage(dependency);
  }
  visitPackage('@loaders.gl/geospatial');
  for (const dependency of [
    '@loaders.gl/tables',
    '@loaders.gl/arrow',
    '@loaders.gl/json',
    'bson',
    'xlsx',
    'parquet-wasm'
  ])
    expect(dependencies.has(dependency), dependency).toBe(false);
});

test.each([
  ['lance/lance-source-loader-types', 'LanceSourceLoader'],
  ['lance/lance-source-loader', 'LanceSourceLoader'],
  ['json/ndgeojson-loader-types', 'NDGeoJSONLoader']
])('published %s declarations retain the %s public type', (entrypoint, exportName) => {
  const declaration = fileSystem.readFileSync(
    path.join(REPOSITORY_ROOT, 'modules/tables/dist', entrypoint + '.d.ts'),
    'utf8'
  );
  expect(declaration).not.toMatch(new RegExp('export declare const ' + exportName + ':\\s*any;'));
  expect(declaration).toContain('export declare const ' + exportName + ': {');
});
