// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {
  encodeDraco,
  encodeDracoBatch,
  encodeDracoInBatches,
  encodeDracoInBatchesLocally
} from './draco/draco-writer';
export {DRACO_EXTERNAL_LIBRARIES, DRACO_EXTERNAL_LIBRARY_URLS} from './draco/draco-libraries';
export {getDracoLibraryOptions} from './draco/draco-library-options';
export {hasSameDracoMeshTriangles} from './draco/lib/compare-draco-mesh-triangles';
export {GLTFKHRDracoMeshCompressionSchema} from './gltf/lib/types/gltf-zod-schema';
export {compressGLTFWithDraco} from './gltf/lib/encoders/encode-gltf-draco';
export type {
  DracoLoaderOptions,
  DracoWriterAttributes,
  DracoWriterInput,
  DracoWriterOptions,
  DracoBatchProgress,
  DracoBatchOptions,
  DracoWriterInputBatch,
  DracoLibraryOptions,
  GLTF_KHR_draco_mesh_compression,
  GLTFDracoWriterOptions,
  DracoDecoderProfile,
  DracoMesh,
  DracoLoaderData,
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
} from './draco-bundled';
