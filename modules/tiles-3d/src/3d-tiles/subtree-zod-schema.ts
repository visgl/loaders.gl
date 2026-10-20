// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {z} from 'zod';
import type {Availability, GLTFStyleBuffer, GLTFStyleBufferView, Subtree} from './types';

/** Zod schema for a buffer declared by a 3D Tiles subtree. */
export const SubtreeBufferSchema = z
  .object({
    name: z.string().optional(),
    uri: z.string().optional(),
    byteLength: z.number().int().nonnegative()
  })
  .passthrough() satisfies z.ZodType<GLTFStyleBuffer>;

/** Zod schema for a buffer view declared by a 3D Tiles subtree. */
export const SubtreeBufferViewSchema = z
  .object({
    buffer: z.number().int().nonnegative(),
    byteOffset: z.number().int().nonnegative().default(0),
    byteLength: z.number().int().nonnegative()
  })
  .passthrough() satisfies z.ZodType<GLTFStyleBufferView>;

/** Zod schema for one tile, content, or child-subtree availability declaration. */
export const SubtreeAvailabilitySchema = z
  .object({
    constant: z.union([z.literal(0), z.literal(1)]).optional(),
    bitstream: z.number().int().nonnegative().optional(),
    bufferView: z.number().int().nonnegative().optional(),
    availableCount: z.number().int().nonnegative().optional()
  })
  .passthrough()
  .refine(
    availability =>
      availability.constant !== undefined ||
      availability.bitstream !== undefined ||
      availability.bufferView !== undefined,
    {message: 'Availability must define constant, bitstream, or bufferView'}
  ) satisfies z.ZodType<Availability>;

/** Zod schema for raw 3D Tiles implicit-tiling subtree metadata. */
export const SubtreeSchema = z
  .object({
    buffers: z.array(SubtreeBufferSchema).default([]),
    bufferViews: z.array(SubtreeBufferViewSchema).default([]),
    tileAvailability: SubtreeAvailabilitySchema,
    contentAvailability: z
      .union([SubtreeAvailabilitySchema, z.array(SubtreeAvailabilitySchema).min(1)])
      .optional(),
    childSubtreeAvailability: SubtreeAvailabilitySchema,
    propertyTables: z.array(z.unknown()).optional(),
    tileMetadata: z.number().int().nonnegative().optional(),
    contentMetadata: z.array(z.number().int().nonnegative()).optional(),
    subtreeMetadata: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough() satisfies z.ZodType<Subtree>;
