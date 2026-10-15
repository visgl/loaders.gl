// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import initSqlJs from 'sql.js';
import type {SqlJsStatic, Database} from 'sql.js';
import {GeoPackageSource} from '@loaders.gl/geopackage';
import {getTileBounds} from '@math.gl/geospatial';
import {listGeoPackageTileTables} from '../src/lib/geopackage-tile-metadata';

let sqlite: SqlJsStatic;
beforeAll(async () => {
  sqlite = await initSqlJs({locateFile: file => `/node_modules/sql.js/dist/${file}`});
});

/** Creates a tiny raster-only database with empty tile tables and noncontiguous levels. */
function createDatabase(): Database {
  const database = new sqlite.Database();
  database.run(`
    CREATE TABLE regional (id INTEGER PRIMARY KEY, zoom_level INTEGER, tile_column INTEGER, tile_row INTEGER, tile_data BLOB);
    CREATE TABLE local (id INTEGER PRIMARY KEY, zoom_level INTEGER, tile_column INTEGER, tile_row INTEGER, tile_data BLOB);
    CREATE TABLE gpkg_contents (table_name TEXT, data_type TEXT, identifier TEXT, description TEXT, srs_id INTEGER);
    CREATE TABLE gpkg_spatial_ref_sys (srs_id INTEGER, organization TEXT, organization_coordsys_id INTEGER, definition TEXT);
    CREATE TABLE gpkg_tile_matrix_set (table_name TEXT, srs_id INTEGER, min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE);
    CREATE TABLE gpkg_tile_matrix (table_name TEXT, zoom_level INTEGER, matrix_width INTEGER, matrix_height INTEGER, tile_width INTEGER, tile_height INTEGER, pixel_x_size DOUBLE, pixel_y_size DOUBLE);
    INSERT INTO gpkg_spatial_ref_sys VALUES (42, 'EPSG', 3857, 'undefined'), (-1, 'NONE', -1, 'undefined');
    INSERT INTO gpkg_contents VALUES ('regional', 'tiles', 'Regional', 'Unequal pixel sizes', 42), ('local', 'tiles', NULL, NULL, -1);
    INSERT INTO gpkg_tile_matrix_set VALUES ('regional', 42, 100, 176, 148, 200), ('local', -1, 0, 0, 1, 1);
    INSERT INTO gpkg_tile_matrix VALUES ('regional', 7, 6, 4, 4, 2, 2, 3), ('regional', 2, 3, 2, 4, 2, 4, 6);
  `);
  return database;
}

test('tile-table metadata preserves native ids, authority CRS, and independent pixel sizes', () => {
  const database = createDatabase();
  try {
    const tables = listGeoPackageTileTables(database);
    expect(tables.map(table => table.name)).toEqual(['local', 'regional']);
    expect(tables[0].crs).toBeUndefined();
    expect(tables[0].tileGrid.tileMatrixSet).toBeUndefined();
    const regional = tables[1];
    expect(regional.srsId).toBe(42);
    expect(regional.crs).toBe('EPSG:3857');
    expect(regional.bounds).toEqual([
      [100, 176],
      [148, 200]
    ]);
    expect(regional.tileGrid.matrixIds).toEqual(['2', '7']);
    expect(regional.tileGrid.limits).toBeUndefined();
    expect(getTileBounds(regional.tileGrid.tileMatrixSet!.matrices[1], 1, 1)).toEqual([
      108, 188, 116, 194
    ]);
  } finally {
    database.close();
  }
});

test('raster-only GeoPackage source exposes tileTables without requiring feature tables', async () => {
  const database = createDatabase();
  const blob = new Blob([new Uint8Array(database.export())]);
  database.close();
  const source = GeoPackageSource.createDataSource(blob, {
    geopackage: {sqlJsCDN: '/node_modules/sql.js/dist/'}
  });
  const metadata = await source.getMetadata();
  expect(metadata.tables).toEqual([]);
  expect(metadata.tileTables.map(table => table.name)).toEqual(['local', 'regional']);
  await expect(source.getQueryMetadata()).rejects.toThrow('no vector feature tables');
});

