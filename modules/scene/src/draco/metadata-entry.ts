// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {DracoLoader} from './draco-loader-types';
export {DracoFormat} from './draco-format';
export type {DracoLoaderOptions} from './draco-loader-options';
export type {DracoLoaderWithParser} from './draco-loader';
export type {DracoWASMLoaderWithParser} from './draco-wasm-loader-with-parser';
export type {DracoJavaScriptLoaderWithParser} from './draco-javascript-loader-with-parser';
export type {Draco3DLoaderWithParser} from './draco3d-loader-with-parser';
export type {
  DracoWriterAttributes,
  DracoWriterInput,
  DracoWriterOptions,
  DracoBatchProgress,
  DracoBatchOptions,
  DracoWriterInputBatch,
  DracoWriterWorker,
  DracoWriter,
  encodeDraco,
  encodeDracoBatch,
  encodeDracoInBatches,
  encodeDracoInBatchesLocally
} from './draco-writer';
export type {DRACO_EXTERNAL_LIBRARIES, DRACO_EXTERNAL_LIBRARY_URLS} from './draco-libraries';
export type {getDracoLibraryOptions, DracoLibraryOptions} from './draco-library-options';
export type {hasSameDracoMeshTriangles} from './lib/compare-draco-mesh-triangles';
export type {GLTF_KHR_draco_mesh_compression} from '../gltf/lib/types/gltf-json-schema';
export type {GLTFKHRDracoMeshCompressionSchema} from '../gltf/lib/types/gltf-zod-schema';
export type {
  compressGLTFWithDraco,
  GLTFDracoWriterOptions
} from '../gltf/lib/encoders/encode-gltf-draco';
export type {DracoDecoderProfile} from './lib/draco-module-loader';
export type {DracoMesh, DracoLoaderData} from './lib/draco-types';
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
