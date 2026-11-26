// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {GLTFLoaderWithParser as GLTFLoader, GLTFLoaderWithParser} from './gltf-loader';
export {GLBLoaderWithParser as GLBLoader} from './glb-loader';
export {GLTFFormat, GLBFormat} from './gltf-format';
export {GLTFSource} from './gltf-source';
export {GLTFWriter} from './gltf-writer';
export {GLBWriter} from './glb-writer';
export type {GLTFLoaderOptions} from './gltf-loader';
export type {GLBLoaderOptions} from './glb-loader';
export type {GLB, GLBChunk} from './lib/types/glb-types';
export type {
  GLTF,
  GLTFAccessor,
  GLTFBuffer,
  GLTFBufferView,
  GLTFMeshPrimitive,
  GLTFMesh,
  GLTFNode,
  GLTFMaterial,
  GLTFSampler,
  GLTFScene,
  GLTFSkin,
  GLTFTexture,
  GLTFImage,
  GLTFFile,
  GLTFExternalAsset,
  GLTFObject,
  GLTF_KHR_binary_glTF,
  GLTF_KHR_draco_mesh_compression,
  GLTF_KHR_texture_basisu,
  GLTF_KHR_meshopt_compression,
  GLTF_EXT_meshopt_compression,
  GLTF_EXT_texture_webp,
  GLTF_EXT_texture_avif,
  GLTF_MSFT_texture_dds
} from './lib/types/gltf-json-schema';
export type {GLTFShape, GLTFBoundingVolume} from './lib/types/gltf-shape-schema';
export type {
  GLTF_MPEG_audio_spatial,
  GLTFSpatialAudio,
  GLTFSpatialAudioSource,
  GLTFSpatialAudioListener,
  GLTFSpatialAudioReverb,
  GLTFSpatialAudioReverbProperty
} from './lib/types/gltf-mpeg-audio-spatial-schema';
export type {
  GLTF_KHR_audio_emitter,
  GLTFKHRAudioData,
  GLTFKHRAudioSource,
  GLTFKHRAudioPositional,
  GLTFKHRAudioEmitter,
  GLTFKHRAudioAttachment,
  GLTFAudioClip,
  GLTFAudioEmitterSource,
  GLTFAudioEmitter
} from './lib/types/gltf-khr-audio-emitter-schema';
export type {
  GLTF_EXT_mesh_polygon,
  GLTFImplicitFeatureIdRange,
  GLTFMeshPolygonData,
  GLTFPolygon,
  GLTFPrimitiveIndexRange,
  GLTFPrimitiveRestartData
} from './lib/types/gltf-vector-topology';
export type {
  GLTF_KHR_gaussian_splatting,
  GLTF_KHR_gaussian_splatting_compression_spz_2,
  GLTFGaussianSplatPrimitive
} from './lib/types/gltf-ext-gaussian-splatting-schema';
export type {
  GLTF_EXT_primitive_voxels,
  GLTFVoxelPrimitive
} from './lib/types/gltf-ext-vector-voxel-schema';
export type {
  GLTF_EXT_feature_metadata_GLTF,
  GLTF_EXT_feature_metadata_Schema,
  GLTF_EXT_feature_metadata_Class,
  GLTF_EXT_feature_metadata_ClassProperty,
  GLTF_EXT_feature_metadata_Enum,
  GLTF_EXT_feature_metadata_EnumValue,
  GLTF_EXT_feature_metadata_FeatureTable,
  GLTF_EXT_feature_metadata_FeatureTableProperty,
  GLTF_EXT_feature_metadata_FeatureTexture,
  GLTF_EXT_feature_metadata_TextureAccessor,
  GLTF_EXT_feature_metadata_Statistics,
  GLTF_EXT_feature_metadata_StatisticsClass,
  GLTF_EXT_feature_metadata_StatisticsClassProperty,
  GLTF_EXT_feature_metadata_Primitive,
  GLTF_EXT_feature_metadata_FeatureIdAttribute,
  GLTF_EXT_feature_metadata_FeatureIdAttributeFeatureIds,
  GLTF_EXT_feature_metadata_FeatureIdTexture,
  GLTF_EXT_feature_metadata_FeatureIdTextureAccessor
} from './lib/types/gltf-ext-feature-metadata-schema';
export type {
  GLTF_EXT_structural_metadata_GLTF,
  GLTF_EXT_structural_metadata_Schema,
  GLTF_EXT_structural_metadata_PropertyTable,
  GLTF_EXT_structural_metadata_PropertyTexture,
  GLTF_EXT_structural_metadata_Class,
  GLTF_EXT_structural_metadata_ClassProperty
} from './lib/types/gltf-ext-structural-metadata-schema';
export type {
  GLTF_EXT_mesh_features,
  GLTF_EXT_mesh_features_featureId
} from './lib/types/gltf-ext-mesh-features-schema';
export type {GLTFWithBuffers, GLTFExternalFile, FeatureTableJson} from './lib/types/gltf-types';
export type {GLTFSourceOptions} from './gltf-source';
export type {GLTFDracoWriterOptions} from './lib/encoders/encode-gltf-draco';
export type {
  GLTFIteratorType,
  GLTFIteratorMetadata,
  GLTFIteratorReferences,
  GLTFAccessorReferences,
  GLTFAnimationReferences,
  GLTFAnimationChannelReferences,
  GLTFAnimationChannelTargetReferences,
  GLTFAnimationSamplerReferences,
  GLTFBufferViewReferences,
  GLTFBufferViewOwnerReferences,
  GLTFExternalAssetReferences,
  GLTFMaterialReferences,
  GLTFTextureInfoReferences,
  GLTFMeshReferences,
  GLTFMeshPrimitiveReferences,
  GLTFNodeReferences,
  GLTFSceneReferences,
  GLTFSkinReferences,
  GLTFTextureReferences
} from './lib/api/gltf-iterator';
export type {
  GLTFV1NormalizationLog,
  GLTFV1NormalizationOptions,
  GLTFV1NormalizationReport
} from './lib/api/normalize-gltf-v1';
export type {PropertyAttribute} from './lib/extensions/EXT_structural_metadata';
export type {
  GLTF_KHR_interactivity,
  GLTFInteractivityGraph,
  GLTFInteractivityNode,
  GLTFInteractivityDeclaration,
  GLTFInteractivityValue,
  GLTFInteractivitySocket,
  GLTFInteractivityProperty,
  GLTFInteractivityConfiguration,
  GLTFInteractivityDeclarationSocket,
  GLTFInteractivityType,
  GLTFInteractivityEventValue,
  GLTFInteractivityVariable,
  GLTFInteractivityEvent
} from './lib/types/gltf-interactivity';
export type {GLTFMaterialVariantData, GLTFMeshInstanceData} from './lib/api/gltf-extension-data';
export type {GLTFAccessorReference} from './lib/api/gltf-accessors';
export type {GLTFWriterOptions} from './gltf-writer';
export type {
  GLTF_KHR_materials_variants,
  GLTFMaterialVariant,
  GLTF_KHR_materials_variants_primitive,
  GLTFMaterialVariantMapping,
  GLTF_EXT_mesh_gpu_instancing,
  GLTF_KHR_animation_pointer,
  GLTF_KHR_node_visibility,
  GLTF_KHR_node_selectability,
  GLTF_KHR_node_hoverability,
  GLTF_KHR_xmp_json_ld,
  GLTFXMPPacket,
  GLTF_KHR_xmp_json_ld_reference,
  GLTF_KHR_materials_emissive_strength,
  GLTF_FB_geometry_metadata
} from './lib/types/gltf-additional-extension-schemas';
export type {
  GLTFRootExtensions,
  GLTFMaterialExtensions,
  GLTFNodeExtensions,
  GLTFSceneExtensions,
  GLTFMeshPrimitiveExtensions,
  GLTFAnimationTargetExtensions,
  GLTFPropertyExtensions
} from './lib/types/gltf-extension-schemas';
