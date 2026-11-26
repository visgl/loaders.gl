// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Official versioned glTF Zod schemas and their bundled JSON Schema sources. */
export {
  GLTF1Schema,
  GLTF2Schema,
  GLTF21Schema,
  GLTFVersionSchema,
  GLTFExtensionSchemas,
  GLTF1ExtensionSchemas,
  GLTF2ExtensionSchemas,
  GLTF1_JSON_SCHEMA,
  GLTF2_JSON_SCHEMA,
  GLTF21_JSON_SCHEMA,
  GLTF_EXTENSION_JSON_SCHEMAS,
  GLTF_SCHEMA_SOURCE_COMMITS
} from './lib/types/gltf-version-zod-schemas';

// Permissive extension schemas retain unknown properties and do not insert defaults.
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
export {GLTFEXTTextureAvifSchema} from './lib/types/gltf-zod-schema';

export {
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
  GLTFMSFTTextureDdsSchema,
  GLTFShapeSchema,
  GLTFBoundingVolumeSchema
} from './lib/types/gltf-zod-schema';
export {
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
  GLTFKHRMaterialsEmissiveStrengthSchema,
  GLTFFBGeometryMetadataSchema
} from './lib/types/gltf-additional-extension-schemas';
export {
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
export {
  GLTFPropertyExtensionsSchema,
  GLTFMaterialExtensionsSchema,
  GLTFRootExtensionsSchema,
  GLTFNodeExtensionsSchema,
  GLTFSceneExtensionsSchema,
  GLTFMeshPrimitiveExtensionsSchema,
  GLTFAnimationTargetExtensionsSchema
} from './lib/types/gltf-extension-schemas';
