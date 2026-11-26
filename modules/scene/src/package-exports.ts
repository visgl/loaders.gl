// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// loaders.gl

export {USDLoader} from './usd/usd-loader-types';
export type {USDAssetPath} from './usd/lib/usd-types';
export type {USDAttribute} from './usd/lib/usd-types';
export type {USDEmbeddedAsset} from './usd/lib/usd-types';
export type {USDLoaderOptions} from './usd/lib/usd-types';
export type {USDPrim} from './usd/lib/usd-types';
export type {USDScenePath} from './usd/lib/usd-types';
export type {USDStage} from './usd/lib/usd-types';
export type {USDValue} from './usd/lib/usd-types';
export type {USDVariant} from './usd/lib/usd-types';
export type {GLB, GLBChunk} from './gltf/lib/types/glb-types';
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
} from './gltf/lib/types/gltf-json-schema';
export type {GLTFShape, GLTFBoundingVolume} from './gltf/lib/types/gltf-shape-schema';
export type {
  GLTF_MPEG_audio_spatial,
  GLTFSpatialAudio,
  GLTFSpatialAudioSource,
  GLTFSpatialAudioListener,
  GLTFSpatialAudioReverb,
  GLTFSpatialAudioReverbProperty
} from './gltf/lib/types/gltf-mpeg-audio-spatial-schema';
export type {
  name as MPEG_AUDIO_SPATIAL,
  getSpatialAudio
} from './gltf/lib/extensions/MPEG_audio_spatial';
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
} from './gltf/lib/types/gltf-khr-audio-emitter-schema';
export type {name as KHR_AUDIO_EMITTER} from './gltf/lib/extensions/KHR_audio_emitter';
export type {
  GLTF_EXT_mesh_polygon,
  GLTFImplicitFeatureIdRange,
  GLTFMeshPolygonData,
  GLTFPolygon,
  GLTFPrimitiveIndexRange,
  GLTFPrimitiveRestartData
} from './gltf/lib/types/gltf-vector-topology';
export type {
  GLTF_KHR_gaussian_splatting,
  GLTF_KHR_gaussian_splatting_compression_spz_2,
  GLTFGaussianSplatPrimitive
} from './gltf/lib/types/gltf-ext-gaussian-splatting-schema';
export type {
  GLTF_EXT_primitive_voxels,
  GLTFVoxelPrimitive
} from './gltf/lib/types/gltf-ext-vector-voxel-schema';
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
} from './gltf/lib/types/gltf-ext-feature-metadata-schema';
export type {
  GLTF_EXT_structural_metadata_GLTF,
  GLTF_EXT_structural_metadata_Schema,
  GLTF_EXT_structural_metadata_PropertyTable,
  GLTF_EXT_structural_metadata_PropertyTexture,
  GLTF_EXT_structural_metadata_Class,
  GLTF_EXT_structural_metadata_ClassProperty
} from './gltf/lib/types/gltf-ext-structural-metadata-schema';
export type {
  GLTF_EXT_mesh_features,
  GLTF_EXT_mesh_features_featureId
} from './gltf/lib/types/gltf-ext-mesh-features-schema';
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
export type {
  GLTFWithBuffers,
  GLTFExternalFile,
  FeatureTableJson
} from './gltf/lib/types/gltf-types';
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
} from './gltf/lib/types/gltf-zod-schema';
export type {GLTFSource, GLTFSourceOptions} from './gltf/gltf-source';
export type {
  compressGLTFWithDraco,
  GLTFDracoWriterOptions
} from './gltf/lib/encoders/encode-gltf-draco';
export type {GLTFScenegraph} from './gltf/lib/api/gltf-scenegraph';
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
} from './gltf/lib/api/gltf-iterator';
export type {getGLTFCullingShape, getGLTFNodeCullingShape} from './gltf/lib/api/gltf-culling';
export type {
  convertGLTFV1ToGLTF2,
  normalizeGLTFV1,
  GLTFV1NormalizationLog,
  GLTFV1NormalizationOptions,
  GLTFV1NormalizationReport
} from './gltf/lib/api/normalize-gltf-v1';
export type {getMemoryUsageGLTF as _getMemoryUsageGLTF} from './gltf/lib/gltf-utils/gltf-utils';
export type {findGLTFFileIndex, resolveGLTFFile} from './gltf/lib/gltf-utils/resolve-gltf-file';
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
} from './gltf/lib/types/gltf-interactivity';
export type {
  getMaterialVariantMappings,
  getMeshInstances,
  getXMPMetadata,
  GLTFMaterialVariantData,
  GLTFMeshInstanceData
} from './gltf/lib/api/gltf-extension-data';
export type {
  getGLTFAccessor,
  getGLTFAccessorValue,
  setGLTFAccessorValue,
  GLTFAccessorReference
} from './gltf/lib/api/gltf-accessors';
export type {GLTFLoaderOptions} from './gltf/gltf-loader-types';
export type {GLTFLoaderWithParser, parse} from './gltf/gltf-loader';
export type {GLTFWriterOptions} from './gltf/gltf-writer';
export type {getGLTFPrimitiveOutline} from './gltf/lib/api/gltf-primitive-outline';
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
} from './gltf/lib/types/gltf-additional-extension-schemas';
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
} from './gltf/lib/types/gltf-audio-extension-schemas';
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
} from './gltf/lib/types/gltf-extension-schemas';
export type {OBJLoaderOptions, OBJMeshBatch, OBJParsedBatch} from './obj/obj-loader-definition';
export type {OBJWriterOptions} from './obj/obj-writer';
export type {MTLLoaderOptions} from './obj/mtl-loader-types';
export type {OBJLoaderWithParser} from './obj-loader';
export {OBJLoader} from './obj/obj-loader-types';
export {MTLLoader} from './obj/mtl-loader-types';
export {OBJFormat} from './obj/obj-format';
export {MTLFormat} from './obj/mtl-format';
export {OBJWriter} from './obj/obj-writer';
export {GLTFLoader} from './gltf/gltf-loader-types';
export {GLTFWriter} from './gltf/gltf-writer';
export {GLBLoader} from './gltf/glb-loader-types';
export {GLBWriter} from './gltf/glb-writer';
export {GLTFFormat} from './gltf/gltf-format';
export {GLBFormat} from './gltf/gltf-format';

export {DracoLoader} from './draco/draco-loader-types';
export {DracoFormat} from './draco/draco-format';
export type {DracoDecoderProfile} from './draco/lib/draco-module-loader';
export type {DracoMesh, DracoLoaderData} from './draco/lib/draco-types';
export type {
  DracoBatchOptions,
  DracoBatchProgress,
  DracoWriterAttributes,
  DracoWriterInput,
  DracoWriterInputBatch,
  DracoWriterOptions,
  encodeDraco,
  encodeDracoBatch,
  encodeDracoInBatches,
  DracoWriterWorker,
  DracoWriter
} from './draco/draco-writer';
export type {
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
} from './draco/lib/draco-builder';
export type {DracoLoaderOptions} from './draco/draco-loader-options';
export {DRACO_EXTERNAL_LIBRARIES} from './draco/draco-libraries';
export {DRACO_EXTERNAL_LIBRARY_URLS} from './draco/draco-libraries';

export {MaterialXLoader} from './materialx-loader-types';
export type {MaterialXDocument} from './materialx/parse-materialx';
export type {MaterialXElement} from './materialx/parse-materialx';

export {STLLoader} from './stl-loader-types';
