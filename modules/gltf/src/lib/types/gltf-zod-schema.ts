// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {z} from 'zod';

/** Zod schema for an index into a top-level glTF array. */
export const GLTFIdSchema = z.number().int().nonnegative();
const GLTF_EXTENSIONS_SCHEMA = z.record(z.string(), z.unknown());
const GLTF_PROPERTY_SHAPE = {
  extensions: GLTF_EXTENSIONS_SCHEMA.optional(),
  extras: z.unknown().optional()
};
const GLTF_NAMED_PROPERTY_SHAPE = {
  ...GLTF_PROPERTY_SHAPE,
  name: z.string().optional()
};

/** Zod schema for sparse accessor indices. */
export const GLTFAccessorSparseIndicesSchema = z
  .object({
    bufferView: GLTFIdSchema,
    byteOffset: z.number().int().nonnegative().optional(),
    componentType: z.union([z.literal(5121), z.literal(5123), z.literal(5125)]),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for sparse accessor values. */
export const GLTFAccessorSparseValuesSchema = z
  .object({
    bufferView: GLTFIdSchema,
    byteOffset: z.number().int().nonnegative().optional(),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for sparse accessor storage. */
export const GLTFAccessorSparseSchema = z
  .object({
    count: z.number().int().positive(),
    indices: GLTFAccessorSparseIndicesSchema,
    values: GLTFAccessorSparseValuesSchema,
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF accessor. */
export const GLTFAccessorSchema = z
  .object({
    bufferView: GLTFIdSchema.optional(),
    byteOffset: z.number().int().nonnegative().optional(),
    componentType: z.union([
      z.literal(5120),
      z.literal(5121),
      z.literal(5122),
      z.literal(5123),
      z.literal(5125),
      z.literal(5126)
    ]),
    normalized: z.boolean().optional(),
    count: z.number().int().positive(),
    type: z.enum(['SCALAR', 'VEC2', 'VEC3', 'VEC4', 'MAT2', 'MAT3', 'MAT4']),
    max: z.array(z.number()).min(1).max(16).optional(),
    min: z.array(z.number()).min(1).max(16).optional(),
    sparse: GLTFAccessorSparseSchema.optional(),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for an animation channel target. */
export const GLTFAnimationChannelTargetSchema = z
  .object({
    node: GLTFIdSchema.optional(),
    path: z.enum(['translation', 'rotation', 'scale', 'weights']),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for an animation channel. */
export const GLTFAnimationChannelSchema = z
  .object({
    sampler: GLTFIdSchema,
    target: GLTFAnimationChannelTargetSchema,
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for an animation sampler. */
export const GLTFAnimationSamplerSchema = z
  .object({
    input: GLTFIdSchema,
    interpolation: z.enum(['LINEAR', 'STEP', 'CUBICSPLINE']).optional(),
    output: GLTFIdSchema,
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF animation. */
export const GLTFAnimationSchema = z
  .object({
    channels: z.array(GLTFAnimationChannelSchema).min(1),
    samplers: z.array(GLTFAnimationSamplerSchema).min(1),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for glTF asset metadata. */
export const GLTFAssetSchema = z
  .object({
    copyright: z.string().optional(),
    generator: z.string().optional(),
    version: z.string(),
    minVersion: z.string().optional(),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF buffer. */
export const GLTFBufferSchema = z
  .object({
    uri: z.string().optional(),
    byteLength: z.number().int().positive(),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF buffer view. */
export const GLTFBufferViewSchema = z
  .object({
    buffer: GLTFIdSchema,
    byteOffset: z.number().int().nonnegative().optional(),
    byteLength: z.number().int().positive(),
    byteStride: z.number().int().min(4).max(252).optional(),
    target: z.number().int().optional(),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for an orthographic glTF camera. */
export const GLTFCameraOrthographicSchema = z
  .object({
    xmag: z.number(),
    ymag: z.number(),
    zfar: z.number(),
    znear: z.number().nonnegative(),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a perspective glTF camera. */
export const GLTFCameraPerspectiveSchema = z
  .object({
    aspectRatio: z.number().positive().optional(),
    yfov: z.number().positive(),
    zfar: z.number().positive().optional(),
    znear: z.number().positive(),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF camera. */
export const GLTFCameraSchema = z
  .object({
    orthographic: GLTFCameraOrthographicSchema.optional(),
    perspective: GLTFCameraPerspectiveSchema.optional(),
    type: z.enum(['perspective', 'orthographic']),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF image. */
export const GLTFImageSchema = z
  .object({
    uri: z.string().optional(),
    mimeType: z.string().optional(),
    bufferView: GLTFIdSchema.optional(),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF texture reference. */
export const GLTFTextureInfoSchema = z
  .object({
    index: GLTFIdSchema,
    texCoord: z.number().int().nonnegative().optional(),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a metadata texture reference. */
export const GLTFTextureInfoMetadataSchema = GLTFTextureInfoSchema.extend({
  channels: z.union([z.array(z.number().int().nonnegative()), z.string()]),
  data: z.unknown().optional()
});

/** Zod schema for a metallic-roughness PBR material definition. */
export const GLTFMaterialPbrMetallicRoughnessSchema = z
  .object({
    baseColorFactor: z.array(z.number()).length(4).optional(),
    baseColorTexture: GLTFTextureInfoSchema.optional(),
    metallicFactor: z.number().min(0).max(1).optional(),
    roughnessFactor: z.number().min(0).max(1).optional(),
    metallicRoughnessTexture: GLTFTextureInfoSchema.optional(),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a normal texture reference. */
export const GLTFMaterialNormalTextureInfoSchema = z
  .object({
    index: GLTFIdSchema,
    texCoord: z.number().int().nonnegative().optional(),
    scale: z.number().optional(),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for an occlusion texture reference. */
export const GLTFMaterialOcclusionTextureInfoSchema = z
  .object({
    index: GLTFIdSchema,
    texCoord: z.number().int().nonnegative().optional(),
    strength: z.number().min(0).max(1).optional(),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF material. */
export const GLTFMaterialSchema = z
  .object({
    pbrMetallicRoughness: GLTFMaterialPbrMetallicRoughnessSchema.optional(),
    normalTexture: GLTFMaterialNormalTextureInfoSchema.optional(),
    occlusionTexture: GLTFMaterialOcclusionTextureInfoSchema.optional(),
    emissiveTexture: GLTFTextureInfoSchema.optional(),
    emissiveFactor: z.array(z.number()).length(3).optional(),
    alphaMode: z.enum(['OPAQUE', 'MASK', 'BLEND']).optional(),
    alphaCutoff: z.number().optional(),
    doubleSided: z.boolean().optional(),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF mesh primitive. */
export const GLTFMeshPrimitiveSchema = z
  .object({
    attributes: z.record(z.string(), GLTFIdSchema),
    indices: GLTFIdSchema.optional(),
    material: GLTFIdSchema.optional(),
    mode: z
      .union([
        z.literal(0),
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6)
      ])
      .optional(),
    targets: z.array(z.record(z.string(), GLTFIdSchema)).min(1).optional(),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF mesh. */
export const GLTFMeshSchema = z
  .object({
    id: z.string().optional(),
    primitives: z.array(GLTFMeshPrimitiveSchema).min(1),
    weights: z.array(z.number()).min(1).optional(),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF node. */
export const GLTFNodeSchema = z
  .object({
    camera: GLTFIdSchema.optional(),
    children: z.array(GLTFIdSchema).min(1).optional(),
    skin: GLTFIdSchema.optional(),
    matrix: z.array(z.number()).length(16).optional(),
    mesh: GLTFIdSchema.optional(),
    rotation: z.array(z.number()).length(4).optional(),
    scale: z.array(z.number()).length(3).optional(),
    translation: z.array(z.number()).length(3).optional(),
    weights: z.array(z.number()).min(1).optional(),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF texture sampler. */
export const GLTFSamplerSchema = z
  .object({
    magFilter: z.union([z.literal(9728), z.literal(9729)]).optional(),
    minFilter: z
      .union([
        z.literal(9728),
        z.literal(9729),
        z.literal(9984),
        z.literal(9985),
        z.literal(9986),
        z.literal(9987)
      ])
      .optional(),
    wrapS: z.union([z.literal(33071), z.literal(33648), z.literal(10497)]).optional(),
    wrapT: z.union([z.literal(33071), z.literal(33648), z.literal(10497)]).optional(),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF scene. */
export const GLTFSceneSchema = z
  .object({
    nodes: z.array(GLTFIdSchema).min(1).optional(),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF skin. */
export const GLTFSkinSchema = z
  .object({
    id: z.string().optional(),
    inverseBindMatrices: GLTFIdSchema.optional(),
    skeleton: GLTFIdSchema.optional(),
    joints: z.array(GLTFIdSchema).min(1),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a glTF texture. */
export const GLTFTextureSchema = z
  .object({
    sampler: GLTFIdSchema.optional(),
    source: GLTFIdSchema.optional(),
    ...GLTF_NAMED_PROPERTY_SHAPE
  })
  .catchall(z.unknown());

/** Zod schema for a complete glTF 2.0 JSON document. */
export const GLTFSchema = z
  .object({
    extensionsUsed: z.array(z.string()).min(1).optional(),
    extensionsRequired: z.array(z.string()).min(1).optional(),
    accessors: z.array(GLTFAccessorSchema).min(1).optional(),
    animations: z.array(GLTFAnimationSchema).min(1).optional(),
    asset: GLTFAssetSchema,
    buffers: z.array(GLTFBufferSchema).min(1).optional(),
    bufferViews: z.array(GLTFBufferViewSchema).min(1).optional(),
    cameras: z.array(GLTFCameraSchema).min(1).optional(),
    images: z.array(GLTFImageSchema).min(1).optional(),
    materials: z.array(GLTFMaterialSchema).min(1).optional(),
    meshes: z.array(GLTFMeshSchema).min(1).optional(),
    nodes: z.array(GLTFNodeSchema).min(1).optional(),
    samplers: z.array(GLTFSamplerSchema).min(1).optional(),
    scene: GLTFIdSchema.optional(),
    scenes: z.array(GLTFSceneSchema).min(1).optional(),
    skins: z.array(GLTFSkinSchema).min(1).optional(),
    textures: z.array(GLTFTextureSchema).min(1).optional(),
    ...GLTF_PROPERTY_SHAPE
  })
  .catchall(z.unknown())
  .describe('The root object for a glTF 2.0 asset.');

/** Zod schema for any core glTF object. */
export const GLTFObjectSchema = z.union([
  GLTFAccessorSchema,
  GLTFBufferSchema,
  GLTFBufferViewSchema,
  GLTFMeshPrimitiveSchema,
  GLTFMeshSchema,
  GLTFNodeSchema,
  GLTFMaterialSchema,
  GLTFSamplerSchema,
  GLTFSceneSchema,
  GLTFSkinSchema,
  GLTFTextureSchema,
  GLTFImageSchema
]);

/** Zod schema for the KHR_binary_glTF extension. */
export const GLTFKHRBinarySchema = z
  .object({
    bufferView: GLTFIdSchema,
    mimeType: z.string().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    extras: z.unknown().optional()
  })
  .catchall(z.unknown());

/** Zod schema for the KHR_draco_mesh_compression extension. */
export const GLTFKHRDracoMeshCompressionSchema = z
  .object({
    bufferView: GLTFIdSchema,
    attributes: z.record(z.string(), GLTFIdSchema),
    extras: z.unknown().optional()
  })
  .catchall(z.unknown());

/** Zod schema for the KHR_texture_basisu extension. */
export const GLTFKHRTextureBasisuSchema = z
  .object({source: GLTFIdSchema, extras: z.unknown().optional()})
  .catchall(z.unknown());

/** Zod schema for the EXT_meshopt_compression extension. */
export const GLTFEXTMeshoptCompressionSchema = z
  .object({
    buffer: GLTFIdSchema,
    byteOffset: z.number().int().nonnegative().optional(),
    byteLength: z.number().int().positive(),
    byteStride: z.number().int().positive(),
    count: z.number().int().positive(),
    mode: z.enum(['ATTRIBUTES', 'TRIANGLES', 'INDICES']),
    filter: z.enum(['NONE', 'OCTAHEDRAL', 'QUATERNION', 'EXPONENTIAL']).optional(),
    extras: z.unknown().optional()
  })
  .catchall(z.unknown());

/** Zod schema for the EXT_texture_webp extension. */
export const GLTFEXTTextureWebpSchema = z
  .object({source: GLTFIdSchema, extras: z.unknown().optional()})
  .catchall(z.unknown());

/** Zod schema for the MSFT_texture_dds extension. */
export const GLTFMSFTTextureDdsSchema = z
  .object({source: GLTFIdSchema, extras: z.unknown().optional()})
  .catchall(z.unknown());
