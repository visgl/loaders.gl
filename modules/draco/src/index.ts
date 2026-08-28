// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Module constants
export {DRACO_EXTERNAL_LIBRARIES, DRACO_EXTERNAL_LIBRARY_URLS} from './lib/draco-module-loader';
export type {DracoDecoderProfile} from './lib/draco-module-loader';

// Draco data types

export type {DracoMesh, DracoLoaderData} from './lib/draco-types';
export {DracoFormat} from './draco-format';

// Draco Writer

export type {
  DracoBatchOptions,
  DracoBatchProgress,
  DracoWriterAttributes,
  DracoWriterInput,
  DracoWriterInputBatch,
  DracoWriterOptions
} from './draco-writer';
export {encodeDraco, encodeDracoBatch, encodeDracoInBatches} from './draco-writer';
export type {
  DracoAttributeQuantization,
  DracoAttributeType,
  DracoBuilderMesh,
  DracoBuildOptions,
  DracoEncodingMethod,
  DracoEncodingAttributeReport,
  DracoEncodingReport,
  DracoEncodingResult,
  DracoExplicitQuantization,
  DracoMetadata
} from './lib/draco-builder';
export {DracoWriterWorker, DracoWriter} from './draco-writer';

// Draco Loader

export type {DracoLoaderOptions} from './draco-loader';
export {DracoLoader} from './draco-loader';

// DEPRECATED EXPORTS
/** @deprecated Use DracoLoader. */
export {DracoWorkerLoader} from './draco-loader';
