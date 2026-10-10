// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as gis from '../src';
import * as geoarrow from '@loaders.gl/geoarrow';

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
