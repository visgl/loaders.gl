// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Types
export {VECTOR_TYPES} from './lib/types';

// Arrow loader / Writer

export {ArrowFormat} from './exports/arrow-format';

export type {ArrowLoaderOptions} from './exports/arrow-loader';
export {ArrowWorkerLoader} from './exports/arrow-loader';
export {ArrowLoader} from './arrow-loader';

export {ArrowWriter} from './arrow-writer';

// Geoarrow loader
export {GeoArrowWorkerLoader} from './exports/geoarrow-loader';
export {GeoArrowLoader} from './geoarrow-loader';

// EXPERIMENTAL

// Arrow Utils
export {IndexedArrowVector} from './lib/utils/indexed-arrow-vector';
export {
  IndexedArrowTable,
  type IndexedArrowTableComparator,
  type IndexedArrowTableFindPredicate,
  type IndexedArrowTablePredicate,
  type IndexedArrowTableRow
} from './lib/utils/indexed-arrow-table';
export {
  MappedArrowTable,
  type MappedArrowTableComparator,
  type MappedArrowTablePredicate
} from './lib/utils/mapped-arrow-table';
export {
  validateArrowTableSchema,
  type ValidateArrowTableSchemaOptions
} from './lib/utils/arrow-schema-utils';
export {
  renameArrowColumns,
  type ArrowFieldNameMap,
  type RenamedArrowColumns
} from './lib/utils/rename-arrow-columns';

// EXPERIMENTAL WORKER
export {hardClone} from './workers/hard-clone';

export type {ParseGeoArrowInput, ParseGeoArrowResult} from './triangulate-on-worker';
export {
  TriangulationWorker,
  triangulateOnWorker,
  parseGeoArrowOnWorker
} from './triangulate-on-worker';
