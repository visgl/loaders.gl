// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {z} from 'zod';

const imageUrlSchema = z.string().min(1);
const mipLevelsSchema = z.union([z.literal('auto'), z.number().int().positive()]);

/** Zod schema for a template-backed texture source. */
export const ImageTextureTemplateSourceSchema = z
  .object({
    mipLevels: mipLevelsSchema,
    template: imageUrlSchema
  })
  .passthrough();

/** Zod schema for a URL, explicit mip chain, or template-backed texture source. */
export const ImageTextureSourceSchema = z.union([
  imageUrlSchema,
  z.array(imageUrlSchema).min(1),
  ImageTextureTemplateSourceSchema
]);

const imageTextureCubeFacesSchema = z
  .object({
    '+X': ImageTextureSourceSchema.optional(),
    '-X': ImageTextureSourceSchema.optional(),
    '+Y': ImageTextureSourceSchema.optional(),
    '-Y': ImageTextureSourceSchema.optional(),
    '+Z': ImageTextureSourceSchema.optional(),
    '-Z': ImageTextureSourceSchema.optional(),
    right: ImageTextureSourceSchema.optional(),
    left: ImageTextureSourceSchema.optional(),
    top: ImageTextureSourceSchema.optional(),
    bottom: ImageTextureSourceSchema.optional(),
    front: ImageTextureSourceSchema.optional(),
    back: ImageTextureSourceSchema.optional()
  })
  .passthrough();

/** Zod schema for a two-dimensional image texture manifest. */
export const ImageTextureManifestSchema = z
  .object({
    shape: z.literal('image-texture'),
    image: imageUrlSchema.optional(),
    mipLevels: mipLevelsSchema.optional(),
    template: imageUrlSchema.optional(),
    mipmaps: z.array(imageUrlSchema).min(1).optional()
  })
  .passthrough();

/** Zod schema for an image texture array manifest. */
export const ImageTextureArrayManifestSchema = z
  .object({
    shape: z.literal('image-texture-array'),
    layers: z.array(ImageTextureSourceSchema).min(1)
  })
  .passthrough();

/** Zod schema for an image texture cube manifest. */
export const ImageTextureCubeManifestSchema = z
  .object({
    shape: z.literal('image-texture-cube'),
    faces: imageTextureCubeFacesSchema
  })
  .passthrough();

/** Zod schema for one layer in an image texture cube array manifest. */
export const ImageTextureCubeArrayLayerSchema = z
  .object({
    faces: imageTextureCubeFacesSchema
  })
  .passthrough();

/** Zod schema for an image texture cube array manifest. */
export const ImageTextureCubeArrayManifestSchema = z
  .object({
    shape: z.literal('image-texture-cube-array'),
    layers: z.array(ImageTextureCubeArrayLayerSchema).min(1)
  })
  .passthrough();

/** Zod schema for every composite image manifest supported by the texture loaders. */
export const CompositeImageManifestSchema = z.discriminatedUnion('shape', [
  ImageTextureManifestSchema,
  ImageTextureArrayManifestSchema,
  ImageTextureCubeManifestSchema,
  ImageTextureCubeArrayManifestSchema
]);

/** A template-backed texture source. */
export type ImageTextureTemplateSource = z.infer<typeof ImageTextureTemplateSourceSchema>;

/** A URL, explicit mip chain, or template-backed texture source. */
export type ImageTextureSource = z.infer<typeof ImageTextureSourceSchema>;

/** A two-dimensional image texture manifest. */
export type ImageTextureManifest = z.infer<typeof ImageTextureManifestSchema>;

/** An image texture array manifest. */
export type ImageTextureArrayManifest = z.infer<typeof ImageTextureArrayManifestSchema>;

/** Image sources keyed by cube face name or direction alias. */
export type ImageTextureCubeFaces = z.infer<typeof imageTextureCubeFacesSchema>;

/** An image texture cube manifest. */
export type ImageTextureCubeManifest = z.infer<typeof ImageTextureCubeManifestSchema>;

/** One layer in an image texture cube array manifest. */
export type ImageTextureCubeArrayLayer = z.infer<typeof ImageTextureCubeArrayLayerSchema>;

/** An image texture cube array manifest. */
export type ImageTextureCubeArrayManifest = z.infer<typeof ImageTextureCubeArrayManifestSchema>;

/** Every composite image manifest supported by the texture loaders. */
export type CompositeImageManifest = z.infer<typeof CompositeImageManifestSchema>;
