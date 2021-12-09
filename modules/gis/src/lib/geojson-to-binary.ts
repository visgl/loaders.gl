import {Feature} from '@loaders.gl/schema';
import type {BinaryFeatures} from '@loaders.gl/schema';
import {extractGeometryInfo} from './extract-geometry-info';
import {geojsonToFlatGeojson} from './geojson-to-flatGeojson';
import {flatGeojsonToBinary} from './flatGeojson-to-binary';

export type GeojsonToBinaryOptions = {
  coordLength?: number;
  numericPropKeys?: string[];
  PositionDataType?: Float32ArrayConstructor | Float64ArrayConstructor;
};

/** Convert GeoJSON features to flat binary arrays */
export function geojsonToBinary(
  features: Feature[],
  options: GeojsonToBinaryOptions = {}
): BinaryFeatures {
  const geometryInfo = extractGeometryInfo(features);
  const coordLength = options.coordLength || geometryInfo.coordLength;
  const flatFeatures = geojsonToFlatGeojson(features, {coordLength});
  return flatGeojsonToBinary(flatFeatures, geometryInfo, {
    coordLength,
    numericPropKeys: options.numericPropKeys,
    PositionDataType: options.PositionDataType || Float32Array
  });
}
