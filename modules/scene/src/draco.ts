// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {type DracoLoaderOptions, DracoLoaderWithParser} from './draco-loader';

export {DracoLoader} from './draco-loader-types';

export {DracoWASMLoaderWithParser} from './draco-wasm-loader';

export {DracoJavaScriptLoaderWithParser} from './draco-javascript-loader';

export {Draco3DLoaderWithParser} from './draco3d-loader';

export {
  type DracoWriterAttributes,
  type DracoWriterInput,
  type DracoWriterOptions,
  type DracoBatchProgress,
  type DracoBatchOptions,
  type DracoWriterInputBatch,
  DracoWriterWorker,
  DracoWriter,
  encodeDraco,
  encodeDracoBatch,
  encodeDracoInBatches,
  encodeDracoInBatchesLocally
} from './draco-writer';

export {
  DRACO_EXTERNAL_LIBRARIES,
  DRACO_EXTERNAL_LIBRARY_URLS,
  getDracoLibraryOptions,
  type DracoLibraryOptions
} from './draco-library-options';

/** Exact triangle comparison for format writers that qualify lossless Draco output. */
export {hasSameDracoMeshTriangles} from './draco/lib/compare-draco-mesh-triangles';
