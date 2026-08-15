// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {z} from 'zod';
import type {
  GeoArrowMetadata,
  GeoColumnMetadata,
  GeoMetadata,
  GeoParquetGeometryType
} from './lib/geoarrow/geoparquet-metadata';

/** GeoParquet geometry type names, including optional Z dimensions. */
export const GeoParquetGeometryTypeSchema = z.enum([
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection',
  'Point Z',
  'LineString Z',
  'Polygon Z',
  'MultiPoint Z',
  'MultiLineString Z',
  'MultiPolygon Z',
  'GeometryCollection Z'
]) satisfies z.ZodType<GeoParquetGeometryType>;

const GeoParquetGeometryTypesSchema = z
  .array(GeoParquetGeometryTypeSchema)
  .refine(geometryTypes => new Set(geometryTypes).size === geometryTypes.length, {
    message: 'GeoParquet geometry_types entries must be unique'
  });

/** Zod schema for metadata attached to one GeoParquet geometry column. */
export const GeoParquetColumnMetadataSchema = z
  .object({
    encoding: z.enum([
      'WKB',
      'wkb',
      'point',
      'linestring',
      'polygon',
      'multipoint',
      'multilinestring',
      'multipolygon'
    ]),
    geometry_types: GeoParquetGeometryTypesSchema,
    crs: z.union([z.record(z.string(), z.unknown()), z.null()]).optional(),
    crs_type: z.enum(['projjson', 'wkt2:2019']).optional(),
    orientation: z.literal('counterclockwise').optional(),
    bbox: z
      .union([
        z.tuple([z.number(), z.number(), z.number(), z.number()]),
        z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()])
      ])
      .optional(),
    edges: z.enum(['planar', 'spherical']).optional(),
    epoch: z.number().finite().optional()
  })
  .passthrough() satisfies z.ZodType<GeoColumnMetadata>;

/** Zod schema for the GeoParquet metadata stored in a Parquet file's `geo` key. */
export const GeoParquetMetadataSchema = z
  .object({
    version: z.string().min(1),
    primary_column: z.string().min(1),
    columns: z.record(z.string(), GeoParquetColumnMetadataSchema)
  })
  .passthrough()
  .refine(metadata => Boolean(metadata.columns[metadata.primary_column]), {
    message: 'GeoParquet primary_column must name an entry in columns',
    path: ['primary_column']
  }) satisfies z.ZodType<GeoMetadata>;

/** Zod schema for metadata stored on one GeoArrow extension field. */
export const GeoArrowMetadataSchema = z
  .object({
    encoding: z
      .enum([
        'geoarrow.geometry',
        'geoarrow.geometrycollection',
        'geoarrow.multipolygon',
        'geoarrow.polygon',
        'geoarrow.multilinestring',
        'geoarrow.linestring',
        'geoarrow.multipoint',
        'geoarrow.point',
        'geoarrow.box',
        'geoarrow.wkb',
        'geoarrow.wkt'
      ])
      .optional(),
    crs: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(),
    crs_type: z.enum(['projjson', 'wkt2:2019', 'authority_code', 'srid']).optional(),
    edges: z.enum(['spherical', 'vincenty', 'thomas', 'andoyer', 'karney']).optional(),
    geometry_types: GeoParquetGeometryTypesSchema.optional()
  })
  .passthrough() satisfies z.ZodType<GeoArrowMetadata>;
