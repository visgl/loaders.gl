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

/** Properties shared by every two-dimensional image texture manifest. */
type ImageTextureManifestBase = {
  /** Discriminator identifying a two-dimensional texture manifest. */
  shape: 'image-texture';
  /** Number of template-backed mip levels, or `auto` to infer the complete mip chain. */
  mipLevels?: number | 'auto';
  /** Additional manifest properties are preserved verbatim. */
  [key: string]: unknown;
};

/** A two-dimensional image texture manifest with exactly one image source. */
export type ImageTextureManifest = ImageTextureManifestBase &
  (
    | {
        /** URL of a single texture image. */
        image: string;
        /** Explicit mip chains cannot be combined with a single image. */
        mipmaps?: never;
        /** URL templates cannot be combined with a single image. */
        template?: never;
      }
    | {
        /** A single image cannot be combined with an explicit mip chain. */
        image?: never;
        /** URLs of an explicit mip chain, ordered from largest to smallest. */
        mipmaps: string[];
        /** URL templates cannot be combined with an explicit mip chain. */
        template?: never;
      }
    | {
        /** A single image cannot be combined with a URL template. */
        image?: never;
        /** Explicit mip chains cannot be combined with a URL template. */
        mipmaps?: never;
        /** URL template used to resolve each mip level. */
        template: string;
      }
  );

/** An image texture array manifest. */
export type ImageTextureArrayManifest = {
  /** Discriminator identifying a texture array manifest. */
  shape: 'image-texture-array';
  /** Ordered texture sources for the array layers. */
  layers: ImageTextureSource[];
  /** Additional manifest properties are preserved verbatim. */
  [key: string]: unknown;
};

/** A cube face supplied under its canonical name, direction alias, or both. */
type ImageTextureCubeFacePair<
  CanonicalFace extends ImageTextureCubeFace,
  DirectionAlias extends ImageTextureCubeDirectionAlias
> =
  | (Record<CanonicalFace, ImageTextureSource> &
      Partial<Record<DirectionAlias, ImageTextureSource>>)
  | (Partial<Record<CanonicalFace, ImageTextureSource>> &
      Record<DirectionAlias, ImageTextureSource>);

/** Image sources containing every cube face under a canonical name or direction alias. */
export type ImageTextureCubeFaces = ImageTextureCubeFacePair<'+X', 'right'> &
  ImageTextureCubeFacePair<'-X', 'left'> &
  ImageTextureCubeFacePair<'+Y', 'top'> &
  ImageTextureCubeFacePair<'-Y', 'bottom'> &
  ImageTextureCubeFacePair<'+Z', 'front'> &
  ImageTextureCubeFacePair<'-Z', 'back'> & {
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
  .union([
    z.object({'+X': ImageTextureSourceSchema}).passthrough(),
    z.object({right: ImageTextureSourceSchema}).passthrough()
  ])
  .and(
    z.union([
      z.object({'-X': ImageTextureSourceSchema}).passthrough(),
      z.object({left: ImageTextureSourceSchema}).passthrough()
    ])
  )
  .and(
    z.union([
      z.object({'+Y': ImageTextureSourceSchema}).passthrough(),
      z.object({top: ImageTextureSourceSchema}).passthrough()
    ])
  )
  .and(
    z.union([
      z.object({'-Y': ImageTextureSourceSchema}).passthrough(),
      z.object({bottom: ImageTextureSourceSchema}).passthrough()
    ])
  )
  .and(
    z.union([
      z.object({'+Z': ImageTextureSourceSchema}).passthrough(),
      z.object({front: ImageTextureSourceSchema}).passthrough()
    ])
  )
  .and(
    z.union([
      z.object({'-Z': ImageTextureSourceSchema}).passthrough(),
      z.object({back: ImageTextureSourceSchema}).passthrough()
    ])
  ) satisfies z.ZodType<ImageTextureCubeFaces>;

const imageTextureManifestBaseSchema = z.object({
  shape: z.literal('image-texture'),
  mipLevels: mipLevelsSchema.optional()
});

/** Zod schema for a two-dimensional image texture manifest. */
export const ImageTextureManifestSchema = z.union([
  imageTextureManifestBaseSchema
    .extend({
      image: imageUrlSchema,
      mipmaps: z.never().optional(),
      template: z.never().optional()
    })
    .passthrough(),
  imageTextureManifestBaseSchema
    .extend({
      image: z.never().optional(),
      mipmaps: z.array(imageUrlSchema).min(1),
      template: z.never().optional()
    })
    .passthrough(),
  imageTextureManifestBaseSchema
    .extend({
      image: z.never().optional(),
      mipmaps: z.never().optional(),
      template: imageUrlSchema
    })
    .passthrough()
]) satisfies z.ZodType<ImageTextureManifest>;

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
export const CompositeImageManifestSchema = z.union([
  ImageTextureManifestSchema,
  ImageTextureArrayManifestSchema,
  ImageTextureCubeManifestSchema,
  ImageTextureCubeArrayManifestSchema
]) satisfies z.ZodType<CompositeImageManifest>;
