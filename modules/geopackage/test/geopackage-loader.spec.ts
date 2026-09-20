import {expect, test} from 'vitest';
import {load, fetchFile} from '@loaders.gl/core';
import {CRSReprojectionError} from '@loaders.gl/loader-utils';
import {GeoPackageLoader} from '@loaders.gl/geopackage';
import {getProjection, getSpatialReferenceSystemDefinition} from '../src/lib/parse-geopackage';
import type {GeoPackageVectorTableInfo, SpatialRefSysRow} from '../src/lib/types';
const GPKG_RIVERS = '@loaders.gl/geopackage/test/data/rivers_small.gpkg';
const GPKG_RIVERS_GEOJSON = '@loaders.gl/geopackage/test/data/rivers_small.geojson';

test('GeoPackage reprojection requires a declared source CRS', () => {
  const vectorTable = {name: 'roads'} as GeoPackageVectorTableInfo;
  const options = {reproject: true, targetCrs: 'WGS84' as const};

  expect(() => getProjection(vectorTable, {}, options)).toThrow(CRSReprojectionError);
  expect(() => getProjection({...vectorTable, srsId: 999}, {}, options)).toThrow(
    'GeoPackage reprojection requires a defined source CRS for SRS 999'
  );
  expect(getProjection({...vectorTable, srsId: 4326}, {4326: 'WGS84'}, options)).toBeDefined();
  expect(() => getProjection({...vectorTable, srsId: 4326}, {4326: 'not a CRS'}, options)).toThrow(
    'GeoPackage reprojection failed'
  );
});

test('GeoPackage prefers extension WKT2 and preserves undefined SRS semantics', () => {
  const spatialReferenceSystem = {
    definition: 'GEOGCS["WKT1"]',
    definition_12_063: 'GEOGCRS["WKT2"]'
  } as SpatialRefSysRow;

  expect(getSpatialReferenceSystemDefinition(spatialReferenceSystem)).toBe('GEOGCRS["WKT2"]');
  expect(
    getSpatialReferenceSystemDefinition({
      ...spatialReferenceSystem,
      definition: 'undefined',
      definition_12_063: null
    })
  ).toBeUndefined();
});

test('GeoPackageLoader#load file as one selected table', async () => {
  const result = await load(GPKG_RIVERS, GeoPackageLoader);
  const response = await fetchFile(GPKG_RIVERS_GEOJSON);
  const json = await response.json();
  expect(result.shape).toBe('arrow-table');
  expect(result.data.numRows, 'Correct number of rows received').toBe(1);
  expect(result.schema).toBeTruthy();
  expect(result.schema?.fields.length).toBe(5);
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
    core: {shape: 'arrow-table'},
    geopackage: {shape: 'geojson-table'}
  });
  expect(result.shape).toBe('geojson-table');
});
test('GeoPackageLoader#load file and reproject to WGS84', async () => {
  const result = await load(GPKG_RIVERS, GeoPackageLoader, {
    geopackage: {shape: 'geojson-table'},
    gis: {reproject: true, targetCrs: 'WGS84'}
  });
  expect(result.shape).toBe('geojson-table');
  expect(
    // @ts-expect-error ignore geometry collection
    result.features[0].geometry.coordinates.every(coord => insideBbox(coord, [-180, -90, 180, 90])),
    'All coordinates in WGS84 lon-lat bounding box'
  ).toBeTruthy();
  expect(result.schema).toBeTruthy();
  expect(result.schema?.fields.length).toBe(5);
});
function insideBbox(coord: [number, number], bbox: number[]): boolean {
  const [minx, miny, maxx, maxy] = bbox;
  return coord[0] >= minx && coord[0] <= maxx && coord[1] >= miny && coord[1] <= maxy;
}
