// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {DracoLoaderOptions} from './draco/draco-loader-options';
export {DracoLoaderWithParser} from './draco/draco-loader';
export {DracoWASMLoaderWithParser} from './draco/draco-wasm-loader-with-parser';
export {DracoJavaScriptLoaderWithParser} from './draco/draco-javascript-loader-with-parser';
export {Draco3DLoaderWithParser} from './draco/draco3d-loader-with-parser';
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
} from './draco/draco-writer';
export {DRACO_EXTERNAL_LIBRARIES, DRACO_EXTERNAL_LIBRARY_URLS} from './draco/draco-libraries';
export {getDracoLibraryOptions, type DracoLibraryOptions} from './draco/draco-library-options';
export {hasSameDracoMeshTriangles} from './draco/lib/compare-draco-mesh-triangles';
export {DracoFormat} from './draco/draco-format';
export type {GLTF_KHR_draco_mesh_compression} from './gltf/lib/types/gltf-json-schema';
export type {GLTFKHRDracoMeshCompressionSchema} from './gltf/lib/types/gltf-zod-schema';
export type {
  compressGLTFWithDraco,
  GLTFDracoWriterOptions
} from './gltf/lib/encoders/encode-gltf-draco';
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
export {DracoLoaderWithParser as DracoLoader} from './draco/draco-loader';
export {DracoWASMLoaderWithParser as DracoWASMLoader} from './draco/draco-wasm-loader-with-parser';
export {DracoJavaScriptLoaderWithParser as DracoJavaScriptLoader} from './draco/draco-javascript-loader-with-parser';
export {Draco3DLoaderWithParser as Draco3DLoader} from './draco/draco3d-loader-with-parser';
