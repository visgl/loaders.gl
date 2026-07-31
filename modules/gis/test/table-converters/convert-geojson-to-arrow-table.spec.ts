// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test, {Test} from 'tape-promise/tape';
import {GEOARROW_TEST_CASES} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';

import {fetchFile, parse} from '@loaders.gl/core';
import {Feature, FeatureCollection} from '@loaders.gl/schema';
import {GeoArrowLoader} from '@loaders.gl/arrow';
import {
  convertFeaturesToGeoArrowTable,
  getGeoMetadata,
  type LegacyGeoJSONCRS
} from '@loaders.gl/gis';

test('ArrowLoader#shape:geojson-table', async t => {
  for (const testCase of GEOARROW_TEST_CASES) {
    await testConversion(t, testCase[0], testCase[1]);
  }
  t.end();
});

async function testConversion(
  t: Test,
  arrowFile: string,
  expectedGeojson: FeatureCollection
): Promise<void> {
  const table = await parse(fetchFile(arrowFile), GeoArrowLoader, {
    core: {worker: false},
    arrow: {shape: 'geojson-table'}
  });

  t.equal(table.shape, 'geojson-table');

  if (table.shape === 'geojson-table') {
    // check if the arrow table is loaded correctly
    t.equal(
      table.features.length,
      expectedGeojson.features.length,
      `arrow table has ${expectedGeojson.features.length} row`
    );

    // const colNames = [...Object.keys(expectedGeojson.features[0].properties || {}), 'geometry'];
    // t.equal(table.numCols, colNames.length, `arrow table has ${colNames.length} columns`);

    // // check fields exist in arrow table schema
    // table.schema.fields.map((field) =>
    //   t.equal(colNames.includes(field.name), true, `arrow table has ${field.name} column`)
    // );

    // get first geometry from arrow geometry column
    const firstFeature = table.features[0];

    // check if geometry in firstFeature is equal to the original geometry in expectedPointGeojson
    t.deepEqual(
      firstFeature?.geometry,
      expectedGeojson.features[0].geometry,
      'firstFeature.geometry is equal to expectedGeojson.features[0].geometry'
    );
  }
}

test('convertFeaturesToGeoArrowTable#preserves arbitrary legacy GeoJSON CRS metadata', t => {
  const crs: LegacyGeoJSONCRS = {
    type: 'link',
    properties: {
      href: 'https://example.com/custom-crs',
      type: 'proj4'
    }
  };
  const table = convertFeaturesToGeoArrowTable(makePointFeatures(), {crs});
  const geoMetadata = getGeoMetadata(table.schema.metadata);
  const geometryColumnMetadata = geoMetadata?.columns.geometry;
  const geometryField = table.schema.fields.find(field => field.name === 'geometry');
  const extensionMetadata = JSON.parse(
    geometryField?.metadata?.['ARROW:extension:metadata'] || '{}'
  );

  t.deepEqual(
    geometryColumnMetadata?.geojson_crs,
    crs,
    'preserves raw legacy CRS on GeoParquet column metadata'
  );
  t.deepEqual(
    extensionMetadata.geojson_crs,
    crs,
    'preserves raw legacy CRS on GeoArrow field metadata'
  );
  t.equal(geometryColumnMetadata?.crs, undefined, 'does not map unknown CRS to GeoArrow CRS');
  t.end();
});

test('convertFeaturesToGeoArrowTable#maps known legacy GeoJSON CRS metadata', t => {
  const crs: LegacyGeoJSONCRS = {
    type: 'name',
    properties: {
      name: 'EPSG:4326'
    }
  };
  const table = convertFeaturesToGeoArrowTable(makePointFeatures(), {crs});
  const geoMetadata = getGeoMetadata(table.schema.metadata);
  const geometryColumnMetadata = geoMetadata?.columns.geometry;
  const geometryField = table.schema.fields.find(field => field.name === 'geometry');
  const extensionMetadata = JSON.parse(
    geometryField?.metadata?.['ARROW:extension:metadata'] || '{}'
  );

  t.deepEqual(geometryColumnMetadata?.geojson_crs, crs, 'preserves raw legacy CRS');
  t.equal(
    (geometryColumnMetadata?.crs as any)?.id?.authority,
    'EPSG',
    'maps EPSG:4326 to GeoParquet CRS metadata'
  );
  t.equal(
    (extensionMetadata.crs as any)?.id?.code,
    4326,
    'maps EPSG:4326 to GeoArrow field CRS metadata'
  );
  t.equal(extensionMetadata.crs_type, 'projjson', 'sets GeoArrow CRS metadata type');
  t.end();
});

test('convertFeaturesToGeoArrowTable#applies legacy GeoJSON CRS to custom geometry column', t => {
  const crs: LegacyGeoJSONCRS = {
    type: 'name',
    properties: {
      name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
    }
  };
  const table = convertFeaturesToGeoArrowTable(makePointFeatures(), {
    geometryColumnName: 'geom',
    crs
  });
  const geoMetadata = getGeoMetadata(table.schema.metadata);
  const geometryField = table.schema.fields.find(field => field.name === 'geom');
  const extensionMetadata = JSON.parse(
    geometryField?.metadata?.['ARROW:extension:metadata'] || '{}'
  );

  t.deepEqual(geoMetadata?.columns.geom.geojson_crs, crs, 'stores CRS under custom column');
  t.equal(geoMetadata?.columns.geometry, undefined, 'does not create default geometry metadata');
  t.equal(
    (extensionMetadata.crs as any)?.id?.code,
    'CRS84',
    'maps CRS84 to GeoArrow field CRS metadata'
  );
  t.end();
});

function makePointFeatures(): Feature[] {
  return [
    {
      type: 'Feature',
      properties: {name: 'A'},
      geometry: {type: 'Point', coordinates: [1, 2]}
    }
  ];
}
