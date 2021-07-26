// COMMON CATEGORY
export type {TypedArray, NumberArray, AnyArray} from './types';

export type {Batch} from './category/common';

// TABLE CATEGORY TYPES

export type {
  Table,
  ArrayRowTable,
  ObjectRowTable,
  ColumnarTable,
  ArrowTable
} from './category/table';
export type {
  TableBatch,
  RowArrayTableBatch,
  RowObjectTableBatch,
  ColumnarTableBatch,
  ArrowTableBatch
} from './category/table';

// TABLE CATEGORY UTILS
export {default as TableBatchBuilder} from './lib/table/table-batch-builder';
export type {TableBatchAggregator} from './lib/table/table-batch-aggregator';
export {default as RowTableBatchAggregator} from './lib/table/row-table-batch-aggregator';
export {default as ColumnarTableBatchAggregator} from './lib/table/columnar-table-batch-aggregator';

export {convertToObjectRow, convertToArrayRow} from './lib/utils/row-utils';

// MESH CATEGORY
export type {MeshTable, MeshArrowTable, Mesh, MeshAttribute} from './category/mesh';

// MESH CATEGORY UTILS
export type {Attributes as _Attributes} from './category/mesh/mesh-utils';
export {getMeshSize, getMeshBoundingBox} from './category/mesh/mesh-utils';

// TYPES
// GIS CATEGORY - GEOJSON
export type {GeoJSON, Feature, Geometry, Position, GeoJsonProperties} from './category/gis';
export type {
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon
} from './category/gis';

// GIS CATEGORY - BINARY
export type {
  BinaryGeometryType,
  BinaryGeometry,
  BinaryPointGeometry,
  BinaryLineGeometry,
  BinaryPolygonGeometry,
  BinaryAttribute
} from './category/gis';
export type {
  BinaryFeatures,
  BinaryPointFeatures,
  BinaryLineFeatures,
  BinaryPolygonFeatures
} from './category/gis';

// SCHEMA
export {
  Schema,
  Field,
  DataType,
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
  FixedSizeList
} from './lib/schema';

// SCHEMA UTILS
export {deduceTableSchema} from './lib/schema-utils/deduce-table-schema';
export {getTypeInfo} from './lib/schema-utils/get-type-info';
export {getArrowTypeFromTypedArray} from './lib/schema-utils/type-utils';

// EXPERIMENTAL APIs
export {default as AsyncQueue} from './lib/utils/async-queue';
