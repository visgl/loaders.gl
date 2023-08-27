import type {Feature} from '@loaders.gl/schema';
import type {BinaryFeatures} from '@loaders.gl/schema';

import {extractGeometryInfo} from './extract-geometry-info';
import {geojsonToFlatGeojson} from './geojson-to-flat-geojson';
import {flatGeojsonToBinary} from './flat-geojson-to-binary';

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
export function geojsonToBinary(
  features: Feature[],
  options: GeojsonToBinaryOptions = {fixRingWinding: true, triangulate: true}
): BinaryFeatures {
  const geometryInfo = extractGeometryInfo(features);
  const coordLength = geometryInfo.coordLength;
  const {fixRingWinding} = options;
  const flatFeatures = geojsonToFlatGeojson(features, {coordLength, fixRingWinding});
  return flatGeojsonToBinary(flatFeatures, geometryInfo, {
    numericPropKeys: options.numericPropKeys,
    PositionDataType: options.PositionDataType || Float32Array,
    triangulate: options.triangulate
  });
}
