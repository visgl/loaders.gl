// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Schema
export {getArrayTypeFromDataType} from './lib/schema/data-type';

// Schema utils
export {
  convertArrowToSchema,
  convertSchemaToArrow,
  // DETAILED FUNCTIONS
  serializeArrowSchema,
  deserializeArrowSchema,
  serializeArrowMetadata,
  deserializeArrowMetadata,
  serializeArrowField,
  deserializeArrowField,
  serializeArrowType,
  deserializeArrowType
} from './lib/schema/convert-arrow-schema';
export {getDataTypeFromArray} from './lib/schema/data-type';

// TABLE CATEGORY UTILS

export {deduceTableSchema} from './lib/schema/deduce-table-schema';
export {makeTableFromData} from './lib/table/tables/make-table';
export {makeTableFromBatches} from './lib/table/batches/make-table-from-batches';

export {convertTable} from './lib/table/tables/convert-table';
export {convertToObjectRow, convertToArrayRow} from './lib/table/tables/row-utils';
export {convertArrowToTable, convertTableToArrow} from './lib/table/tables/convert-arrow-table';

export {
  makeTableBatchIterator,
  makeBatchFromTable
} from './lib/table/batches/make-table-batch-iterator';
export {
  makeArrowTableBatchIterator,
  makeArrowRecordBatchIterator
} from './lib/table/batches/make-arrow-batch-iterator';
export {convertBatch, convertBatches} from './lib/table/batches/convert-batches';

export {
  isArrayRowTable,
  isObjectRowTable,
  isColumnarTable,
  isGeoJSONTable,
  isArrowTable
} from './lib/table/tables/table-types';

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
} from './lib/table/tables/table-accessors';

// Table batch builders

export {TableBatchBuilder} from './lib/table/batch-builder/table-batch-builder';
export type {TableBatchAggregator} from './lib/table/batch-builder/table-batch-aggregator';
export {RowTableBatchAggregator} from './lib/table/batch-builder/row-table-batch-aggregator';
export {ColumnarTableBatchAggregator} from './lib/table/batch-builder/columnar-table-batch-aggregator';

export {ArrowLikeTable} from './lib/table/arrow-api/arrow-like-table';

// MESH CATEGORY

export {getMeshSize, getMeshBoundingBox, normalizeMeshColors} from './lib/mesh/mesh-utils';
export {convertMeshToTable} from './lib/mesh/convert-mesh-to-table';
export {convertTableToMesh} from './lib/mesh/convert-table-to-mesh';
export {
  deduceMeshSchema,
  deduceMeshField,
  makeMeshAttributeMetadata
} from './lib/mesh/deduce-mesh-schema';

// SCHEMA
export {
  Schema as ArrowLikeSchema,
  Field as ArrowLikeField,
  DataType as ArrowLikeDataType
  // Null,
  // Binary,
  // Bool,
  // Int,
  // Int8,
  // Int16,
  // Int32,
  // Int64,
  // Uint8,
  // Uint16,
  // Uint32,
  // Uint64,
  // Float,
  // Float16,
  // Float32,
  // Float64,
  // Utf8,
  // Date,
  // DateDay,
  // DateMillisecond,
  // Time,
  // TimeMillisecond,
  // TimeSecond,
  // Timestamp,
  // TimestampSecond,
  // TimestampMillisecond,
  // TimestampMicrosecond,
  // TimestampNanosecond,
  // Interval,
  // IntervalDayTime,
  // IntervalYearMonth,
  // FixedSizeList,
  // Struct
} from './lib/table/arrow-api/index';

// EXPERIMENTAL APIs
export {ArrowTableBuilder} from './lib/table/batch-builder/arrow-table-builder';

// Schema utils
export {getTypeInfo} from './lib/table/arrow-api/get-type-info';

export {default as AsyncQueue} from './lib/utils/async-queue';
