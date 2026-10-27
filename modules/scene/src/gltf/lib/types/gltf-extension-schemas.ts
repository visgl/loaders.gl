// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {z} from 'zod';
import {
  GLTFKHRMaterialsVariantsSchema,
  GLTFKHRMaterialsVariantsPrimitiveSchema,
  GLTFEXTMeshGPUInstancingSchema,
  GLTFKHRAnimationPointerSchema,
  GLTFKHRNodeVisibilitySchema,
  GLTFKHRNodeSelectabilitySchema,
  GLTFKHRNodeHoverabilitySchema,
  GLTFKHRXMPJSONLDSchema,
  GLTFKHRXMPJSONLDReferenceSchema
} from './gltf-additional-extension-schemas';
import {
  GLTFKHRAudioEmitterExtensionSchema,
  GLTFKHRAudioAttachmentSchema,
  GLTFMPEGAudioSpatialSchema
} from './gltf-audio-extension-schemas';

/** Permissive extension map for objects that can reference an XMP packet. */
export const GLTFPropertyExtensionsSchema = z.looseObject({
  /** Shared XMP packet reference. */
  KHR_xmp_json_ld: GLTFKHRXMPJSONLDReferenceSchema.optional()
});

/** Permissive document-level extension map. */
export const GLTFRootExtensionsSchema = z.looseObject({
  /** Shared material variant declarations. */
  KHR_materials_variants: GLTFKHRMaterialsVariantsSchema.optional(),
  /** Shared XMP metadata packets. */
  KHR_xmp_json_ld: GLTFKHRXMPJSONLDSchema.optional(),
  /** Shared KHR audio resources, sources and emitters. */
  KHR_audio_emitter: GLTFKHRAudioEmitterExtensionSchema.optional(),
  /** Root-level MPEG spatial audio declaration. */
  MPEG_audio_spatial: GLTFMPEGAudioSpatialSchema.optional()
});

/** Permissive node-level extension map. */
export const GLTFNodeExtensionsSchema = GLTFPropertyExtensionsSchema.extend({
  /** Accessors defining GPU instance attributes. */
  EXT_mesh_gpu_instancing: GLTFEXTMeshGPUInstancingSchema.optional(),
  /** Local visibility affecting the entire subtree. */
  KHR_node_visibility: GLTFKHRNodeVisibilitySchema.optional(),
  /** Local selectability affecting the entire subtree. */
  KHR_node_selectability: GLTFKHRNodeSelectabilitySchema.optional(),
  /** Local hoverability affecting the entire subtree. */
  KHR_node_hoverability: GLTFKHRNodeHoverabilitySchema.optional(),
  /** Attached KHR audio emitters. */
  KHR_audio_emitter: GLTFKHRAudioAttachmentSchema.optional(),
  /** Node-level MPEG spatial audio declaration. */
  MPEG_audio_spatial: GLTFMPEGAudioSpatialSchema.optional()
});

/** Permissive scene-level extension map. */
export const GLTFSceneExtensionsSchema = GLTFPropertyExtensionsSchema.extend({
  /** Attached global KHR audio emitters. */
  KHR_audio_emitter: GLTFKHRAudioAttachmentSchema.optional()
});

/** Permissive mesh-primitive extension map. */
export const GLTFMeshPrimitiveExtensionsSchema = z.looseObject({
  /** Material-to-variant mappings for this primitive. */
  KHR_materials_variants: GLTFKHRMaterialsVariantsPrimitiveSchema.optional()
});

/** Permissive animation-target extension map. */
export const GLTFAnimationTargetExtensionsSchema = z.looseObject({
  /** JSON Pointer identifying the animated property. */
  KHR_animation_pointer: GLTFKHRAnimationPointerSchema.optional()
});

/** Typed document-level extensions with arbitrary additional extension names. */
export type GLTFRootExtensions = z.infer<typeof GLTFRootExtensionsSchema>;
/** Typed node-level extensions with arbitrary additional extension names. */
export type GLTFNodeExtensions = z.infer<typeof GLTFNodeExtensionsSchema>;
/** Typed scene-level extensions with arbitrary additional extension names. */
export type GLTFSceneExtensions = z.infer<typeof GLTFSceneExtensionsSchema>;
/** Typed primitive-level extensions with arbitrary additional extension names. */
export type GLTFMeshPrimitiveExtensions = z.infer<typeof GLTFMeshPrimitiveExtensionsSchema>;
/** Typed animation-target extensions with arbitrary additional extension names. */
export type GLTFAnimationTargetExtensions = z.infer<typeof GLTFAnimationTargetExtensionsSchema>;

/** Typed shared metadata extensions with arbitrary additional extension names. */
export type GLTFPropertyExtensions = z.infer<typeof GLTFPropertyExtensionsSchema>;
