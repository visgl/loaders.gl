// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {z} from 'zod';
import type {ImageTextureCubeDirectionAlias, ImageTextureCubeFace} from './image-texture-cube';

/** A template-backed texture source. */
export type ImageTextureTemplateSource = {
  /** Number of mip levels to generate, or `auto` to infer the complete mip chain. */
  mipLevels: number | 'auto';
  /** URL template used to resolve each texture image. */
  template: string;
  /** Additional source properties are preserved verbatim. */
  [key: string]: unknown;
};

/** A URL, explicit mip chain, or template-backed texture source. */
export type ImageTextureSource = string | string[] | ImageTextureTemplateSource;

/** A two-dimensional image texture manifest. */
export type ImageTextureManifest = {
  /** Discriminator identifying a two-dimensional texture manifest. */
  shape: 'image-texture';
  /** URL of a single texture image. */
  image?: string;
  /** Number of template-backed mip levels, or `auto` to infer the complete mip chain. */
  mipLevels?: number | 'auto';
  /** URL template used to resolve each mip level. */
  template?: string;
  /** URLs of an explicit mip chain, ordered from largest to smallest. */
  mipmaps?: string[];
  /** Additional manifest properties are preserved verbatim. */
  [key: string]: unknown;
};

/** An image texture array manifest. */
export type ImageTextureArrayManifest = {
  /** Discriminator identifying a texture array manifest. */
  shape: 'image-texture-array';
  /** Ordered texture sources for the array layers. */
  layers: ImageTextureSource[];
  /** Additional manifest properties are preserved verbatim. */
  [key: string]: unknown;
};

/** Image sources keyed by cube face name or direction alias. */
export type ImageTextureCubeFaces = Partial<
  Record<ImageTextureCubeFace | ImageTextureCubeDirectionAlias, ImageTextureSource>
> & {
  /** Additional face properties are preserved verbatim. */
  [key: string]: unknown;
};

/** An image texture cube manifest. */
export type ImageTextureCubeManifest = {
  /** Discriminator identifying a cube texture manifest. */
  shape: 'image-texture-cube';
  /** Texture source for each cube face. */
  faces: ImageTextureCubeFaces;
  /** Additional manifest properties are preserved verbatim. */
  [key: string]: unknown;
};

/** One layer in an image texture cube array manifest. */
export type ImageTextureCubeArrayLayer = {
  /** Texture source for each cube face in this layer. */
  faces: ImageTextureCubeFaces;
  /** Additional layer properties are preserved verbatim. */
  [key: string]: unknown;
};

/** An image texture cube array manifest. */
export type ImageTextureCubeArrayManifest = {
  /** Discriminator identifying a cube texture array manifest. */
  shape: 'image-texture-cube-array';
  /** Ordered cube texture layers. */
  layers: ImageTextureCubeArrayLayer[];
  /** Additional manifest properties are preserved verbatim. */
  [key: string]: unknown;
};

/** Every composite image manifest supported by the texture loaders. */
export type CompositeImageManifest =
  | ImageTextureManifest
  | ImageTextureArrayManifest
  | ImageTextureCubeManifest
  | ImageTextureCubeArrayManifest;

const imageUrlSchema = z.string().min(1);
const mipLevelsSchema = z.union([z.literal('auto'), z.number().int().positive()]);

/** Zod schema for a template-backed texture source. */
export const ImageTextureTemplateSourceSchema = z
  .object({
    mipLevels: mipLevelsSchema,
    template: imageUrlSchema
  })
  .passthrough() satisfies z.ZodType<ImageTextureTemplateSource>;

/** Zod schema for a URL, explicit mip chain, or template-backed texture source. */
export const ImageTextureSourceSchema = z.union([
  imageUrlSchema,
  z.array(imageUrlSchema).min(1),
  ImageTextureTemplateSourceSchema
]) satisfies z.ZodType<ImageTextureSource>;

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
  .passthrough() satisfies z.ZodType<ImageTextureCubeFaces>;

/** Zod schema for a two-dimensional image texture manifest. */
export const ImageTextureManifestSchema = z
  .object({
    shape: z.literal('image-texture'),
    image: imageUrlSchema.optional(),
    mipLevels: mipLevelsSchema.optional(),
    template: imageUrlSchema.optional(),
    mipmaps: z.array(imageUrlSchema).min(1).optional()
  })
  .passthrough() satisfies z.ZodType<ImageTextureManifest>;

/** Zod schema for an image texture array manifest. */
export const ImageTextureArrayManifestSchema = z
  .object({
    shape: z.literal('image-texture-array'),
    layers: z.array(ImageTextureSourceSchema).min(1)
  })
  .passthrough() satisfies z.ZodType<ImageTextureArrayManifest>;

/** Zod schema for an image texture cube manifest. */
export const ImageTextureCubeManifestSchema = z
  .object({
    shape: z.literal('image-texture-cube'),
    faces: imageTextureCubeFacesSchema
  })
  .passthrough() satisfies z.ZodType<ImageTextureCubeManifest>;

/** Zod schema for one layer in an image texture cube array manifest. */
export const ImageTextureCubeArrayLayerSchema = z
  .object({
    faces: imageTextureCubeFacesSchema
  })
  .passthrough() satisfies z.ZodType<ImageTextureCubeArrayLayer>;

/** Zod schema for an image texture cube array manifest. */
export const ImageTextureCubeArrayManifestSchema = z
  .object({
    shape: z.literal('image-texture-cube-array'),
    layers: z.array(ImageTextureCubeArrayLayerSchema).min(1)
  })
  .passthrough() satisfies z.ZodType<ImageTextureCubeArrayManifest>;

/** Zod schema for every composite image manifest supported by the texture loaders. */
export const CompositeImageManifestSchema = z.discriminatedUnion('shape', [
  ImageTextureManifestSchema,
  ImageTextureArrayManifestSchema,
  ImageTextureCubeManifestSchema,
  ImageTextureCubeArrayManifestSchema
]) satisfies z.ZodType<CompositeImageManifest>;
