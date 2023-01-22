// COMMON CATEGORY
export type {TypedArray, NumberArray, AnyArray} from './types';

export type {Schema, Field, DataType, Batch} from './category/common-types';

// TABLE CATEGORY TYPES
export type {
  Table,
  ArrayRowTable,
  ObjectRowTable,
  GeoJSONRowTable,
  ColumnarTable,
  ArrowTable,
  Tables
} from './category/table/table-types';
export type {
  TableBatch,
  RowArrayTableBatch,
  RowObjectTableBatch,
  GeoJSONRowTableBatch,
  ColumnarTableBatch,
  ArrowTableBatch
} from './category/table/table-types';

// TABLE CATEGORY UTILS
export {TableBatchBuilder} from './category/table/batches/table-batch-builder';
export type {TableBatchAggregator} from './category/table/batches/table-batch-aggregator';
export {RowTableBatchAggregator} from './category/table/batches/row-table-batch-aggregator';
export {ColumnarTableBatchAggregator} from './category/table/batches/columnar-table-batch-aggregator';

export {
  getTableLength,
  getTableNumCols,
  getTableCell,
  getTableRowShape,
  getTableColumnIndex,
  getTableColumnName,
  getTableRowAsObject,
  getTableRowAsArray
} from './category/table/utilities/table-accessors';

export {ArrowLikeTable} from './category/table/arrow-api/arrow-like-table';

export {convertToObjectRow, convertToArrayRow} from './category/table/utilities/row-utils';

// MESH CATEGORY
export type {
  MeshTable,
  MeshArrowTable,
  Mesh,
  MeshGeometry,
  MeshAttribute,
  MeshAttributes
} from './category/mesh/mesh-types';

export {getMeshSize, getMeshBoundingBox} from './category/mesh/mesh-utils';
// Commented out due to https://github.com/visgl/deck.gl/issues/6906 and https://github.com/visgl/loaders.gl/issues/2177
// export {convertMesh} from './category/mesh/convert-mesh';
export {
  deduceMeshSchema,
  deduceMeshField,
  makeMeshAttributeMetadata
} from './category/mesh/deduce-mesh-schema';

// TEXTURES
export type {TextureLevel, GPUTextureFormat} from './category/texture/texture';

// IMAGES
export type {ImageDataType, ImageType, ImageTypeEnum} from './category/image/image';

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
} from './category/gis';

export type {GeojsonGeometryInfo} from './category/gis';

// GIS CATEGORY - FLAT GEOJSON
export type {
  FlatFeature,
  FlatIndexedGeometry,
  FlatGeometry,
  FlatGeometryType,
  FlatPoint,
  FlatLineString,
  FlatPolygon
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
} from './category/table/arrow-api';

// EXPERIMENTAL APIs

// SCHEMA UTILS
export {getTypeInfo} from './category/table/arrow-api/get-type-info';
export {getArrowType} from './category/table/utilities/arrow-type-utils';

export {default as AsyncQueue} from './lib/utils/async-queue';
