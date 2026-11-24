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
export {DracoFormat} from './draco/draco-format';
export type {GLTF_KHR_draco_mesh_compression} from './gltf/index';
export type {GLTFKHRDracoMeshCompressionSchema} from './gltf/index';
export type {compressGLTFWithDraco} from './gltf/index';
export type {GLTFDracoWriterOptions} from './gltf/index';
export type {DracoDecoderProfile} from './draco/api';
export type {DracoMesh} from './draco/api';
export type {DracoLoaderData} from './draco/api';
export type {DracoAttributeQuantization} from './draco/api';
export type {DracoAttributeType} from './draco/api';
export type {DracoBuilderMesh} from './draco/api';
export type {DracoBuildOptions} from './draco/api';
export type {DracoEncodingMethod} from './draco/api';
export type {DracoEncodingAttributeReport} from './draco/api';
export type {DracoEncodingReport} from './draco/api';
export type {DracoEncodingResult} from './draco/api';
export type {DracoExplicitQuantization} from './draco/api';
export type {DracoMetadata} from './draco/api';
