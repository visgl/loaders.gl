// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fileSystem from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

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
    for (const target of Object.values(conditions as Record<string, string>)) {
      expect(fileSystem.existsSync(path.join(directory, target)), subpath + ': ' + target).toBe(
        true
      );
    }
  }
});

test('grouped and legacy CommonJS roots expose compatible metadata loaders', () => {
  for (const [legacy, group, loader] of [
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
    if (legacy === 'excel') {
      expect(typeof legacyLoader.serializeWorkerResult).toBe('function');
      expect(typeof legacyLoader.deserializeWorkerResult).toBe('function');
      expect(grouped[loader]).not.toHaveProperty('serializeWorkerResult');
      expect(grouped[loader]).not.toHaveProperty('deserializeWorkerResult');
    }
  }
});
