// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// COMMON CATEGORY
export type {
  TypedArray,
  BigTypedArray,
  TypedArrayConstructor,
  BigTypedArrayConstructor,
  NumberArray,
  ArrayType,
  AnyArray
} from './types/types';

// SCHEMAS AND DATA TYPES

export type {Schema, Field, DataType, SchemaMetadata, FieldMetadata} from './types/schema';
export type {Batch} from './types/batch';

export {getArrayTypeFromDataType} from './lib/table/simple-table/data-type';

// TABLE CATEGORY TYPES
export type {
  Table,
  RowTable,
  ArrayRowTable,
  ObjectRowTable,
  GeoJSONTable,
  ColumnarTable,
  ArrowTable,
  Tables
} from './types/category-table';
export type {
  TableBatch,
  ArrayRowTableBatch,
  ObjectRowTableBatch,
  GeoJSONTableBatch,
  ColumnarTableBatch,
  ArrowTableBatch
} from './types/category-table';

// TABLE CATEGORY UTILS
export {TableBatchBuilder} from './lib/table/batches/table-batch-builder';
export type {TableBatchAggregator} from './lib/table/batches/table-batch-aggregator';
export {RowTableBatchAggregator} from './lib/table/batches/row-table-batch-aggregator';
export {ColumnarTableBatchAggregator} from './lib/table/batches/columnar-table-batch-aggregator';

export {
  isTable,
  getTableLength,
  getTableNumCols,
  getTableCell,
  getTableCellAt,
  getTableRowShape,
  getTableColumnIndex,
  getTableColumnName,
  getTableRowAsObject,
  getTableRowAsArray,
  makeRowIterator,
  makeArrayRowIterator,
  makeObjectRowIterator
} from './lib/table/simple-table/table-accessors';

export {ArrowLikeTable} from './lib/table/arrow-api/arrow-like-table';

export {makeTableFromData} from './lib/table/simple-table/make-table';
export {
  makeTableFromBatches,
  makeBatchFromTable
} from './lib/table/simple-table/make-table-from-batches';
export {convertTable} from './lib/table/simple-table/convert-table';
export {deduceTableSchema} from './lib/table/simple-table/table-schema';
export {convertToObjectRow, convertToArrayRow} from './lib/table/simple-table/row-utils';
export {getDataTypeFromArray} from './lib/table/simple-table/data-type';

// MESH CATEGORY
export type {
  MeshTable,
  MeshArrowTable,
  Mesh,
  MeshGeometry,
  MeshAttribute,
  MeshAttributes
} from './types/category-mesh';

export {getMeshSize, getMeshBoundingBox} from './lib/mesh/mesh-utils';
// Commented out due to https://github.com/visgl/deck.gl/issues/6906 and https://github.com/visgl/loaders.gl/issues/2177
// export {convertMesh} from './category/mesh/convert-mesh';
export {
  deduceMeshSchema,
  deduceMeshField,
  makeMeshAttributeMetadata
} from './lib/mesh/deduce-mesh-schema';

// TEXTURES
export type {TextureLevel, GPUTextureFormat} from './types/category-texture';

// IMAGES
export type {ImageDataType, ImageType, ImageTypeEnum} from './types/category-image';

// TYPES
// GIS CATEGORY - GEOJSON
export type {
  GeoJSON,
  Feature,
  FeatureCollection,
  Geometry,
  Position,
  GeoJsonProperties,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection
} from './types/category-gis';

export type {GeojsonGeometryInfo} from './types/category-gis';

// GIS CATEGORY - FLAT GEOJSON
export type {
  FlatFeature,
  FlatIndexedGeometry,
  FlatGeometry,
  FlatGeometryType,
  FlatPoint,
  FlatLineString,
  FlatPolygon
} from './types/category-gis';

// GIS CATEGORY - BINARY
export type {
  BinaryGeometryType,
  BinaryGeometry,
  BinaryPointGeometry,
  BinaryLineGeometry,
  BinaryPolygonGeometry,
  BinaryAttribute
} from './types/category-gis';
export type {
  BinaryFeatureCollection,
  BinaryFeature,
  BinaryPointFeature,
  BinaryLineFeature,
  BinaryPolygonFeature
} from './types/category-gis';

// SCHEMA
export {
  Schema as ArrowLikeSchema,
  Field as ArrowLikeField,
  DataType as ArrowLikeDataType,
  Null,
  Binary,
  Bool,
  Int,
  Int8,
  Int16,
  Int32,
  Int64,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Float,
  Float16,
  Float32,
  Float64,
  Utf8,
  Date,
  DateDay,
  DateMillisecond,
  Time,
  TimeMillisecond,
  TimeSecond,
  Timestamp,
  TimestampSecond,
  TimestampMillisecond,
  TimestampMicrosecond,
  TimestampNanosecond,
  Interval,
  IntervalDayTime,
  IntervalYearMonth,
  FixedSizeList,
  Struct
} from './lib/table/arrow-api/index';

// EXPERIMENTAL APIs

// SCHEMA UTILS
export {getTypeInfo} from './lib/table/arrow-api/get-type-info';

export {default as AsyncQueue} from './lib/utils/async-queue';
