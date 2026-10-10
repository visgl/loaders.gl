// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Feature, BinaryFeatureCollection} from '@loaders.gl/schema';

import {getGeometryInfo} from './geometry-info';
import {convertGeojsonToFlatGeojson} from './convert-geojson-to-flat-geojson';
import {convertFlatGeojsonToBinaryFeatureCollection} from './convert-flat-geojson-to-binary-features';

/**
 * Options for converting GeoJSON features to the legacy binary representation.
 */
export type GeojsonToBinaryOptions = {
  /** Normalize polygon winding; may reverse input ring coordinate arrays in place. */
  fixRingWinding: boolean;
  /** Property names to encode as numeric attributes; inferred when omitted. */
  numericPropKeys?: string[];
  /** Position storage precision. Defaults to Float32Array. */
  PositionDataType?: Float32ArrayConstructor | Float64ArrayConstructor;
  /** Generate triangle indices for polygons. */
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
