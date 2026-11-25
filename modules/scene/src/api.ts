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
export {compressGLTFWithDraco} from './gltf/lib/encoders/encode-gltf-draco';
export {GLTFScenegraph} from './gltf/lib/api/gltf-scenegraph';
export {GLTFIterator} from './gltf/lib/api/gltf-iterator';
export {getGLTFCullingShape, getGLTFNodeCullingShape} from './gltf/lib/api/gltf-culling';
export {convertGLTFV1ToGLTF2, normalizeGLTFV1} from './gltf/lib/api/normalize-gltf-v1';
export {getMemoryUsageGLTF as _getMemoryUsageGLTF} from './gltf/lib/gltf-utils/gltf-utils';
export {findGLTFFileIndex, resolveGLTFFile} from './gltf/lib/gltf-utils/resolve-gltf-file';
export {getGLTFInteractivity} from './gltf/lib/types/gltf-interactivity';
export {
  getMaterialVariantMappings,
  getMeshInstances,
  getXMPMetadata
} from './gltf/lib/api/gltf-extension-data';
export {
  getGLTFAccessor,
  getGLTFAccessorValue,
  setGLTFAccessorValue
} from './gltf/lib/api/gltf-accessors';
export {getGLTFPrimitiveOutline} from './gltf/lib/api/gltf-primitive-outline';
export type {
  GLTFLoaderOptions,
  GLBLoaderOptions,
  GLB,
  GLBChunk,
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
  GLTF_MSFT_texture_dds,
  GLTFShape,
  GLTFBoundingVolume,
  GLTF_MPEG_audio_spatial,
  GLTFSpatialAudio,
  GLTFSpatialAudioSource,
  GLTFSpatialAudioListener,
  GLTFSpatialAudioReverb,
  GLTFSpatialAudioReverbProperty,
  GLTF_KHR_audio_emitter,
  GLTFKHRAudioData,
  GLTFKHRAudioSource,
  GLTFKHRAudioPositional,
  GLTFKHRAudioEmitter,
  GLTFKHRAudioAttachment,
  GLTFAudioClip,
  GLTFAudioEmitterSource,
  GLTFAudioEmitter,
  GLTF_EXT_mesh_polygon,
  GLTFImplicitFeatureIdRange,
  GLTFMeshPolygonData,
  GLTFPolygon,
  GLTFPrimitiveIndexRange,
  GLTFPrimitiveRestartData,
  GLTF_KHR_gaussian_splatting,
  GLTF_KHR_gaussian_splatting_compression_spz_2,
  GLTFGaussianSplatPrimitive,
  GLTF_EXT_primitive_voxels,
  GLTFVoxelPrimitive,
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
  GLTF_EXT_feature_metadata_FeatureIdTextureAccessor,
  GLTF_EXT_structural_metadata_GLTF,
  GLTF_EXT_structural_metadata_Schema,
  GLTF_EXT_structural_metadata_PropertyTable,
  GLTF_EXT_structural_metadata_PropertyTexture,
  GLTF_EXT_structural_metadata_Class,
  GLTF_EXT_structural_metadata_ClassProperty,
  GLTF_EXT_mesh_features,
  GLTF_EXT_mesh_features_featureId,
  GLTFWithBuffers,
  GLTFExternalFile,
  FeatureTableJson,
  GLTFSourceOptions,
  GLTFDracoWriterOptions,
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
  GLTFTextureReferences,
  GLTFV1NormalizationLog,
  GLTFV1NormalizationOptions,
  GLTFV1NormalizationReport,
  PropertyAttribute,
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
  GLTFInteractivityEvent,
  GLTFMaterialVariantData,
  GLTFMeshInstanceData,
  GLTFAccessorReference,
  GLTFWriterOptions,
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
  GLTF_FB_geometry_metadata,
  GLTFRootExtensions,
  GLTFMaterialExtensions,
  GLTFNodeExtensions,
  GLTFSceneExtensions,
  GLTFMeshPrimitiveExtensions,
  GLTFAnimationTargetExtensions,
  GLTFPropertyExtensions
} from './gltf/bundled';
export {getDracoLibraryOptions} from './draco/draco-library-options';
export {hasSameDracoMeshTriangles} from './draco/lib/compare-draco-mesh-triangles';
export type {DracoLibraryOptions} from './draco-bundled';
