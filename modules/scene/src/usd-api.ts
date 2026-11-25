// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {
  name as MPEG_AUDIO_SPATIAL,
  getSpatialAudio
} from './gltf/lib/extensions/MPEG_audio_spatial';
export {name as KHR_AUDIO_EMITTER} from './gltf/lib/extensions/KHR_audio_emitter';
export {
  name as EXT_MESH_FEATURES,
  createExtMeshFeatures
} from './gltf/lib/extensions/EXT_mesh_features';
export {name as EXT_MESH_POLYGON} from './gltf/lib/extensions/EXT_mesh_polygon';
export {
  name as KHR_GAUSSIAN_SPLATTING,
  SPZ_COMPRESSION_EXTENSION_NAME,
  getGaussianSplatPrimitives
} from './gltf/lib/extensions/KHR_gaussian_splatting';
export {
  name as EXT_PRIMITIVE_VOXELS,
  getVoxelPrimitives
} from './gltf/lib/extensions/EXT_primitive_voxels';
export {
  name as KHR_MESH_PRIMITIVE_RESTART,
  getPrimitiveRestartRanges
} from './gltf/lib/extensions/KHR_mesh_primitive_restart';
export {
  name as EXT_STRUCTURAL_METADATA,
  createExtStructuralMetadata
} from './gltf/lib/extensions/EXT_structural_metadata';
export {name as EXT_FEATURE_METADATA} from './gltf/lib/extensions/deprecated/EXT_feature_metadata';
export {
  getMaterialVariantMappings,
  getMeshInstances,
  getXMPMetadata
} from './gltf/lib/api/gltf-extension-data';
export {parse} from './gltf/gltf-loader';
export type {
  USDAssetPath,
  USDAttribute,
  USDEmbeddedAsset,
  USDLoaderOptions,
  USDPrim,
  USDScenePath,
  USDStage,
  USDValue,
  USDVariant,
  FeatureTableJson,
  PropertyAttribute
} from './usd-bundled';
