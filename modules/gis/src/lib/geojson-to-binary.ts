import type {Feature} from '@loaders.gl/schema';
import type {BinaryFeatures} from '@loaders.gl/schema';

import {extractGeometryInfo} from './extract-geometry-info';
import {geojsonToFlatGeojson} from './geojson-to-flatGeojson';
import {flatGeojsonToBinary} from './flatGeojson-to-binary';

export type GeojsonToBinaryOptions = {
  fixRingWinding: boolean;
  numericPropKeys?: string[];
  PositionDataType?: Float32ArrayConstructor | Float64ArrayConstructor;
};

/** Convert GeoJSON features to flat binary arrays */
export function geojsonToBinary(
  features: Feature[],
  options: GeojsonToBinaryOptions = {fixRingWinding: true}
): BinaryFeatures {
  const geometryInfo = extractGeometryInfo(features);
  const coordLength = geometryInfo.coordLength;
  const {fixRingWinding} = options;
  const flatFeatures = geojsonToFlatGeojson(features, {coordLength, fixRingWinding});
  return flatGeojsonToBinary(flatFeatures, geometryInfo, {
    numericPropKeys: options.numericPropKeys,
    PositionDataType: options.PositionDataType || Float32Array
  });
}
