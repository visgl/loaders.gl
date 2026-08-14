// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {z} from 'zod';
import type {
  RADChunkMetadataJSON,
  RADChunkProperty,
  RADChunkRange,
  RADMetadataJSON,
  RADSplatEncoding
} from './lib/parse-rad';

const nonNegativeSafeIntegerSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

/** Zod schema for Spark RAD splat quantization and shader decode ranges. */
export const RADSplatEncodingSchema = z
  .object({
    rgbMin: z.number().finite().optional(),
    rgbMax: z.number().finite().optional(),
    lnScaleMin: z.number().finite().optional(),
    lnScaleMax: z.number().finite().optional(),
    sh1Max: z.number().finite().optional(),
    sh2Max: z.number().finite().optional(),
    sh3Max: z.number().finite().optional(),
    lodOpacity: z.boolean().optional()
  })
  .passthrough() satisfies z.ZodType<RADSplatEncoding>;

/** Zod schema for one chunk-table entry in top-level RAD metadata. */
export const RADChunkRangeSchema = z
  .object({
    offset: nonNegativeSafeIntegerSchema,
    bytes: nonNegativeSafeIntegerSchema,
    base: nonNegativeSafeIntegerSchema.optional(),
    count: nonNegativeSafeIntegerSchema.optional(),
    filename: z.string().optional()
  })
  .passthrough() satisfies z.ZodType<RADChunkRange>;

/** Zod schema for raw JSON metadata stored in a Spark RAD header. */
export const RADMetadataJSONSchema = z
  .object({
    version: z.literal(1),
    type: z.literal('gsplat'),
    count: nonNegativeSafeIntegerSchema,
    maxSh: nonNegativeSafeIntegerSchema.optional(),
    lodTree: z.boolean().optional(),
    chunkSize: nonNegativeSafeIntegerSchema.optional(),
    allChunkBytes: nonNegativeSafeIntegerSchema.optional(),
    chunks: z.array(RADChunkRangeSchema),
    splatEncoding: RADSplatEncodingSchema.optional(),
    shCodeCount: nonNegativeSafeIntegerSchema.optional(),
    comment: z.string().optional()
  })
  .passthrough() satisfies z.ZodType<RADMetadataJSON>;

/** Zod schema for one property-table entry in RADC metadata. */
export const RADChunkPropertySchema = z
  .object({
    offset: nonNegativeSafeIntegerSchema,
    bytes: nonNegativeSafeIntegerSchema,
    property: z.string(),
    encoding: z.string(),
    compression: z.string().optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional()
  })
  .passthrough() satisfies z.ZodType<RADChunkProperty>;

/** Zod schema for raw JSON metadata stored in a Spark RADC chunk header. */
export const RADChunkMetadataJSONSchema = z
  .object({
    version: z.literal(1),
    base: nonNegativeSafeIntegerSchema,
    count: nonNegativeSafeIntegerSchema,
    payloadBytes: nonNegativeSafeIntegerSchema,
    maxSh: nonNegativeSafeIntegerSchema.optional(),
    lodTree: z.boolean().optional(),
    splatEncoding: RADSplatEncodingSchema.optional(),
    properties: z.array(RADChunkPropertySchema)
  })
  .passthrough() satisfies z.ZodType<RADChunkMetadataJSON>;
