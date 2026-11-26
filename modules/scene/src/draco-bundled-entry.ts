// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {DracoLoaderWithParser as DracoLoader, DracoLoaderWithParser} from './draco/draco-loader';
export {
  DracoWASMLoaderWithParser as DracoWASMLoader,
  DracoWASMLoaderWithParser
} from './draco/draco-wasm-loader-with-parser';
export {
  DracoJavaScriptLoaderWithParser as DracoJavaScriptLoader,
  DracoJavaScriptLoaderWithParser
} from './draco/draco-javascript-loader-with-parser';
export {
  Draco3DLoaderWithParser as Draco3DLoader,
  Draco3DLoaderWithParser
} from './draco/draco3d-loader-with-parser';
export {
  DracoWriterWorker,
  DracoWriter,
  encodeDraco,
  encodeDracoBatch,
  encodeDracoInBatches,
  encodeDracoInBatchesLocally
} from './draco/draco-writer';
export {DracoFormat} from './draco/draco-format';
export type {DracoLoaderOptions} from './draco/draco-loader-options';
export type {
  DracoWriterAttributes,
  DracoWriterInput,
  DracoWriterOptions,
  DracoBatchProgress,
  DracoBatchOptions,
  DracoWriterInputBatch
} from './draco/draco-writer';
export type {DracoLibraryOptions} from './draco/draco-library-options';
export type {GLTF_KHR_draco_mesh_compression} from './gltf/lib/types/gltf-json-schema';
export type {GLTFDracoWriterOptions} from './gltf/lib/encoders/encode-gltf-draco';
export type {DracoDecoderProfile} from './draco/lib/draco-module-loader';
export type {DracoMesh, DracoLoaderData} from './draco/lib/draco-types';
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
} from './draco/lib/draco-builder';
