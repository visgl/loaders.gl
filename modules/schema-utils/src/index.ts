// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// COMMON CATEGORY
export {getArrayTypeFromDataType} from './lib/table/simple-table/data-type';

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

export {getMeshSize, getMeshBoundingBox} from './lib/mesh/mesh-utils';
// Commented out due to https://github.com/visgl/deck.gl/issues/6906 and https://github.com/visgl/loaders.gl/issues/2177
// export {convertMesh} from './category/mesh/convert-mesh';
export {
  deduceMeshSchema,
  deduceMeshField,
  makeMeshAttributeMetadata
} from './lib/mesh/deduce-mesh-schema';

// GIS CATEGORY - GEOJSON
export {getGeometryColumnsFromSchema} from './lib/geometry/geoarrow-metadata';

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
