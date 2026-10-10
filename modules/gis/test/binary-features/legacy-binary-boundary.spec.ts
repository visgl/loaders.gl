// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {Feature} from '@loaders.gl/schema';
import {
  convertGeojsonToBinaryFeatureCollection,
  convertGeojsonToFlatGeojson,
  convertFlatGeojsonToBinaryFeatureCollection,
  getGeometryInfo
} from '@loaders.gl/arrow-geometry/legacy-binary';
import {geojsonToBinary, geojsonToFlatGeojson, flatGeojsonToBinary} from '@loaders.gl/gis';

test('GIS legacy aliases preserve the shared binary materializer output', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      id: 'point',
      properties: {value: 7},
      geometry: {type: 'Point', coordinates: [1, 2]}
    }
  ];
  const options = {fixRingWinding: false, PositionDataType: Float64Array, triangulate: false};
  const flatFeatures = convertGeojsonToFlatGeojson(features);
  const geometryInfo = getGeometryInfo(features);

  expect(geojsonToBinary(features, options)).toEqual(
    convertGeojsonToBinaryFeatureCollection(features, options)
  );
  expect(geojsonToFlatGeojson(features)).toEqual(flatFeatures);
  expect(flatGeojsonToBinary(flatFeatures, geometryInfo, options)).toEqual(
    convertFlatGeojsonToBinaryFeatureCollection(flatFeatures, geometryInfo, options)
  );
});
