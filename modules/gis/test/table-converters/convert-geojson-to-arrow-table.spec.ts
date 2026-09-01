// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {GEOARROW_TEST_CASES} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';
import {fetchFile, parse} from '@loaders.gl/core';
import {Feature, FeatureCollection} from '@loaders.gl/schema';
import {GeoArrowLoader} from '@loaders.gl/arrow';
import {
  convertFeaturesToGeoArrowTable,
  getGeoMetadata,
  type LegacyGeoJSONCRS
} from '@loaders.gl/gis';
test('ArrowLoader#shape:geojson-table', async () => {
  for (const testCase of GEOARROW_TEST_CASES) {
    await testConversion(testCase[0], testCase[1]);
  }
});
async function testConversion(
  arrowFile: string,
  expectedGeojson: FeatureCollection
): Promise<void> {
  const table = await parse(fetchFile(arrowFile), GeoArrowLoader, {
    core: {worker: false},
    arrow: {shape: 'geojson-table'}
  });
  expect(table.shape).toBe('geojson-table');
  if (table.shape === 'geojson-table') {
    // check if the arrow table is loaded correctly
    expect(table.features.length, `arrow table has ${expectedGeojson.features.length} row`).toBe(
      expectedGeojson.features.length
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
    expect(
      firstFeature?.geometry,
      'firstFeature.geometry is equal to expectedGeojson.features[0].geometry'
    ).toEqual(expectedGeojson.features[0].geometry);
  }
}
test('convertFeaturesToGeoArrowTable#preserves arbitrary legacy GeoJSON CRS metadata', () => {
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
  expect(
    geometryColumnMetadata?.geojson_crs,
    'preserves raw legacy CRS on GeoParquet column metadata'
  ).toEqual(crs);
  expect(
    extensionMetadata.geojson_crs,
    'preserves raw legacy CRS on GeoArrow field metadata'
  ).toEqual(crs);
  expect(geometryColumnMetadata?.crs, 'does not map unknown CRS to GeoArrow CRS').toBe(undefined);
});
test('convertFeaturesToGeoArrowTable#maps known legacy GeoJSON CRS metadata', () => {
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
  expect(geometryColumnMetadata?.geojson_crs, 'preserves raw legacy CRS').toEqual(crs);
  expect(
    (geometryColumnMetadata?.crs as any)?.id?.authority,
    'maps EPSG:4326 to GeoParquet CRS metadata'
  ).toBe('EPSG');
  expect(
    (extensionMetadata.crs as any)?.id?.code,
    'maps EPSG:4326 to GeoArrow field CRS metadata'
  ).toBe(4326);
  expect(extensionMetadata.crs_type, 'sets GeoArrow CRS metadata type').toBe('projjson');
});
test('convertFeaturesToGeoArrowTable#applies legacy GeoJSON CRS to custom geometry column', () => {
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
  expect(geoMetadata?.columns.geom.geojson_crs, 'stores CRS under custom column').toEqual(crs);
  expect(geoMetadata?.columns.geometry, 'does not create default geometry metadata').toBe(
    undefined
  );
  expect(
    (extensionMetadata.crs as any)?.id?.code,
    'maps CRS84 to GeoArrow field CRS metadata'
  ).toBe('CRS84');
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

test('convertFeaturesToGeoArrowTable#supports encoding preferences', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {name: 'A'},
      geometry: {type: 'Point', coordinates: [1, 2]}
    },
    {
      type: 'Feature',
      properties: {name: 'B'},
      geometry: {type: 'Point', coordinates: [3, 4]}
    }
  ];

  const wkbTable = convertFeaturesToGeoArrowTable(features, {
    encodingPreference: 'geoarrow.wkb'
  });
  expect(wkbTable.data.schema.fields.at(-1)?.metadata?.get('ARROW:extension:name')).toBe(
    'geoarrow.wkb'
  );

  const optimizedTable = convertFeaturesToGeoArrowTable(features, {
    encodingPreference: 'optimized'
  });
  expect(optimizedTable.data.schema.fields.at(-1)?.metadata?.get('ARROW:extension:name')).toBe(
    'geoarrow.point'
  );

  const unionTable = convertFeaturesToGeoArrowTable(features, {
    encodingPreference: 'geoarrow.geometry'
  });
  expect(unionTable.data.schema.fields.at(-1)?.type).toBeInstanceOf(arrow.DenseUnion);
});

test('convertFeaturesToGeoArrowTable#uses a stable union for mixed and null geometries', () => {
  const table = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [1, 1]
          ]
        }
      },
      {type: 'Feature', properties: {}, geometry: null}
    ],
    {encodingPreference: 'optimized'}
  );

  const geometryField = table.data.schema.fields.at(-1);
  const geometryColumn = table.data.getChild('geometry');
  expect(geometryField?.type).toBeInstanceOf(arrow.DenseUnion);
  expect(geometryColumn?.length).toBe(3);
  expect(geometryColumn?.get(2)).toBeNull();
});

test('convertFeaturesToGeoArrowTable#promotes single geometries into multi encodings', () => {
  const table = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {type: 'Feature', properties: {}, geometry: {type: 'MultiPoint', coordinates: [[3, 4]]}}
    ],
    {encodingPreference: 'optimized'}
  );

  expect(table.data.schema.fields.at(-1)?.metadata?.get('ARROW:extension:name')).toBe(
    'geoarrow.multipoint'
  );
});
