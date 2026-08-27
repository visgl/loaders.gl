import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {setLoaderOptions, fetchFile, load} from '@loaders.gl/core';
import {getTableRowAsObject} from '@loaders.gl/schema-utils';
import {convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {getGeoMetadata} from '@loaders.gl/geoarrow';
import {GeoPackageLoader} from '@loaders.gl/geopackage';
import * as geopackage from '@loaders.gl/geopackage';
import * as bundledGeopackage from '@loaders.gl/geopackage/bundled';
import * as unbundledGeopackage from '@loaders.gl/geopackage/unbundled';
const GPKG_RIVERS = '@loaders.gl/geopackage/test/data/rivers_small.gpkg';
const GPKG_RIVERS_MULTI = '@loaders.gl/geopackage/test/data/rivers_multi.gpkg';
const GPKG_RIVERS_GEOJSON = '@loaders.gl/geopackage/test/data/rivers_small.geojson';
setLoaderOptions({
  _workerType: 'test',
  worker: false
});
test('GeoPackageLoader#loader conformance', () => {
  validateLoader(GeoPackageLoader, 'GeoPackageLoader');
});
test('GeoPackageLoader#removed Arrow loader exports', () => {
  expect(
    'GeoPackageArrowLoader' in geopackage,
    'root does not export GeoPackageArrowLoader'
  ).toBeFalsy();
  expect(
    'GeoPackageArrowLoader' in bundledGeopackage,
    'bundled does not export GeoPackageArrowLoader'
  ).toBeFalsy();
  expect(
    'GeoPackageArrowLoader' in unbundledGeopackage,
    'unbundled does not export GeoPackageArrowLoader'
  ).toBeFalsy();
});
test('GeoPackageLoader#load file as Arrow table', async () => {
  const table = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {shape: 'arrow-table'}
  });
  const geoMetadata = getGeoMetadata(table.schema.metadata);
  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows, 'loads one feature').toBe(1);
  expect(table.schema.fields.length, 'schema replaces source geom column with geometry').toBe(5);
  expect(geoMetadata?.primary_column, 'geo metadata primary column is set').toBe('geometry');
  expect(geoMetadata?.columns.geometry.encoding, 'geo metadata identifies WKB encoding').toBe(
    'wkb'
  );
  const rows = getRowsFromArrowTable(table);
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: table.schema, data: rows},
    table.schema
  );
  const response = await fetchFile(GPKG_RIVERS_GEOJSON);
  const expected = await response.json();
  expect(normalizeFeatures(roundTripped.features), 'Arrow output round-trips to GeoJSON').toEqual(
    normalizeFeatures(expected.features)
  );
});
test('GeoPackageLoader#load explicit table as Arrow table', async () => {
  const table = await load(GPKG_RIVERS_MULTI, GeoPackageLoader, {
    geopackage: {shape: 'arrow-table', table: 'FEATURESriversds'}
  });
  const rows = getRowsFromArrowTable(table);
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: table.schema, data: rows},
    table.schema
  );
  const geojsonTable = await load(GPKG_RIVERS_MULTI, GeoPackageLoader, {
    geopackage: {shape: 'geojson-table', table: 'FEATURESriversds'}
  });
  expect(
    normalizeFeatures(roundTripped.features),
    'explicit table matches GeoPackageLoader'
  ).toEqual(normalizeFeatures(geojsonTable.features));
});
test('GeoPackageLoader#load default table honors metadata heuristic', async () => {
  const table = await load(GPKG_RIVERS_MULTI, GeoPackageLoader, {
    geopackage: {shape: 'arrow-table'}
  });
  const defaultTable = await load(GPKG_RIVERS_MULTI, GeoPackageLoader, {
    geopackage: {shape: 'arrow-table', table: 'preferred_rivers'}
  });
  expect(
    getRowsFromArrowTable(table),
    'default selection prefers the metadata-marked table'
  ).toEqual(getRowsFromArrowTable(defaultTable));
});
test('GeoPackageLoader#load Arrow table reprojects like GeoJSON output', async () => {
  const arrowTable = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {shape: 'arrow-table'},
    gis: {reproject: true, _targetCrs: 'WGS84'}
  });
  const geojsonTable = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {shape: 'geojson-table'},
    gis: {reproject: true, _targetCrs: 'WGS84'}
  });
  const rows = getRowsFromArrowTable(arrowTable);
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrowTable.schema, data: rows},
    arrowTable.schema
  );
  expect(normalizeFeatures(roundTripped.features), 'reprojected features match').toEqual(
    normalizeFeatures(geojsonTable.features)
  );
});
test('GeoPackageLoader#load missing table errors clearly', async () => {
  try {
    await load(GPKG_RIVERS_MULTI, GeoPackageLoader, {
      geopackage: {shape: 'arrow-table', table: 'missing_table_name'}
    });
    (() => {
      throw new Error('expected load to throw');
    })();
  } catch (error) {
    expect(
      (error as Error).message.includes('GeoPackage table not found: missing_table_name'),
      'throws a clear missing-table error'
    ).toBeTruthy();
  }
});
function getRowsFromArrowTable(table): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    rows.push(getTableRowAsObject(table, rowIndex, {}));
  }
  return rows;
}
function normalizeFeatures(features: any[]) {
  return features.map(feature => {
    const properties = {...(feature.properties || {})};
    const id =
      feature.id !== undefined && feature.id !== null
        ? feature.id
        : (properties.id as string | number);
    if (id !== undefined) {
      delete properties.id;
    }
    return {
      ...feature,
      id,
      properties
    };
  });
}
