import {expect, test} from 'vitest';
import {load, fetchFile} from '@loaders.gl/core';
import {GeoPackageLoader} from '@loaders.gl/geopackage';
import {getProjection} from '../src/lib/parse-geopackage';
import type {GeoPackageVectorTableInfo} from '../src/lib/types';
// import type {Tables, ObjectRowTable, Feature} from '@loaders.gl/schema';
const GPKG_RIVERS = '@loaders.gl/geopackage/test/data/rivers_small.gpkg';
const GPKG_RIVERS_GEOJSON = '@loaders.gl/geopackage/test/data/rivers_small.geojson';

test('GeoPackage reprojection requires a declared source CRS', () => {
  const vectorTable = {name: 'roads'} as GeoPackageVectorTableInfo;
  const options = {reproject: true, targetCrs: 'WGS84' as const};

  expect(() => getProjection(vectorTable, {}, options)).toThrow(
    'GeoPackage reprojection requires a source CRS identifier for table "roads"'
  );
  expect(() => getProjection({...vectorTable, srsId: 999}, {}, options)).toThrow(
    'GeoPackage reprojection requires a defined source CRS for SRS 999'
  );
  expect(getProjection({...vectorTable, srsId: 4326}, {4326: 'WGS84'}, options)).toBeDefined();
});

test('GeoPackageLoader#load file as tables', async () => {
  const result = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {
      shape: 'tables'
    }
  });
  const response = await fetchFile(GPKG_RIVERS_GEOJSON);
  const json = await response.json();
  expect(result.shape).toBe('tables');
  if (result.shape === 'tables') {
    const tableName = result.tables[0].name;
    const table = result.tables[0].table;
    expect(tableName, 'loaded correct table name').toBe('FEATURESriversds');
    expect(table.features.length, 'Correct number of rows received').toBe(1);
    expect(table.features[0], 'GeoPackage matches GeoJSON from OGR').toEqual(json.features[0]);
    expect(table.schema).toBeTruthy();
    expect(table.schema?.fields.length).toBe(5);
  }
});
test('GeoPackageLoader#load supports core.shape', async () => {
  const result = await load(GPKG_RIVERS, GeoPackageLoader, {
    core: {shape: 'geojson-table'}
  });
  expect(result.shape).toBe('geojson-table');
  if (result.shape === 'geojson-table') {
    expect(result.features.length).toBe(1);
  }
});
test('GeoPackageLoader#loader shape overrides core.shape', async () => {
  const result = await load(GPKG_RIVERS, GeoPackageLoader, {
    core: {shape: 'geojson-table'},
    geopackage: {shape: 'tables'}
  });
  expect(result.shape).toBe('tables');
});
test('GeoPackageLoader#load file and reproject to WGS84', async () => {
  const result = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {shape: 'tables'},
    gis: {reproject: true, _targetCrs: 'WGS84'}
  });
  expect(result.shape).toBe('tables');
  if (result.shape === 'tables') {
    const tableName = result.tables[0].name;
    const table = result.tables[0].table;
    expect(tableName, 'loaded correct table name').toBe('FEATURESriversds');
    expect(
      // @ts-expect-error ignore geometry collection
      table.features[0].geometry.coordinates.every(coord =>
        insideBbox(coord, [-180, -90, 180, 90])
      ),
      'All coordinates in WGS84 lon-lat bounding box'
    ).toBeTruthy();
    expect(table.schema).toBeTruthy();
    expect(table.schema?.fields.length).toBe(5);
  }
});
function insideBbox(coord: [number, number], bbox: number[]): boolean {
  const [minx, miny, maxx, maxy] = bbox;
  return coord[0] >= minx && coord[0] <= maxx && coord[1] >= miny && coord[1] <= maxy;
}
