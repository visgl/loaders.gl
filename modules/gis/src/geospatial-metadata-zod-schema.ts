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
  'GeometryCollection Z',
  'Point M',
  'LineString M',
  'Polygon M',
  'MultiPoint M',
  'MultiLineString M',
  'MultiPolygon M',
  'GeometryCollection M',
  'Point ZM',
  'LineString ZM',
  'Polygon ZM',
  'MultiPoint ZM',
  'MultiLineString ZM',
  'MultiPolygon ZM',
  'GeometryCollection ZM'
]) satisfies z.ZodType<GeoParquetGeometryType>;

const GeoParquetGeometryTypesSchema = z
  .array(GeoParquetGeometryTypeSchema)
  .refine(geometryTypes => new Set(geometryTypes).size === geometryTypes.length, {
    message: 'GeoParquet geometry_types entries must be unique'
  });

const PROJJSONCRSSchema = z.record(z.string(), z.unknown());

/** Zod schema for metadata attached to one GeoParquet geometry column. */
export const GeoParquetColumnMetadataSchema = z
  .object({
    encoding: z.enum([
      'WKB',
      'wkb',
      'GEOMETRY',
      'geometry',
      'GEOGRAPHY',
      'geography',
      'point',
      'linestring',
      'polygon',
      'multipoint',
      'multilinestring',
      'multipolygon'
    ]),
    geometry_types: GeoParquetGeometryTypesSchema,
    crs: z.union([PROJJSONCRSSchema, z.null()]).optional(),
    orientation: z.literal('counterclockwise').optional(),
    bbox: z
      .union([
        z.tuple([z.number(), z.number(), z.number(), z.number()]),
        z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()]),
        z.tuple([
          z.number(),
          z.number(),
          z.number(),
          z.number(),
          z.number(),
          z.number(),
          z.number(),
          z.number()
        ])
      ])
      .optional(),
    edges: z.enum(['planar', 'spherical', 'vincenty', 'thomas', 'andoyer', 'karney']).optional(),
    epoch: z.number().finite().optional()
  })
  .passthrough() as unknown as z.ZodType<GeoColumnMetadata>;

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
  })
  .superRefine((metadata, context) => {
    if (!metadata.version.startsWith('2.')) return;
    for (const [columnName, column] of Object.entries(metadata.columns)) {
      const encoding = column.encoding.toUpperCase();
      if (encoding !== 'WKB' && encoding !== 'GEOMETRY' && encoding !== 'GEOGRAPHY') {
        context.addIssue({
          code: 'custom',
          message: 'GeoParquet 2.x geometry columns must use WKB, GEOMETRY, or GEOGRAPHY encoding',
          path: ['columns', columnName, 'encoding']
        });
      }
    }
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
    crs: z.union([PROJJSONCRSSchema, z.string()]).optional(),
    crs_type: z.enum(['projjson', 'wkt2:2019', 'authority_code', 'srid']).optional(),
    edges: z.enum(['spherical', 'vincenty', 'thomas', 'andoyer', 'karney']).optional(),
    geometry_types: GeoParquetGeometryTypesSchema.optional()
  })
  .passthrough()
  .superRefine((metadata, context) => {
    const {crs, crs_type: crsType} = metadata;
    const valid =
      (crs === undefined && crsType === undefined) ||
      (typeof crs === 'object' &&
        crs !== null &&
        (crsType === undefined || crsType === 'projjson')) ||
      (typeof crs === 'string' &&
        (crsType === undefined ||
          crsType === 'wkt2:2019' ||
          crsType === 'authority_code' ||
          crsType === 'srid'));
    if (!valid) {
      context.addIssue({
        code: 'custom',
        message: 'GeoArrow crs and crs_type must describe the same CRS representation',
        path: ['crs_type']
      });
    }
  }) as z.ZodType<GeoArrowMetadata>;
