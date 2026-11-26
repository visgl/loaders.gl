// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {USDLoader} from './usd-loader-types';
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
} from './lib/usd-types';

export {USDLoaderWithParser} from './usd-loader';
export type {name as MPEG_AUDIO_SPATIAL} from '../gltf/lib/extensions/MPEG_audio_spatial';
export type {getSpatialAudio} from '../gltf/lib/extensions/MPEG_audio_spatial';
export type {name as KHR_AUDIO_EMITTER} from '../gltf/lib/extensions/KHR_audio_emitter';
export type {name as EXT_MESH_FEATURES} from '../gltf/lib/extensions/EXT_mesh_features';
export type {name as EXT_MESH_POLYGON} from '../gltf/lib/extensions/EXT_mesh_polygon';
export type {name as KHR_GAUSSIAN_SPLATTING} from '../gltf/lib/extensions/KHR_gaussian_splatting';
export type {SPZ_COMPRESSION_EXTENSION_NAME} from '../gltf/lib/extensions/KHR_gaussian_splatting';
export type {getGaussianSplatPrimitives} from '../gltf/lib/extensions/KHR_gaussian_splatting';
export type {name as EXT_PRIMITIVE_VOXELS} from '../gltf/lib/extensions/EXT_primitive_voxels';
export type {getVoxelPrimitives} from '../gltf/lib/extensions/EXT_primitive_voxels';
export type {name as KHR_MESH_PRIMITIVE_RESTART} from '../gltf/lib/extensions/KHR_mesh_primitive_restart';
export type {getPrimitiveRestartRanges} from '../gltf/lib/extensions/KHR_mesh_primitive_restart';
export type {name as EXT_STRUCTURAL_METADATA} from '../gltf/lib/extensions/EXT_structural_metadata';
export type {name as EXT_FEATURE_METADATA} from '../gltf/lib/extensions/deprecated/EXT_feature_metadata';
export type {FeatureTableJson} from '../gltf/lib/types/gltf-types';
export type {createExtStructuralMetadata} from '../gltf/lib/extensions/EXT_structural_metadata';
export type {PropertyAttribute} from '../gltf/lib/extensions/EXT_structural_metadata';
export type {createExtMeshFeatures} from '../gltf/lib/extensions/EXT_mesh_features';
export type {getMaterialVariantMappings} from '../gltf/lib/api/gltf-extension-data';
export type {getMeshInstances} from '../gltf/lib/api/gltf-extension-data';
export type {getXMPMetadata} from '../gltf/lib/api/gltf-extension-data';
export type {parse} from '../gltf/gltf-loader';
