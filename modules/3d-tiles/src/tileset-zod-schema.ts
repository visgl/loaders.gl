// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {z} from 'zod';
import type {
  Tile3DBoundingVolume,
  Tiles3DTileContentJSON,
  Tiles3DTileJSON,
  Tiles3DTilesetAsset,
  Tiles3DTilesetJSON,
  ImplicitTilingData,
  TilesetProperty
} from './types';

/** Zod schema for 3D Tiles asset metadata. */
export const Tiles3DTilesetAssetSchema = z
  .object({
    version: z.string(),
    tilesetVersion: z.string().optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
    extras: z.unknown().optional(),
    gltfUpAxis: z.string().optional()
  })
  .passthrough() satisfies z.ZodType<Tiles3DTilesetAsset>;

/** Zod schema for legacy tileset-wide property ranges. */
export const TilesetPropertySchema = z
  .object({
    maximum: z.number(),
    minimum: z.number(),
    extensions: z.record(z.string(), z.unknown()).optional(),
    extras: z.unknown().optional()
  })
  .passthrough() satisfies z.ZodType<TilesetProperty>;

/** Zod schema for a tile or content bounding volume. */
export const Tile3DBoundingVolumeSchema = z
  .object({
    box: z.array(z.number()).length(12).optional(),
    sphere: z.array(z.number()).length(4).optional(),
    region: z.array(z.number()).length(6).optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
    extras: z.unknown().optional()
  })
  .passthrough()
  .refine(
    boundingVolume =>
      Boolean(
        boundingVolume.box ||
          boundingVolume.sphere ||
          boundingVolume.region ||
          boundingVolume.extensions
      ),
    {message: 'Bounding volume must define box, sphere, region, or an extension'}
  ) satisfies z.ZodType<Tile3DBoundingVolume>;

/** Zod schema for one tile content reference. */
export const Tiles3DTileContentSchema = z
  .object({
    uri: z.string().optional(),
    url: z.string().optional(),
    boundingVolume: Tile3DBoundingVolumeSchema.optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
    extras: z.unknown().optional()
  })
  .passthrough()
  .refine(content => Boolean(content.uri || content.url), {
    message: 'Tile content must define uri or url'
  }) satisfies z.ZodType<Tiles3DTileContentJSON>;

/** Zod schema for the implicit tiling parameters attached to a tile. */
export const ImplicitTilingSchema = z
  .object({
    subdivisionScheme: z.string(),
    subtreeLevels: z.number().int().positive(),
    availableLevels: z.number().int().positive(),
    subtrees: z
      .object({
        uri: z.string()
      })
      .passthrough()
  })
  .passthrough() satisfies z.ZodType<ImplicitTilingData>;

/** Recursive Zod schema for one tile in a 3D Tiles tileset. */
export const Tiles3DTileSchema: z.ZodType<Tiles3DTileJSON> = z.lazy(() =>
  z
    .object({
      boundingVolume: Tile3DBoundingVolumeSchema,
      viewerRequestVolume: Tile3DBoundingVolumeSchema.optional(),
      geometricError: z.number().nonnegative(),
      refine: z.string().optional(),
      transform: z.array(z.number()).length(16).optional(),
      // 3D Tiles 1.1 allows a tile to reference one or more independent contents.
      content: z.union([Tiles3DTileContentSchema, z.array(Tiles3DTileContentSchema)]).optional(),
      children: z.array(Tiles3DTileSchema).default([]),
      extensions: z.record(z.string(), z.unknown()).optional(),
      extras: z.unknown().optional(),
      implicitTiling: ImplicitTilingSchema.optional()
    })
    .passthrough()
);

/** Common fields in raw 3D Tiles tileset JSON before loader normalization. */
const Tiles3DTilesetBaseSchema = z
  .object({
    asset: Tiles3DTilesetAssetSchema,
    properties: z.record(z.string(), TilesetPropertySchema).optional(),
    statistics: z.unknown().optional(),
    groups: z.array(z.unknown()).optional(),
    metadata: z.unknown().optional(),
    geometricError: z.number().nonnegative(),
    root: Tiles3DTileSchema,
    extensionsUsed: z.array(z.string()).optional(),
    extensionsRequired: z.array(z.string()).optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
    extras: z.unknown().optional()
  })
  .passthrough();

/** Mutually exclusive inline, external, or absent metadata schema declarations. */
const Tiles3DMetadataSchemaSource = z.union([
  z
    .object({
      schema: z.record(z.string(), z.unknown()),
      schemaUri: z.never().optional()
    })
    .passthrough(),
  z
    .object({
      schema: z.never().optional(),
      schemaUri: z.string()
    })
    .passthrough(),
  z
    .object({
      schema: z.never().optional(),
      schemaUri: z.never().optional()
    })
    .passthrough()
]);

/** Zod schema for raw 3D Tiles tileset JSON before loader normalization. */
export const Tiles3DTilesetSchema = z.intersection(
  Tiles3DTilesetBaseSchema,
  Tiles3DMetadataSchemaSource
) satisfies z.ZodType<Tiles3DTilesetJSON>;
