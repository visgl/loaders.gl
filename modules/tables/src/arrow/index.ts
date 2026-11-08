// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Types
export {VECTOR_TYPES} from './lib/types';

// Arrow loader / Writer

export {ArrowFormat} from './exports/arrow-format';

export type {ArrowLoaderOptions} from './exports/arrow-loader';

export {ArrowLoader} from './arrow-loader-types';
export {ArrowSourceLoader, ArrowTableSource} from './arrow-source';

export {ArrowWriter, type ArrowWriterOptions} from './arrow-writer';
export type {
  ArrowConvertFromOptions,
  ArrowConvertToOptions
} from './arrow-converter/arrow-converter';
export {ARROW_CONVERTERS, ArrowConverter} from './arrow-converter/arrow-converter';

export {tightenArrowTableSchemaNullability} from './lib/tighten-arrow-table-schema-nullability';

// Geoarrow loader

export {GeoArrowLoader} from './geoarrow-loader-types';

// EXPERIMENTAL

// Arrow Utils

export {
  convertArrowTableVariableWidthTypes,
  convertArrowVariableWidthVector,
  type ConvertArrowVariableWidthOptions
} from './lib/utils/convert-arrow-variable-width';

export type {
  ParseGeoArrowInput,
  ParseGeoArrowResult,
  TriangulateWKBColumnInput,
  TriangulateWKBColumnResult
} from './triangulate-on-worker';
export {
  TriangulationWorker,
  triangulateOnWorker,
  triangulateWKBColumnOnWorker,
  parseGeoArrowOnWorker
} from './triangulate-on-worker';
export {
  triangulateWKBGeometryColumn,
  type TriangulatedWKBGeometryColumns
} from './triangulate-wkb-geometry-column';

// DEPRECATED EXPORTS
/** @deprecated Use ArrowLoader. */
export {ArrowWorkerLoader} from './exports/arrow-loader';
/** @deprecated Use GeoArrowLoader. */
export {GeoArrowWorkerLoader} from './exports/geoarrow-loader';
