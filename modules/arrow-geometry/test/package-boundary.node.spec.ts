// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {expect, test} from 'vitest';

const modulesDirectory = fileURLToPath(new URL('../../', import.meta.url));

/** Reads TypeScript source text recursively without following dependency directories. */
function readSources(directory: string): string {
  return readdirSync(directory, {withFileTypes: true})
    .map(entry => {
      const filename = join(directory, entry.name);
      return entry.isDirectory()
        ? readSources(filename)
        : entry.name.endsWith('.ts')
          ? readFileSync(filename, 'utf8')
          : '';
    })
    .join('\n');
}

test.each([
  'arrow',
  'arrow-geometry',
  'arcgis',
  'kml',
  'mlt',
  'wms',
  'csv',
  'json',
  'mvt',
  'flatgeobuf',
  'geopackage',
  'parquet',
  'shapefile'
])('%s does not depend on GIS or the GeoArrow processing package', moduleName => {
  const directory = join(modulesDirectory, moduleName);
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    expect(manifest[section] ?? {}).not.toHaveProperty('@loaders.gl/gis');
    expect(manifest[section] ?? {}).not.toHaveProperty('@loaders.gl/geoarrow');
  }
  expect(readSources(join(directory, 'src'))).not.toMatch(
    /(?:from\s+|import\s*\()(['"])@loaders\.gl\/(?:gis|geoarrow|core)(?:\/|\1)/
  );
});

/** Collects runtime workspace dependencies, stopping at external packages and visited nodes. */
function collectDependencies(moduleName: string, visited = new Set<string>()): Set<string> {
  if (visited.has(moduleName)) return visited;
  visited.add(moduleName);
  const manifest = JSON.parse(
    readFileSync(join(modulesDirectory, moduleName, 'package.json'), 'utf8')
  );
  for (const dependency of Object.keys({
    ...manifest.dependencies,
    ...manifest.optionalDependencies
  })) {
    if (dependency.startsWith('@loaders.gl/')) {
      collectDependencies(dependency.slice('@loaders.gl/'.length), visited);
    }
  }
  return visited;
}

test('GeoArrow is independent of GIS in source, project references and transitive dependencies', () => {
  const directory = join(modulesDirectory, 'geoarrow');
  expect(readSources(join(directory, 'src'))).not.toMatch(/@loaders\.gl\/gis/);
  expect(readFileSync(join(directory, 'tsconfig.json'), 'utf8')).not.toContain('../gis');
  expect(collectDependencies('geoarrow')).not.toContain('gis');
});

test.each([
  'arrow',
  'arcgis',
  'kml',
  'mlt',
  'wms',
  'csv',
  'json',
  'mvt',
  'flatgeobuf',
  'geopackage',
  'parquet',
  'shapefile'
])('%s does not acquire GeoArrow through a compatibility dependency', moduleName => {
  expect(collectDependencies(moduleName)).not.toContain('geoarrow');
  expect(collectDependencies(moduleName)).not.toContain('gis');
});

test('the schema root keeps runtime geospatial validation on its explicit subpath', () => {
  const directory = join(modulesDirectory, 'schema');
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  expect(manifest.exports['./geospatial-metadata-zod-schema']).toMatchObject({
    import: './dist/geospatial-metadata-zod-schema.js',
    require: './dist/geospatial-metadata-zod-schema.cjs'
  });
  expect(readFileSync(join(directory, 'src/index.ts'), 'utf8')).not.toMatch(
    /from ['"](?:zod|.*geospatial-metadata-zod-schema)['"]/
  );
});