test.each([
  "UPDATE gpkg_tile_matrix SET pixel_y_size = 0 WHERE table_name = 'regional'",
  "UPDATE gpkg_tile_matrix SET matrix_width = 1.5 WHERE table_name = 'regional'",
  "UPDATE gpkg_tile_matrix SET zoom_level = -1 WHERE table_name = 'regional'",
  "UPDATE gpkg_tile_matrix SET zoom_level = 2 WHERE table_name = 'regional'",
  "UPDATE gpkg_tile_matrix_set SET srs_id = 999 WHERE table_name = 'regional'",
  "DELETE FROM gpkg_tile_matrix_set WHERE table_name = 'regional'",
  'DELETE FROM gpkg_spatial_ref_sys WHERE srs_id = 42',
  "UPDATE gpkg_tile_matrix_set SET max_x = min_x WHERE table_name = 'regional'"
])('rejects malformed tile metadata: %s', query => {
  const database = createDatabase();
  try {
    database.run(query);
    expect(() => listGeoPackageTileTables(database)).toThrow('Invalid GeoPackage');
  } finally {
    database.close();
  }
});

test('feature-only databases need no tile metadata tables', () => {
  const database = new sqlite.Database();
  try {
    database.run('CREATE TABLE gpkg_contents (data_type TEXT, table_name TEXT)');
    expect(listGeoPackageTileTables(database)).toEqual([]);
  } finally {
    database.close();
  }
});

test('mixed packages keep vector default selection alongside tile-table metadata', async () => {
  const database = createDatabase();
  database.run(`
    ALTER TABLE gpkg_contents ADD COLUMN last_change TEXT;
    ALTER TABLE gpkg_contents ADD COLUMN min_x DOUBLE;
    ALTER TABLE gpkg_contents ADD COLUMN min_y DOUBLE;
    ALTER TABLE gpkg_contents ADD COLUMN max_x DOUBLE;
    ALTER TABLE gpkg_contents ADD COLUMN max_y DOUBLE;
    CREATE TABLE gpkg_geometry_columns (table_name TEXT, column_name TEXT, geometry_type_name TEXT, srs_id INTEGER, z INTEGER, m INTEGER);
    CREATE TABLE features (fid INTEGER PRIMARY KEY, geom BLOB, name TEXT);
    INSERT INTO gpkg_contents (table_name, data_type, srs_id) VALUES ('features', 'features', 42);
    INSERT INTO gpkg_geometry_columns VALUES ('features', 'geom', 'POINT', 42, 0, 0);
  `);
  const blob = new Blob([new Uint8Array(database.export())]);
  database.close();
  const source = GeoPackageSource.createDataSource(blob, {
    geopackage: {sqlJsCDN: '/node_modules/sql.js/dist/'}
  });
  const metadata = await source.getMetadata();
  expect(metadata.tables).toHaveLength(1);
  expect(metadata.tables[0]).toMatchObject({
    name: 'features',
    isDefault: true,
    geometryColumnName: 'geom'
  });
  expect(metadata.tables[0].schema.fields.map(field => field.name)).toEqual([
    'fid',
    'name',
    'geometry'
  ]);
  expect(metadata.tileTables.map(table => table.name)).toEqual(['local', 'regional']);
});

test.each([
  "UPDATE gpkg_tile_matrix SET matrix_width = 1 WHERE table_name = 'regional'",
  "UPDATE gpkg_tile_matrix SET matrix_height = 1 WHERE table_name = 'regional'",
  "UPDATE gpkg_tile_matrix SET pixel_x_size = pixel_x_size * 1.01 WHERE table_name = 'regional'",
  "UPDATE gpkg_tile_matrix SET pixel_y_size = pixel_y_size * 1.01 WHERE table_name = 'regional'",
  "UPDATE gpkg_tile_matrix SET pixel_x_size = 1e308 WHERE table_name = 'regional'",
  "UPDATE gpkg_tile_matrix_set SET min_x = -1e308, max_x = 1e308 WHERE table_name = 'regional'"
])('rejects matrix geometry inconsistent with the declared extent: %s', query => {
  const database = createDatabase();
  try {
    database.run(query);
    expect(() => listGeoPackageTileTables(database)).toThrow('dimensions disagree with bounds');
  } finally {
    database.close();
  }
});

test('extent validation accepts floating-point roundoff in decimal pixel sizes', () => {
  const database = createDatabase();
  try {
    database.run(`
      UPDATE gpkg_tile_matrix_set SET min_x = 0, max_x = 0.3, min_y = 0, max_y = 0.6 WHERE table_name = 'regional';
      UPDATE gpkg_tile_matrix SET pixel_x_size = 0.3 / (matrix_width * tile_width), pixel_y_size = 0.6 / (matrix_height * tile_height) WHERE table_name = 'regional';
    `);
    expect(listGeoPackageTileTables(database)[1].tileGrid.tileMatrixSet).toBeDefined();
  } finally {
    database.close();
  }
});
