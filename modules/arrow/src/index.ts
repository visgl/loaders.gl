// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Types
export {VECTOR_TYPES} from './lib/types';

// Arrow loader / Writer

export {ArrowFormat} from './arrow-format';

export type {ArrowLoaderOptions} from './exports/arrow-loader';
export {ArrowWorkerLoader} from './exports/arrow-loader';
export {ArrowLoader} from './arrow-loader';

export {ArrowWriter} from './arrow-writer';

// Geoarrow loader
export {GeoArrowWorkerLoader} from './exports/geoarrow-loader';
export {GeoArrowLoader} from './geoarrow-loader';

// EXPERIMENTAL

// Arrow Utils
// getGeometryColumnsFromArrowTable,
// getGeoArrowEncoding

// EXPERIMENTAL WORKER
export {hardClone} from './workers/hard-clone';

export type {ParseGeoArrowInput, ParseGeoArrowResult} from './triangulate-on-worker';
export {
  TriangulationWorker,
  triangulateOnWorker,
  parseGeoArrowOnWorker
} from './triangulate-on-worker';
