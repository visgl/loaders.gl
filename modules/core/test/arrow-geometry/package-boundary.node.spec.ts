// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {expect, test} from 'vitest';
import {preProcessFile} from 'typescript';

const modulesDirectory = fileURLToPath(new URL('../../..', import.meta.url));

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
  'arcgis',
  'tiles',
  'ogc',
  'tables',
  'geospatial'
])('%s does not depend on GIS or the GeoArrow processing package', moduleName => {
  const directory = join(modulesDirectory, moduleName);
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    expect(manifest[section] ?? {}).not.toHaveProperty('@loaders.gl/gis');
    expect(manifest[section] ?? {}).not.toHaveProperty('@loaders.gl/geoarrow');
  }
  expect(readSources(join(directory, 'src'))).not.toMatch(
    /(?:from\s+|import\s*\()(['"])@loaders\.gl\/(?:gis|geoarrow|core\/geoarrow)(?:\/|\1)/
  );
  expect(readSources(join(directory, 'src'))).not.toMatch(
    /(?:from\s+|import\s*\()(['"])@loaders\.gl\/core\1/
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

test('core geometry utilities are independent of GIS and other loader packages', () => {
  const directory = join(modulesDirectory, 'core');
  expect(readSources(join(directory, 'src/arrow-geometry'))).not.toMatch(
    /@loaders\.gl\/(?!core(?:\/|['"]))/
  );
  expect(readSources(join(directory, 'src/geoarrow'))).not.toMatch(
    /@loaders\.gl\/(?!core(?:\/|['"]))/
  );
  expect(collectDependencies('core')).toEqual(new Set(['core']));
});

test.each([
  'arcgis',
  'tiles',
  'ogc',
  'tables',
  'geospatial'
])('%s does not acquire GeoArrow through a compatibility dependency', moduleName => {
  expect(collectDependencies(moduleName)).not.toContain('geoarrow');
  expect(collectDependencies(moduleName)).not.toContain('gis');
});

test('the schema root keeps runtime geospatial validation on its explicit subpath', () => {
  const directory = join(modulesDirectory, 'core');
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  expect(manifest.exports['./schema/geospatial-metadata-zod-schema']).toMatchObject({
    import: './dist/schema/geospatial-metadata-zod-schema.js',
    require: './dist/schema/geospatial-metadata-zod-schema.cjs'
  });
  expect(readFileSync(join(directory, 'src/schema/index.ts'), 'utf8')).not.toMatch(
    /from ['"](?:zod|.*geospatial-metadata-zod-schema)['"]/
  );
});

test('published consumers and their tests no longer require the GIS compatibility package', () => {
  expect(existsSync(join(modulesDirectory, 'gis'))).toBe(false);
  const moduleNames = readdirSync(modulesDirectory).filter(moduleName =>
    existsSync(join(modulesDirectory, moduleName, 'package.json'))
  );
  for (const moduleName of moduleNames) {
    const directory = join(modulesDirectory, moduleName);
    const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
    for (const section of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies'
    ]) {
      expect(manifest[section] ?? {}, moduleName).not.toHaveProperty('@loaders.gl/gis');
    }
    expect(collectDependencies(moduleName), moduleName).not.toContain('gis');
    const project = join(directory, 'tsconfig.json');
    if (existsSync(project)) {
      const projectConfiguration = JSON.parse(readFileSync(project, 'utf8'));
      for (const reference of projectConfiguration.references || []) {
        expect(reference.path, moduleName).not.toMatch(/(?:^|\/)gis(?:\/|$)/);
      }
    }
    for (const folder of ['src', 'test']) {
      if (!existsSync(join(directory, folder))) continue;
      const source = readSources(join(directory, folder));
      const imports = preProcessFile(source, true, true).importedFiles.map(file => file.fileName);
      expect(
        imports.filter(name => /^@loaders\.gl\/gis(?:\/|$)/.test(name)),
        moduleName
      ).toEqual([]);
      expect(source, moduleName).not.toContain('@loaders.gl/' + 'gis/test/data/');
    }
  }
});

test('repository build and test wiring does not require the removed GIS package', () => {
  for (const filename of [
    'package.json',
    'tsconfig.json',
    'test/aliases.ts',
    'test/modules.ts',
    'test/coverage-thresholds.json'
  ]) {
    expect(readFileSync(join(modulesDirectory, '..', filename), 'utf8'), filename).not.toContain(
      '@loaders.gl/' + 'gis'
    );
  }
  // Published deck.gl still requires GIS 4.x; only the retired workspace resolution is forbidden.
  expect(readFileSync(join(modulesDirectory, '../yarn.lock'), 'utf8')).not.toContain(
    'workspace:modules/' + 'gis'
  );
});

test('the geospatial example uses GeoArrow rather than GIS', () => {
  const directory = join(modulesDirectory, '../examples/website/geospatial');
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  expect(manifest.dependencies).toHaveProperty('@loaders.gl/core');
  expect(manifest.dependencies).not.toHaveProperty('@loaders.gl/gis');
  expect(readFileSync(join(directory, 'app.tsx'), 'utf8')).not.toContain('@loaders.gl/gis');
});
