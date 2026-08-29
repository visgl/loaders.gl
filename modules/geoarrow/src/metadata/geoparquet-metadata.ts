// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {
  GeoMetadata,
  GeoColumnMetadata,
  GeoParquetGeometryType
} from '@loaders.gl/schema';
export {
  getGeoMetadata,
  setGeoMetadata,
  unpackGeoMetadata,
  unpackJSONStringMetadata,
  parseJSONStringMetadata
} from '@loaders.gl/schema';
