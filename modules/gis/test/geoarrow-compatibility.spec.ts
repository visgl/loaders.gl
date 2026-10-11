// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as gis from '../src';
import * as geoarrow from '@loaders.gl/geoarrow';
import type {Feature, Schema} from '@loaders.gl/schema';

test('GIS forwards retained application APIs to the independent GeoArrow implementation', () => {
  expect(gis.GeometryConverter).toBe(geoarrow.GeometryConverter);
  expect(gis.FeatureCollectionConverter).toBe(geoarrow.FeatureCollectionConverter);
  expect(gis.GeometryColumnConverter).toBe(geoarrow.GeoArrowGeometryConverter);
  expect(gis.convertGeometryValuesToBinaryFeatureCollection).toBe(
    geoarrow.convertGeometryValuesToBinaryFeatureCollection
  );
  expect(gis.convertArrowBinaryFeatureCollectionToBinaryFeatureCollection).toBe(
    geoarrow.convertArrowBinaryFeatureCollectionToBinaryFeatureCollection
  );
  expect(gis.GIS_CONVERTERS).toEqual([
    geoarrow.FeatureCollectionConverter,
    geoarrow.GeometryConverter
  ]);
});

test('GIS binary-to-GeoJSON compatibility aliases preserve the GeoArrow result', () => {
  const features: Feature[] = [
    {type: 'Feature', properties: {name: 'point'}, geometry: {type: 'Point', coordinates: [1, 2]}}
  ];
  const binary = geoarrow.convertGeojsonToBinaryFeatureCollection(features);
  const expected = geoarrow.convertBinaryFeatureCollectionToGeojson(binary);
  expect(gis.convertBinaryFeatureCollectionToGeojson(binary)).toEqual(expected);
  expect(gis.binaryToGeojson(binary)).toEqual(expected);
});

test('GIS WKB table compatibility wrapper preserves geometry, properties and schema', () => {
  const geometry = {type: 'Point' as const, coordinates: [1, 2]};
  const schema: Schema = {
    fields: [],
    metadata: {
      geo: JSON.stringify({
        version: '1.1.0',
        primary_column: 'geometry',
        columns: {geometry: {encoding: 'WKB', geometry_types: ['Point']}}
      })
    }
  };
  const table = {
    shape: 'object-row-table' as const,
    schema,
    data: [{geometry: geoarrow.convertGeometryToWKB(geometry), name: 'point'}]
  };
  const result = gis.convertWKBTableToGeoJSON(table, schema);
  expect(result.schema).toBe(schema);
  expect(result.shape).toBe('geojson-table');
  expect(result.features).toEqual([{type: 'Feature', geometry, properties: {name: 'point'}}]);
});
