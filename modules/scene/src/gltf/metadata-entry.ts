// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {GLTFLoader} from './gltf-loader-types';
export {GLBLoader} from './glb-loader-types';
export {GLTFFormat} from './gltf-format';
export {GLBFormat} from './gltf-format';
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
  name as MPEG_AUDIO_SPATIAL,
  getSpatialAudio
} from './lib/extensions/MPEG_audio_spatial';
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
export type {name as KHR_AUDIO_EMITTER} from './lib/extensions/KHR_audio_emitter';
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
export type {
  name as EXT_MESH_FEATURES,
  createExtMeshFeatures
} from './lib/extensions/EXT_mesh_features';
export type {name as EXT_MESH_POLYGON} from './lib/extensions/EXT_mesh_polygon';
export type {
  name as KHR_GAUSSIAN_SPLATTING,
  SPZ_COMPRESSION_EXTENSION_NAME,
  getGaussianSplatPrimitives
} from './lib/extensions/KHR_gaussian_splatting';
export type {
  name as EXT_PRIMITIVE_VOXELS,
  getVoxelPrimitives
} from './lib/extensions/EXT_primitive_voxels';
export type {
  name as KHR_MESH_PRIMITIVE_RESTART,
  getPrimitiveRestartRanges
} from './lib/extensions/KHR_mesh_primitive_restart';
export type {
  name as EXT_STRUCTURAL_METADATA,
  createExtStructuralMetadata,
  PropertyAttribute
} from './lib/extensions/EXT_structural_metadata';
export type {name as EXT_FEATURE_METADATA} from './lib/extensions/deprecated/EXT_feature_metadata';
export type {GLTFWithBuffers, GLTFExternalFile, FeatureTableJson} from './lib/types/gltf-types';
export type {
  GLTFSchema,
  GLTFIdSchema,
  GLTFObjectSchema,
  GLTFAccessorSchema,
  GLTFAccessorSparseSchema,
  GLTFAccessorSparseIndicesSchema,
  GLTFAccessorSparseValuesSchema,
  GLTFAnimationSchema,
  GLTFAnimationChannelSchema,
  GLTFAnimationChannelTargetSchema,
  GLTFAnimationSamplerSchema,
  GLTFAssetSchema,
  GLTFBufferSchema,
  GLTFBufferViewSchema,
  GLTFCameraSchema,
  GLTFCameraOrthographicSchema,
  GLTFCameraPerspectiveSchema,
  GLTFImageSchema,
  GLTFExternalAssetSchema,
  GLTFMaterialSchema,
  GLTFMaterialNormalTextureInfoSchema,
  GLTFMaterialOcclusionTextureInfoSchema,
  GLTFMaterialPbrMetallicRoughnessSchema,
  GLTFMeshSchema,
  GLTFMeshPrimitiveSchema,
  GLTFNodeSchema,
  GLTFSamplerSchema,
  GLTFSceneSchema,
  GLTFSkinSchema,
  GLTFTextureSchema,
  GLTFTextureInfoSchema,
  GLTFTextureInfoMetadataSchema,
  GLTFKHRBinarySchema,
  GLTFKHRDracoMeshCompressionSchema,
  GLTFKHRTextureBasisuSchema,
  GLTFKHRMeshoptCompressionSchema,
  GLTFEXTMeshoptCompressionSchema,
  GLTFEXTTextureWebpSchema,
  GLTFEXTTextureAvifSchema,
  GLTFMSFTTextureDdsSchema,
  GLTFShapeSchema,
  GLTFBoundingVolumeSchema
} from './lib/types/gltf-zod-schema';
export type {GLTFSource, GLTFSourceOptions} from './gltf-source';
export type {GLTFWriterOptions} from './gltf-writer';
export type {compressGLTFWithDraco, GLTFDracoWriterOptions} from './lib/encoders/encode-gltf-draco';

export type {GLTFScenegraph} from './lib/api/gltf-scenegraph';
export type {
  GLTFIterator,
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
export type {getGLTFCullingShape, getGLTFNodeCullingShape} from './lib/api/gltf-culling';
export type {
  convertGLTFV1ToGLTF2,
  normalizeGLTFV1,
  GLTFV1NormalizationLog,
  GLTFV1NormalizationOptions,
  GLTFV1NormalizationReport
} from './lib/api/normalize-gltf-v1';
export type {getMemoryUsageGLTF as _getMemoryUsageGLTF} from './lib/gltf-utils/gltf-utils';
export type {findGLTFFileIndex, resolveGLTFFile} from './lib/gltf-utils/resolve-gltf-file';
export type {
  getGLTFInteractivity,
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
export type {
  getMaterialVariantMappings,
  getMeshInstances,
  getXMPMetadata,
  GLTFMaterialVariantData,
  GLTFMeshInstanceData
} from './lib/api/gltf-extension-data';
export type {
  getGLTFAccessor,
  getGLTFAccessorValue,
  setGLTFAccessorValue,
  GLTFAccessorReference
} from './lib/api/gltf-accessors';
export type {GLTFLoaderOptions} from './gltf-loader-types';
export type {GLTFLoaderWithParser, parse} from './gltf-loader';
export type {getGLTFPrimitiveOutline} from './lib/api/gltf-primitive-outline';
export type {
  GLTFKHRMaterialVariantSchema,
  GLTFKHRMaterialsVariantsSchema,
  GLTFKHRMaterialVariantMappingSchema,
  GLTFKHRMaterialsVariantsPrimitiveSchema,
  GLTFEXTMeshGPUInstancingSchema,
  GLTFKHRAnimationPointerSchema,
  GLTFKHRNodeVisibilitySchema,
  GLTFKHRNodeSelectabilitySchema,
  GLTFKHRNodeHoverabilitySchema,
  GLTFKHRXMPPacketSchema,
  GLTFKHRXMPJSONLDSchema,
  GLTFKHRXMPJSONLDReferenceSchema,
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
  GLTFKHRMaterialsEmissiveStrengthSchema,
  GLTF_KHR_materials_emissive_strength,
  GLTFFBGeometryMetadataSchema,
  GLTF_FB_geometry_metadata
} from './lib/types/gltf-additional-extension-schemas';
export type {
  GLTFKHRAudioDataSchema,
  GLTFKHRAudioSourceSchema,
  GLTFKHRAudioPositionalSchema,
  GLTFKHRAudioEmitterSchema,
  GLTFKHRAudioEmitterExtensionSchema,
  GLTFKHRAudioAttachmentSchema,
  GLTFSpatialAudioSourceSchema,
  GLTFSpatialAudioReverbPropertySchema,
  GLTFSpatialAudioReverbSchema,
  GLTFSpatialAudioListenerSchema,
  GLTFMPEGAudioSpatialSchema
} from './lib/types/gltf-audio-extension-schemas';
export type {
  GLTFPropertyExtensionsSchema,
  GLTFMaterialExtensionsSchema,
  GLTFRootExtensionsSchema,
  GLTFNodeExtensionsSchema,
  GLTFSceneExtensionsSchema,
  GLTFMeshPrimitiveExtensionsSchema,
  GLTFAnimationTargetExtensionsSchema,
  GLTFRootExtensions,
  GLTFMaterialExtensions,
  GLTFNodeExtensions,
  GLTFSceneExtensions,
  GLTFMeshPrimitiveExtensions,
  GLTFAnimationTargetExtensions,
  GLTFPropertyExtensions
} from './lib/types/gltf-extension-schemas';
export {GLBWriter} from './glb-writer-types';
export {GLTFWriter} from './gltf-writer-types';
