// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {z} from 'zod';

const indexSchema = z.number().int().nonnegative();
const propertyShape = {
  /** Nested extension declarations, including extensions unknown to this library. */
  extensions: z.record(z.string(), z.unknown()).optional(),
  /** Application-specific metadata. */
  extras: z.unknown().optional()
};

/** Permissive schema for one named material variant. */
export const GLTFKHRMaterialVariantSchema = z.looseObject({
  ...propertyShape,
  /** User-facing variant name. */
  name: z.string()
});

/** Permissive schema for document-level KHR_materials_variants. */
export const GLTFKHRMaterialsVariantsSchema = z.looseObject({
  ...propertyShape,
  /** Available variants, referenced by primitive mappings. */
  variants: z.array(GLTFKHRMaterialVariantSchema).min(1)
});

/** Permissive schema for a primitive's material-to-variant mapping. */
export const GLTFKHRMaterialVariantMappingSchema = z.looseObject({
  ...propertyShape,
  /** Optional application-facing mapping name. */
  name: z.string().optional(),
  /** Index into the document's materials array. */
  material: indexSchema,
  /** Indices into the document-level variant array. */
  variants: z.array(indexSchema).min(1)
});

/** Permissive schema for primitive-level KHR_materials_variants. */
export const GLTFKHRMaterialsVariantsPrimitiveSchema = z.looseObject({
  ...propertyShape,
  /** Material choices associated with this primitive. */
  mappings: z.array(GLTFKHRMaterialVariantMappingSchema).min(1)
});

/** Permissive schema for EXT_mesh_gpu_instancing, retaining custom instance attributes. */
export const GLTFEXTMeshGPUInstancingSchema = z.looseObject({
  ...propertyShape,
  /** Accessor indices for TRANSLATION, ROTATION, SCALE and custom instance attributes. */
  attributes: z.record(z.string(), indexSchema)
});

/** Permissive schema for KHR_animation_pointer on an animation channel target. */
export const GLTFKHRAnimationPointerSchema = z.looseObject({
  ...propertyShape,
  /** JSON Pointer identifying an animatable property in the original glTF document. */
  pointer: z.string()
});

/** Permissive schema for KHR_node_visibility; omitted visibility means true. */
export const GLTFKHRNodeVisibilitySchema = z.looseObject({
  ...propertyShape,
  /** Whether this node and its descendants are visible. */
  visible: z.boolean().optional()
});

/** Permissive schema for KHR_node_selectability; omitted selectability means true. */
export const GLTFKHRNodeSelectabilitySchema = z.looseObject({
  ...propertyShape,
  /** Whether this node and its descendants participate in selection. */
  selectable: z.boolean().optional()
});

/** Permissive schema for KHR_node_hoverability; omitted hoverability means true. */
export const GLTFKHRNodeHoverabilitySchema = z.looseObject({
  ...propertyShape,
  /** Whether this node and its descendants participate in hover interactions. */
  hoverable: z.boolean().optional()
});

/** Permissive XMP packet schema, retaining arbitrary JSON-LD namespaces and properties. */
export const GLTFKHRXMPPacketSchema = z.looseObject({
  /** Namespace declarations used by this packet. */
  '@context': z.record(z.string(), z.unknown())
});

/** Permissive schema for document-level KHR_xmp_json_ld. */
export const GLTFKHRXMPJSONLDSchema = z.looseObject({
  ...propertyShape,
  /** Shared metadata packets referenced by asset, scene, node and other objects. */
  packets: z.array(GLTFKHRXMPPacketSchema).min(1)
});

/** Permissive schema for an object's KHR_xmp_json_ld packet reference. */
export const GLTFKHRXMPJSONLDReferenceSchema = z.looseObject({
  ...propertyShape,
  /** Index into the document-level packets array. */
  packet: indexSchema
});

/** Document-level material variants with unknown extension properties preserved. */
export type GLTF_KHR_materials_variants = z.infer<typeof GLTFKHRMaterialsVariantsSchema>;
/** One named material variant. */
export type GLTFMaterialVariant = z.infer<typeof GLTFKHRMaterialVariantSchema>;
/** Primitive-level variant mappings. */
export type GLTF_KHR_materials_variants_primitive = z.infer<
  typeof GLTFKHRMaterialsVariantsPrimitiveSchema
>;
/** One mapping from a material to variant indices. */
export type GLTFMaterialVariantMapping = z.infer<typeof GLTFKHRMaterialVariantMappingSchema>;
/** GPU instance accessor references, including custom attributes. */
export type GLTF_EXT_mesh_gpu_instancing = z.infer<typeof GLTFEXTMeshGPUInstancingSchema>;
/** Animation channel target expressed as a JSON Pointer. */
export type GLTF_KHR_animation_pointer = z.infer<typeof GLTFKHRAnimationPointerSchema>;
/** Local node visibility declaration. */
export type GLTF_KHR_node_visibility = z.infer<typeof GLTFKHRNodeVisibilitySchema>;
/** Local node selectability declaration. */
export type GLTF_KHR_node_selectability = z.infer<typeof GLTFKHRNodeSelectabilitySchema>;
/** Local node hoverability declaration. */
export type GLTF_KHR_node_hoverability = z.infer<typeof GLTFKHRNodeHoverabilitySchema>;
/** Document-level XMP packet collection. */
export type GLTF_KHR_xmp_json_ld = z.infer<typeof GLTFKHRXMPJSONLDSchema>;
/** One JSON-LD XMP metadata packet. */
export type GLTFXMPPacket = z.infer<typeof GLTFKHRXMPPacketSchema>;
/** Reference to a shared XMP metadata packet. */
export type GLTF_KHR_xmp_json_ld_reference = z.infer<typeof GLTFKHRXMPJSONLDReferenceSchema>;
