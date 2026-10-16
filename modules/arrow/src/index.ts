// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Types
export {VECTOR_TYPES} from '@loaders.gl/tables/arrow/index';

// Arrow loader / Writer

export {ArrowFormat} from '@loaders.gl/tables/arrow/index';

export type {ArrowLoaderOptions} from '@loaders.gl/tables/arrow/index';

export {ArrowLoader} from '@loaders.gl/tables/arrow/index';
export {ArrowSourceLoader, ArrowTableSource} from '@loaders.gl/tables/arrow/index';

export {ArrowWriter, type ArrowWriterOptions} from '@loaders.gl/tables/arrow/index';
export type {
  ArrowConvertFromOptions,
  ArrowConvertToOptions
} from '@loaders.gl/tables/arrow/index';
export {ARROW_CONVERTERS, ArrowConverter} from '@loaders.gl/tables/arrow/index';

export {tightenArrowTableSchemaNullability} from '@loaders.gl/tables/arrow/index';

// Geoarrow loader

export {GeoArrowLoader} from '@loaders.gl/tables/arrow/index';

// EXPERIMENTAL

// Arrow Utils
export {IndexedArrowVector} from '@loaders.gl/tables/arrow/index';
export {
  IndexedArrowTable,
  type IndexedArrowTableComparator,
  type IndexedArrowTableFindPredicate,
  type IndexedArrowTablePredicate,
  type IndexedArrowTableRow
} from '@loaders.gl/tables/arrow/index';
export {
  MappedArrowTable,
  type MappedArrowTableComparator,
  type MappedArrowTablePredicate
} from '@loaders.gl/tables/arrow/index';
export {
  validateArrowTableSchema,
  type ValidateArrowTableSchemaOptions
} from '@loaders.gl/tables/arrow/index';
export {
  renameArrowColumns,
  type ArrowFieldNameMap,
  type RenamedArrowColumns
} from '@loaders.gl/tables/arrow/index';
export {
  convertArrowTableVariableWidthTypes,
  convertArrowVariableWidthVector,
  type ConvertArrowVariableWidthOptions
} from '@loaders.gl/tables/arrow/index';
export {
  splitArrowBuffers,
  splitArrowTableBuffers,
  type SplitArrowBuffersInput,
  type SplitArrowBuffersOptions
} from '@loaders.gl/tables/arrow/index';
export {
  dehydrateArrowTable,
  hydrateArrowTable,
  serializeArrowTableToIPC,
  deserializeArrowTableFromIPC,
  type DehydratedArrowData,
  type DehydratedArrowRecordBatch,
  type DehydratedArrowTable,
  type DehydratedArrowVector,
  type SerializedArrowTableIPC
} from '@loaders.gl/tables/arrow/index';
export {
  compareUTF8,
  parseUTF8BigInt,
  parseUTF8Boolean,
  parseUTF8Number,
  type UTF8Comparison
} from '@loaders.gl/tables/arrow/index';

export type {
  ParseGeoArrowInput,
  ParseGeoArrowResult,
  TriangulateWKBColumnInput,
  TriangulateWKBColumnResult
} from '@loaders.gl/tables/arrow/index';
export {
  TriangulationWorker,
  triangulateOnWorker,
  triangulateWKBColumnOnWorker,
  parseGeoArrowOnWorker
} from '@loaders.gl/tables/arrow/index';
export {
  triangulateWKBGeometryColumn,
  type TriangulatedWKBGeometryColumns
} from '@loaders.gl/tables/arrow/index';

// DEPRECATED EXPORTS
/** @deprecated Use ArrowLoader. */
export {ArrowWorkerLoader} from '@loaders.gl/tables/arrow/index';
/** @deprecated Use GeoArrowLoader. */
export {GeoArrowWorkerLoader} from '@loaders.gl/tables/arrow/index';
