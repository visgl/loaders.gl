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

export {USDLoaderWithParser} from '../usd-loader';
export type {MPEG_AUDIO_SPATIAL} from '../gltf/index';
export type {getSpatialAudio} from '../gltf/index';
export type {KHR_AUDIO_EMITTER} from '../gltf/index';
export type {EXT_MESH_FEATURES} from '../gltf/index';
export type {EXT_MESH_POLYGON} from '../gltf/index';
export type {KHR_GAUSSIAN_SPLATTING} from '../gltf/index';
export type {SPZ_COMPRESSION_EXTENSION_NAME} from '../gltf/index';
export type {getGaussianSplatPrimitives} from '../gltf/index';
export type {EXT_PRIMITIVE_VOXELS} from '../gltf/index';
export type {getVoxelPrimitives} from '../gltf/index';
export type {KHR_MESH_PRIMITIVE_RESTART} from '../gltf/index';
export type {getPrimitiveRestartRanges} from '../gltf/index';
export type {EXT_STRUCTURAL_METADATA} from '../gltf/index';
export type {EXT_FEATURE_METADATA} from '../gltf/index';
export type {FeatureTableJson} from '../gltf/index';
export type {createExtStructuralMetadata} from '../gltf/index';
export type {PropertyAttribute} from '../gltf/index';
export type {createExtMeshFeatures} from '../gltf/index';
export type {getMaterialVariantMappings} from '../gltf/index';
export type {getMeshInstances} from '../gltf/index';
export type {getXMPMetadata} from '../gltf/index';
export type {parse} from '../gltf/index';
