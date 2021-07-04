export {default as Schema} from './lib/schema/classes/schema';
export {default as Field} from './lib/schema/classes/field';
export {deduceTableSchema} from './lib/schema/deduce-table-schema';
export {getTypeInfo} from './lib/schema/get-type-info';

// COMMON CATEGORY
export type {Batch} from './category/common';

// TABLE CATEGORY TYPES

export type {
  Table,
  ArrayRowTable,
  ObjectRowTable,
  ColumnarTable,
  ArrowTable,
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
// Note: Should move to category specific module if code size increases
export type {Attributes as _Attributes} from './category/mesh/mesh-utils';
export {getMeshSize as _getMeshSize, getMeshBoundingBox} from './category/mesh/mesh-utils';

// TYPES
export {
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
} from './lib/schema/classes/type';

// TYPE UTILS
export {getArrowTypeFromTypedArray} from './lib/utils/type-utils';

// EXPERIMENTAL APIs
export {default as AsyncQueue} from './lib/utils/async-queue';
