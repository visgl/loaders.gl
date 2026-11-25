// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Types
export {VECTOR_TYPES} from './lib/types';

// Arrow loader / Writer

export {ArrowFormat} from './exports/arrow-format';

export type {ArrowLoaderOptions} from './arrow-loader-types';

export {ArrowLoader} from './arrow-loader-types';
export {ArrowTableSource} from './arrow-source';

export {ArrowWriter, type ArrowWriterOptions} from './arrow-writer';
export type {
  ArrowConvertFromOptions,
  ArrowConvertToOptions
} from '@loaders.gl/core/schema-utils';
export {ARROW_CONVERTERS, ArrowConverter} from '@loaders.gl/core/schema-utils';

export {tightenArrowTableSchemaNullability} from '@loaders.gl/core/schema-utils';

// Geoarrow loader

export {GeoArrowLoader} from './geoarrow-loader-types';

// EXPERIMENTAL

// Arrow Utils

export {
  convertArrowTableVariableWidthTypes,
  convertArrowVariableWidthVector,
  type ConvertArrowVariableWidthOptions
} from '@loaders.gl/core/schema-utils';

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
} from '@loaders.gl/core/arrow-geometry';

export {ArrowLoaderWithParser} from '../arrow-loader';

export {createArrowSource} from '../arrow-source';
