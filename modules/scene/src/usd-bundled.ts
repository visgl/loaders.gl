// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {
  USDAssetPath,
  USDAttribute,
  USDEmbeddedAsset,
  USDLoaderOptions,
  USDPrim,
  USDScenePath,
  USDStage,
  USDValue,
  USDVariant
} from './usd/lib/usd-types';
export {USDLoaderWithParser} from './usd/usd-loader';
export type {
  name as MPEG_AUDIO_SPATIAL,
  getSpatialAudio
} from './gltf/lib/extensions/MPEG_audio_spatial';
export type {name as KHR_AUDIO_EMITTER} from './gltf/lib/extensions/KHR_audio_emitter';
export type {
  name as EXT_MESH_FEATURES,
  createExtMeshFeatures
} from './gltf/lib/extensions/EXT_mesh_features';
export type {name as EXT_MESH_POLYGON} from './gltf/lib/extensions/EXT_mesh_polygon';
export type {
  name as KHR_GAUSSIAN_SPLATTING,
  SPZ_COMPRESSION_EXTENSION_NAME,
  getGaussianSplatPrimitives
} from './gltf/lib/extensions/KHR_gaussian_splatting';
export type {
  name as EXT_PRIMITIVE_VOXELS,
  getVoxelPrimitives
} from './gltf/lib/extensions/EXT_primitive_voxels';
export type {
  name as KHR_MESH_PRIMITIVE_RESTART,
  getPrimitiveRestartRanges
} from './gltf/lib/extensions/KHR_mesh_primitive_restart';
export type {
  name as EXT_STRUCTURAL_METADATA,
  createExtStructuralMetadata,
  PropertyAttribute
} from './gltf/lib/extensions/EXT_structural_metadata';
export type {name as EXT_FEATURE_METADATA} from './gltf/lib/extensions/deprecated/EXT_feature_metadata';
export type {FeatureTableJson} from './gltf/lib/types/gltf-types';
export type {
  getMaterialVariantMappings,
  getMeshInstances,
  getXMPMetadata
} from './gltf/lib/api/gltf-extension-data';
export type {parse} from './gltf/gltf-loader';
export {USDLoaderWithParser as USDLoader} from './usd/usd-loader';
