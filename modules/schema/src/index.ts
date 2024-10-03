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
} from './categories/category-table';
export type {
  TableBatch,
  ArrayRowTableBatch,
  ObjectRowTableBatch,
  GeoJSONTableBatch,
  ColumnarTableBatch,
  ArrowTableBatch
} from './categories/category-table';

// MESH CATEGORY
export type {
  MeshTable,
  MeshArrowTable,
  Mesh,
  MeshGeometry,
  MeshAttribute,
  MeshAttributes
} from './categories/category-mesh';

// TEXTURES
export type {TextureLevel, GPUTextureFormat} from './categories/category-texture';

// IMAGES
export type {ImageDataType, ImageType, ImageTypeEnum} from './categories/category-image';

// GIS CATEGORY - GEOARROW
export type {GeoArrowMetadata, GeoArrowEncoding} from './geometry/geoarrow-metadata';

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
} from './categories/category-gis';

export type {GeojsonGeometryInfo} from './categories/category-gis';

// GIS CATEGORY - FLAT GEOJSON
export type {
  FlatFeature,
  FlatIndexedGeometry,
  FlatGeometry,
  FlatGeometryType,
  FlatPoint,
  FlatLineString,
  FlatPolygon
} from './categories/category-gis';

// GIS CATEGORY - BINARY
export type {
  BinaryGeometryType,
  BinaryGeometry,
  BinaryPointGeometry,
  BinaryLineGeometry,
  BinaryPolygonGeometry,
  BinaryAttribute
} from './categories/category-gis';
export type {
  BinaryFeatureCollection,
  BinaryFeature,
  BinaryPointFeature,
  BinaryLineFeature,
  BinaryPolygonFeature
} from './categories/category-gis';

// SCHEMA
// export {
//   Schema as ArrowLikeSchema,
//   Field as ArrowLikeField,
//   DataType as ArrowLikeDataType,
//   Null,
//   Binary,
//   Bool,
//   Int,
//   Int8,
//   Int16,
//   Int32,
//   Int64,
//   Uint8,
//   Uint16,
//   Uint32,
//   Uint64,
//   Float,
//   Float16,
//   Float32,
//   Float64,
//   Utf8,
//   Date,
//   DateDay,
//   DateMillisecond,
//   Time,
//   TimeMillisecond,
//   TimeSecond,
//   Timestamp,
//   TimestampSecond,
//   TimestampMillisecond,
//   TimestampMicrosecond,
//   TimestampNanosecond,
//   Interval,
//   IntervalDayTime,
//   IntervalYearMonth,
//   FixedSizeList,
//   Struct
// } from './lib/table/arrow-api';
