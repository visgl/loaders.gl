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

test('grouped CommonJS format exports expose metadata loaders for every former package', () => {
  for (const [group, format, loader] of [
    ['tables', 'arrow', 'ArrowLoader'],
    ['tables', 'json', 'JSONLoader'],
    ['tables', 'lance', 'LanceLoader'],
    ['tables', 'orc', 'ORCLoader'],
    ['tables', 'parquet', 'ParquetLoader'],
    ['tables', 'bson', 'BSONLoader'],
    ['tables', 'excel', 'ExcelLoader'],
    ['tables', 'csv', 'CSVLoader'],
    ['tables', 'avro', 'AvroLoader'],
    ['geospatial', 'flatgeobuf', 'FlatGeobufLoader'],
    ['geospatial', 'geopackage', 'GeoPackageLoader'],
    ['geospatial', 'kml', 'KMLLoader'],
    ['geospatial', 'shapefile', 'ShapefileLoader']
  ]) {
    const metadataLoader = requirePackage(`@loaders.gl/${group}/${format}`)[loader];
    expect(metadataLoader.id).toBeTruthy();
    expect(metadataLoader).not.toHaveProperty('parse');
    expect(metadataLoader.preload).toBeTypeOf('function');
  }
});

test('geospatial does not transitively install table engines or SQL.js', () => {
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
    '@loaders.gl/tables/arrow/index',
    '@loaders.gl/tables/json/index',
    'bson',
    'xlsx',
    'parquet-wasm',
    'sql.js'
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

test.each(['geospatial'])('%s declares SQL.js as an optional peer', packageName => {
  const manifest = JSON.parse(
    fileSystem.readFileSync(
      path.join(REPOSITORY_ROOT, 'modules', packageName, 'package.json'),
      'utf8'
    )
  );
  expect(manifest.dependencies).not.toHaveProperty('sql.js');
  expect(manifest.peerDependencies['sql.js']).toBe('^1.14.1');
  expect(manifest.peerDependenciesMeta['sql.js']).toEqual({optional: true});
});

test.each([
  ['bson', '4.2.0'],
  ['xlsx', '^0.18.5']
])('tables declares %s as optional', (dependency, version) => {
  const manifest = JSON.parse(
    fileSystem.readFileSync(path.join(REPOSITORY_ROOT, 'modules/tables/package.json'), 'utf8')
  );
  expect(manifest.dependencies).not.toHaveProperty(dependency);
  expect(manifest.optionalDependencies[dependency]).toBe(version);
});
