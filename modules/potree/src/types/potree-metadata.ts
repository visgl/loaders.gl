// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {z} from 'zod';

/** Zod schema for a Potree axis-aligned bounding box. */
export const PotreeBoundingBoxSchema = z
  .object({
    lx: z.number(),
    ly: z.number(),
    lz: z.number(),
    ux: z.number(),
    uy: z.number(),
    uz: z.number()
  })
  .passthrough();

/** Zod schema for the point attributes supported by the Potree binary loader. */
export const PotreeAttributeSchema = z.enum([
  'POSITION_CARTESIAN',
  'RGBA_PACKED',
  'COLOR_PACKED',
  'RGB_PACKED',
  'NORMAL_FLOATS',
  'FILLER_1B',
  'INTENSITY',
  'CLASSIFICATION',
  'NORMAL_SPHEREMAPPED',
  'NORMAL_OCT16',
  'NORMAL'
]);

/** Attribute types for Potree `*.bin` content. */
export type PotreeAttribute = z.infer<typeof PotreeAttributeSchema>;

/** Zod schema for one legacy inline hierarchy entry. */
export const PotreeHierarchyItemSchema = z.tuple([
  z.string().regex(/^r[0-7]*$/),
  z.number().int().nonnegative()
]);

/** Hierarchy item containing a node name and point count.
 * @example ['r043', 145]
 */
export type HierarchyItem = z.infer<typeof PotreeHierarchyItemSchema>;

/**
 * Potree data set format metadata (cloud.js)
 * @version 1.7
 * @link https://github.com/potree/potree/blob/1.7/docs/potree-file-format.md
 * */
export const PotreeMetadataSchema = z
  .object({
    version: z.string().min(1),
    octreeDir: z.string().min(1),
    points: z.number().int().nonnegative().optional(),
    projection: z.string().optional(),
    boundingBox: PotreeBoundingBoxSchema,
    tightBoundingBox: PotreeBoundingBoxSchema,
    pointAttributes: z.union([
      z.literal('LAS'),
      z.literal('LAZ'),
      z.array(PotreeAttributeSchema).min(1)
    ]),
    spacing: z.number().positive(),
    scale: z.number().positive(),
    hierarchyStepSize: z.number().int().positive(),
    hierarchy: z.array(PotreeHierarchyItemSchema).optional()
  })
  .passthrough();

/** Potree axis-aligned bounding box metadata. */
export type PotreeBoundingBox = z.infer<typeof PotreeBoundingBoxSchema>;

/** Potree data set format metadata from `cloud.js`. */
export type PotreeMetadata = z.infer<typeof PotreeMetadataSchema>;
