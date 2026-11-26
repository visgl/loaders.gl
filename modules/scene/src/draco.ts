// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {DracoLoaderOptions} from './draco/draco-loader-options';
export {DracoLoaderWithParser} from './draco/draco-loader';

export {DracoLoader} from './draco/draco-loader-types';

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

/** Exact triangle comparison for format writers that qualify lossless Draco output. */
export {hasSameDracoMeshTriangles} from './draco/lib/compare-draco-mesh-triangles';
export {DracoFormat} from './draco/draco-format';
export type {GLTF_KHR_draco_mesh_compression} from './gltf/lib/types/gltf-json-schema';
export type {GLTFKHRDracoMeshCompressionSchema} from './gltf/lib/types/gltf-zod-schema';
export type {compressGLTFWithDraco} from './gltf/lib/encoders/encode-gltf-draco';
export type {GLTFDracoWriterOptions} from './gltf/lib/encoders/encode-gltf-draco';
export type {DracoDecoderProfile} from './draco/lib/draco-module-loader';
export type {DracoMesh} from './draco/lib/draco-types';
export type {DracoLoaderData} from './draco/lib/draco-types';
export type {DracoAttributeQuantization} from './draco/lib/draco-builder';
export type {DracoAttributeType} from './draco/lib/draco-builder';
export type {DracoBuilderMesh} from './draco/lib/draco-builder';
export type {DracoBuildOptions} from './draco/lib/draco-builder';
export type {DracoEncodingMethod} from './draco/lib/draco-builder';
export type {DracoEncodingAttributeReport} from './draco/lib/draco-builder';
export type {DracoEncodingReport} from './draco/lib/draco-builder';
export type {DracoEncodingResult} from './draco/lib/draco-builder';
export type {DracoExplicitQuantization} from './draco/lib/draco-builder';
export type {DracoMetadata} from './draco/lib/draco-builder';
