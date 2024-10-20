// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Feature, BinaryFeatureCollection} from '@loaders.gl/schema';

import {getGeometryInfo} from '../geometry-api/geometry-info';
import {convertGeojsonToFlatGeojson} from './convert-geojson-to-flat-geojson';
import {convertFlatGeojsonToBinaryFeatureCollection} from './convert-flat-geojson-to-binary-features';

/**
 * Options for `geojsonToBinary`
 */
export type GeojsonToBinaryOptions = {
  fixRingWinding: boolean;
  numericPropKeys?: string[];
  PositionDataType?: Float32ArrayConstructor | Float64ArrayConstructor;
  triangulate?: boolean;
};

/**
 * Convert GeoJSON features to flat binary arrays
 *
 * @param features
 * @param options
 * @returns features in binary format, grouped by geometry type
 */
export function convertGeojsonToBinaryFeatureCollection(
  features: Feature[],
  options: GeojsonToBinaryOptions = {fixRingWinding: true, triangulate: true}
): BinaryFeatureCollection {
  const geometryInfo = getGeometryInfo(features);
  const coordLength = geometryInfo.coordLength;
  const {fixRingWinding} = options;
  const flatFeatures = convertGeojsonToFlatGeojson(features, {coordLength, fixRingWinding});
  return convertFlatGeojsonToBinaryFeatureCollection(flatFeatures, geometryInfo, {
    numericPropKeys: options.numericPropKeys,
    PositionDataType: options.PositionDataType || Float32Array,
    triangulate: options.triangulate
  });
}
