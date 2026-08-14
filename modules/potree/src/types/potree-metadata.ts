// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {z} from 'zod';

/** Potree axis-aligned bounding box metadata. */
export interface PotreeBoundingBox {
  /** Minimum X coordinate. */
  lx: number;
  /** Minimum Y coordinate. */
  ly: number;
  /** Minimum Z coordinate. */
  lz: number;
  /** Maximum X coordinate. */
  ux: number;
  /** Maximum Y coordinate. */
  uy: number;
  /** Maximum Z coordinate. */
  uz: number;
  /** Additional bounding-box properties are preserved verbatim. */
  [key: string]: unknown;
}

/** Attribute types for Potree `*.bin` content. */
export type PotreeAttribute =
  /** Three `uint32` position components: x, y, z. */
  | 'POSITION_CARTESIAN'
  /** Four `uint8` color components: r, g, b, a. */
  | 'RGBA_PACKED'
  /** Four `uint8` color components: r, g, b, a. */
  | 'COLOR_PACKED'
  /** Three `uint8` color components: r, g, b. */
  | 'RGB_PACKED'
  /** Three floating-point normal components: x, y, z. */
  | 'NORMAL_FLOATS'
  /** One byte of padding. */
  | 'FILLER_1B'
  /** One `uint16` point-intensity value. */
  | 'INTENSITY'
  /** One `uint8` classification identifier. */
  | 'CLASSIFICATION'
  /** A sphere-mapped normal representation; support may be incomplete. */
  | 'NORMAL_SPHEREMAPPED'
  /** An octahedral 16-bit normal representation; support may be incomplete. */
  | 'NORMAL_OCT16'
  /** Three floating-point normal components: x, y, z. */
  | 'NORMAL';

/** Legacy inline hierarchy entry containing a node name and point count.
 * @example ['r043', 145]
 */
export type HierarchyItem = [string, number];

/**
 * Potree data set format metadata from `cloud.js`.
 * @version 1.7
 * @see https://github.com/potree/potree/blob/1.7/docs/potree-file-format.md
 */
export interface PotreeMetadata {
  /** Potree format version in which this file was written. */
  version: string;
  /** Folder used to load additional octree data. */
  octreeDir: string;
  /** Number of points contained in the complete point cloud. */
  points?: number;
  /** Proj.4-compatible definition of the point cloud's projection. */
  projection?: string;
  /** World bounding box used to limit the initial point of view. */
  boundingBox: PotreeBoundingBox;
  /** Tight bounding box around the actual points. */
  tightBoundingBox: PotreeBoundingBox;
  /** Description of the attributes stored in point-data files. */
  pointAttributes: 'LAS' | 'LAZ' | PotreeAttribute[];
  /** Root-node point spacing, halved at each octree level. */
  spacing: number;
  /**
   * Scale applied to `POSITION_CARTESIAN` components before adding the bounding-box minimum.
   */
  scale: number;
  /** Number of octree levels before another hierarchy folder is expected. */
  hierarchyStepSize: number;
  /**
   * Legacy inline file hierarchy, superseded by hierarchy index files.
   * @deprecated
   */
  hierarchy?: HierarchyItem[];
  /** Additional metadata properties are preserved verbatim. */
  [key: string]: unknown;
}

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
  .passthrough() satisfies z.ZodType<PotreeBoundingBox>;

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
]) satisfies z.ZodType<PotreeAttribute>;

/** Zod schema for one legacy inline hierarchy entry. */
export const PotreeHierarchyItemSchema = z.tuple([
  z.string().regex(/^r[0-7]*$/),
  z.number().int().nonnegative()
]) satisfies z.ZodType<HierarchyItem>;

/** Zod schema for Potree 1.7 `cloud.js` metadata. */
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
  .passthrough() satisfies z.ZodType<PotreeMetadata>;
