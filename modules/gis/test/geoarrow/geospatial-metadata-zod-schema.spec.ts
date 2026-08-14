// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {
  GeoArrowMetadataSchema,
  GeoParquetMetadataSchema
} from '@loaders.gl/gis/geospatial-metadata-zod-schema';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

describe('geospatial metadata schemas', () => {
  it('validates GeoParquet metadata and preserves extension properties', () => {
    const metadata = GeoParquetMetadataSchema.parse({
      version: '1.1.0',
      primary_column: 'geometry',
      columns: {
        geometry: {
          encoding: 'wkb',
          geometry_types: ['Point', 'Point Z'],
          bbox: [-180, -90, 180, 90],
          covering: {bbox: {xmin: ['bbox', 0]}}
        }
      },
      vendor: {dataset: 'places'}
    });

    expect(metadata.columns.geometry.covering).toBeDefined();
    expect(metadata.vendor).toEqual({dataset: 'places'});

    expect(
      GeoParquetMetadataSchema.safeParse({
        version: '1.1.0',
        primary_column: 'geometry',
        columns: {
          geometry: {
            encoding: 'WKB',
            geometry_types: ['Point Z'],
            crs: null,
            crs_type: 'projjson',
            orientation: 'counterclockwise',
            bbox: [-180, -90, 0, 180, 90, 100],
            edges: 'planar',
            epoch: 2026.5
          }
        }
      }).success
    ).toBe(true);
  });

  it('rejects missing primary columns and malformed column metadata', () => {
    expect(
      GeoParquetMetadataSchema.safeParse({
        version: '1.1.0',
        primary_column: 'missing',
        columns: {
          geometry: {encoding: 'wkb', geometry_types: ['Point']}
        }
      }).success
    ).toBe(false);
    expect(
      GeoParquetMetadataSchema.safeParse({
        version: '1.1.0',
        primary_column: 'geometry',
        columns: {
          geometry: {encoding: 'wkt', geometry_types: ['Point']}
        }
      }).success
    ).toBe(false);
    expect(
      GeoParquetMetadataSchema.safeParse({
        version: '1.1.0',
        primary_column: 'geometry',
        columns: {
          geometry: {encoding: 'WKB', geometry_types: ['Point', 'Point']}
        }
      }).success
    ).toBe(false);
    expect(
      GeoParquetMetadataSchema.safeParse({
        version: '1.1.0',
        primary_column: 'geometry',
        columns: {
          geometry: {encoding: 'invalid', geometry_types: ['Point']}
        }
      }).success
    ).toBe(false);
  });

  it('validates GeoArrow field metadata', () => {
    expect(
      GeoArrowMetadataSchema.safeParse({
        encoding: 'geoarrow.box',
        crs: 'EPSG:4326',
        crs_type: 'authority_code',
        edges: 'karney'
      }).success
    ).toBe(true);
    expect(GeoArrowMetadataSchema.safeParse({edges: 'planar'}).success).toBe(false);
  });

  it('exports both schemas as JSON Schema', () => {
    const geoParquetJsonSchema = z.toJSONSchema(GeoParquetMetadataSchema, {target: 'draft-7'});
    const geoArrowJsonSchema = z.toJSONSchema(GeoArrowMetadataSchema, {target: 'draft-7'});

    expect(geoParquetJsonSchema.required).toEqual(
      expect.arrayContaining(['version', 'primary_column', 'columns'])
    );
    expect(JSON.stringify(geoArrowJsonSchema)).toContain('geoarrow.wkb');
  });
});
