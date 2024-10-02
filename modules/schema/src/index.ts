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

// MESH CATEGORY
export type {
  MeshTable,
  MeshArrowTable,
  Mesh,
  MeshGeometry,
  MeshAttribute,
  MeshAttributes
} from './types/category-mesh';

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
} from './lib/table/arrow-api';
