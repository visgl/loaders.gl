// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {z} from 'zod';
import type {MapStyle, MapStyleLayer, MapStyleSource, ResolvedMapStyle} from './map-style';

const MapStyleSourceSchemaInternal = z
  .object({
    type: z.string().optional(),
    url: z.string().optional(),
    tiles: z.array(z.string()).optional(),
    minzoom: z.number().optional(),
    maxzoom: z.number().optional(),
    tileSize: z.number().optional()
  })
  .catchall(z.unknown()) satisfies z.ZodType<MapStyleSource>;

const MapStyleLayerSchemaInternal = z
  .object({
    id: z.string(),
    type: z.string(),
    source: z.string().optional(),
    'source-layer': z.string().optional(),
    minzoom: z.number().optional(),
    maxzoom: z.number().optional(),
    filter: z.array(z.unknown()).optional(),
    paint: z.record(z.string(), z.unknown()).optional(),
    layout: z.record(z.string(), z.unknown()).optional()
  })
  .catchall(z.unknown()) satisfies z.ZodType<MapStyleLayer>;

/** Zod schema for a MapLibre / Mapbox style document. */
export const MapStyleSchema = z
  .object({
    version: z.number().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    sources: z.record(z.string(), MapStyleSourceSchemaInternal).optional(),
    layers: z.array(MapStyleLayerSchemaInternal).optional()
  })
  .catchall(z.unknown()) satisfies z.ZodType<MapStyle>;

/** Zod schema for a fully resolved style document. */
export const ResolvedMapStyleSchema = z
  .object({
    version: z.number().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    sources: z.record(z.string(), MapStyleSourceSchemaInternal),
    layers: z.array(MapStyleLayerSchemaInternal)
  })
  .catchall(z.unknown()) satisfies z.ZodType<ResolvedMapStyle>;

export const MapStyleSourceSchema = MapStyleSourceSchemaInternal;
