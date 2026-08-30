// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// MESH CATEGORY

export {getBoundingBoxFromArrowPositions} from './mesharrow/get-bounding-box';
export {getDeckBinaryDataFromArrowMesh} from './mesharrow/get-deck-binary-data';

// GIS CATEGORY - GEOARROW
export type {GeoArrowMetadata, GeoArrowEncoding, GeoArrowBox} from '@loaders.gl/schema';
export type {
  GeoArrowConvertToOptions,
  GeoArrowConvertFromOptions
} from './geoarrow-converter/geoarrow-converter';
export {
  GEOARROW_CONVERTERS,
  GeoArrowConverter,
  GeoArrowTableConverter
} from './geoarrow-converter/geoarrow-converter';
export type {GeoArrowGeometryShape} from './geoarrow-converter/geoarrow-geometry-converter';
export {
  GEOARROW_GEOMETRY_CONVERTERS,
  GeoArrowGeometryConverter,
  convertGeoArrowGeometry,
  convertGeoArrowVector,
  convertGeoArrowVectorCellToGeoJSON
} from './geoarrow-converter/geoarrow-geometry-converter';
export type {
  GeoArrowGeometryConvertOptions,
  GeoArrowGeometryTarget,
  GeoArrowCoordinateLayout,
  GeoArrowDimension,
  GeoArrowOffsetType
} from './geoarrow-converter/convert-geoarrow-geometry';

export type {
  GeoArrowWKB,
  GeoArrowWKT,
  GeoArrowCoordInterleaved,
  GeoArrowCoordSeparated,
  GeoArrowCoord,
  GeoArrowList,
  GeoArrowPoint,
  GeoArrowLineString,
  GeoArrowPolygon,
  GeoArrowMultiPoint,
  GeoArrowMultiLineString,
  GeoArrowMultiPolygon,
  GeoArrowGeometry,
  GeoArrowPointSeparated,
  GeoArrowLineStringSeparated,
  GeoArrowPolygonSeparated,
  GeoArrowMultiPointSeparated,
  GeoArrowMultiLineStringSeparated,
  GeoArrowMultiPolygonSeparated,
  GeoArrowGeometrySeparated,
  GeoArrowBoxType
} from './geoarrow-types';

export {
  isGeoArrowPoint,
  isGeoArrowBox,
  isGeoArrowLineString,
  isGeoArrowPolygon,
  isGeoArrowMultiPoint,
  isGeoArrowMultiLineString,
  isGeoArrowMultiPolygon,
  isGeoArrowGeometry
} from './geoarrow-functions';

// GEOARROW / GEOPARQUET METADATA
export {getGeometryColumnsFromSchema} from './metadata/geoarrow-metadata';
export {mergeGeoArrowMetadata, mergeGeoArrowSchemas} from './metadata/merge-geoarrow-metadata';
export type {
  GeoArrowMetadataConflict,
  GeoArrowMetadataMergeMode,
  GeoArrowMetadataMergeOptions,
  GeoArrowMetadataMergeResult,
  GeoArrowSchemaMergeResult
} from './metadata/merge-geoarrow-metadata';

export type {GeoColumnMetadata} from './metadata/geoparquet-metadata';
export {
  getGeoMetadata,
  unpackGeoMetadata,
  unpackJSONStringMetadata
} from './metadata/geoparquet-metadata';

export {getGeoArrowGeometryInfo} from './get-geoarrow-geometry-info';
export {getGeoarrowVertexCount} from './get-geoarrow-vertex-count';
export {getGeoArrowNativeGeometry} from './get-geoarrow-native-geometry';
export type {GeoArrowNativeGeometry} from './get-geoarrow-native-geometry';
export {convertGeoArrowBatches} from './geoarrow-stream';
export type {GeoArrowStreamConvertOptions} from './geoarrow-stream';
export {inspectGeoArrowVector} from './geoarrow-inspection';
export type {GeoArrowVectorInspection} from './geoarrow-inspection';
export {getGeoArrowBounds, getGeoArrowRowBounds} from './geoarrow-bounds';
export type {GeoArrowBounds} from './geoarrow-bounds';
export {mapGeoArrowCoordinates} from './map-geoarrow-coordinates';
export type {GeoArrowCoordinateMapper} from './map-geoarrow-coordinates';
export {rewindGeoArrow} from './rewind-geoarrow';
export type {GeoArrowRingOrientation, RewindGeoArrowOptions} from './rewind-geoarrow';
export type {GeoArrowResourceLimitOptions} from './geoarrow-resource-limits';

// GeoArrow exposes the shared builder used by loader-facing GIS integrations.
export {GeoArrowBuilder} from './geoarrow-builder';
export type {
  GeoArrowBuilderEncoding,
  GeoArrowCoordinateTransform,
  GeoArrowBuilderDimension,
  GeoArrowBuilderTarget,
  GeoArrowSeparatedBoxBuffers,
  GeoArrowSeparatedCoordinateBuffers,
  GeoArrowBuilderCoordinates,
  GeoArrowBuilderOffsets,
  GeoArrowGeometryArray,
  GeoArrowBuilderBaseOptions,
  GeoArrowBuilderMeasureOptions,
  GeoArrowBuilderWriteOptions,
  GeoArrowBuilderOptions,
  GeoArrowGeometryWriter
} from './geoarrow-builder';
export {
  getGeoArrowFieldInfo,
  validateGeoArrowField,
  validateGeoArrowVector,
  negotiateGeoArrowEncoding
} from './geoarrow-capabilities';
export {inspectGeoArrowLayout} from './geoarrow-layout';
export type {
  GeoArrowFieldInfo,
  GeoArrowValidationIssue,
  GeoArrowValidationResult,
  GeoArrowVectorValidationResult,
  GeoArrowEncodingRequirements
} from './geoarrow-capabilities';
export type {
  GeoArrowChildNullability,
  GeoArrowCoordinatePrecision,
  GeoArrowLayoutInfo,
  GeoArrowLayoutInspection,
  GeoArrowLayoutIssue,
  GeoArrowLayoutIssueCode,
  GeoArrowLayoutKind,
  GeoArrowStorageKind,
  GeoArrowUnionChildLayout
} from './geoarrow-layout';

export {updateBoundsFromGeoArrowSamples} from './get-arrow-bounds';

export type {
  BinaryDataFromGeoArrow,
  BinaryGeometriesFromArrowOptions
} from './lib/feature-collection-converters/convert-geoarrow-to-binary-features';
export {
  getBinaryGeometryTemplate,
  getTriangleIndices,
  getMeanCentersFromBinaryGeometries
} from './lib/feature-collection-converters/convert-geoarrow-to-binary-features';
export {
  convertGeoArrowGeometryToGeoJSON,
  convertGeoArrowToBinaryFeatureCollection,
  convertGeoArrowToTable,
  convertWKBTableToGeoJSON,
  convertTableToGeoArrow,
  convertFeatureCollectionToGeoArrowTable,
  convertFeaturesToGeoArrowTable
} from './deprecated';
export type {GeoArrowConvertFromEncoding} from './convert-table-to-geoarrow';
