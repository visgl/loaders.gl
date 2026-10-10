// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Allocating legacy rendering materializers shared by loaders.
 * These helpers preserve vertex-indexed offsets and per-vertex attributes;
 * they are not borrowed native GeoArrow views.
 */
export {
  convertGeojsonToBinaryFeatureCollection,
  type GeojsonToBinaryOptions
} from './legacy-binary/convert-geojson-to-binary-features';
export {
  convertGeojsonToFlatGeojson,
  type GeojsonToFlatGeojsonOptions
} from './legacy-binary/convert-geojson-to-flat-geojson';
export {
  convertFlatGeojsonToBinaryFeatureCollection,
  extractNumericPropTypes,
  type FlatGeojsonToBinaryOptions
} from './legacy-binary/convert-flat-geojson-to-binary-features';
export {getGeometryInfo, type GeojsonGeometryInfo} from './legacy-binary/geometry-info';
