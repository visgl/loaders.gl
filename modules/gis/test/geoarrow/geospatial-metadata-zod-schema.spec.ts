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
            vendor_crs_type: 'projjson',
            orientation: 'counterclockwise',
            bbox: [-180, -90, 0, 180, 90, 100],
            edges: 'planar',
            epoch: 2026.5
          }
        }
      }).success
    ).toBe(true);

    expect(
      GeoParquetMetadataSchema.safeParse({
        version: '2.0.0',
        primary_column: 'geometry',
        columns: {
          geometry: {
            encoding: 'WKB',
            geometry_types: ['Point M', 'LineString ZM'],
            bbox: [-180, -90, -10, 0, 180, 90, 10, 100],
            edges: 'karney'
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
        version: '2.0.0',
        primary_column: 'geometry',
        columns: {
          geometry: {encoding: 'point', geometry_types: ['Point']}
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
    const representations = [
      {crs: {type: 'GeographicCRS'}, crs_type: 'projjson'},
      {crs: 'GEOGCRS["WGS 84"]', crs_type: 'wkt2:2019'},
      {crs: 'EPSG:4326', crs_type: 'authority_code'},
      {crs: 'database:4326', crs_type: 'srid'},
      {crs: 'vendor-defined-crs'}
    ];
    for (const representation of representations) {
      expect(
        GeoArrowMetadataSchema.safeParse({
          encoding: 'geoarrow.box',
          edges: 'karney',
          ...representation
        }).success
      ).toBe(true);
    }
    expect(
      GeoArrowMetadataSchema.safeParse({crs: {type: 'GeographicCRS'}, crs_type: 'wkt2:2019'})
        .success
    ).toBe(false);
    expect(GeoArrowMetadataSchema.safeParse({crs: 4326, crs_type: 'srid'}).success).toBe(false);
    expect(GeoArrowMetadataSchema.safeParse({edges: 'planar'}).success).toBe(false);
  });

  it('distinguishes omitted, null, and explicit GeoParquet CRS metadata', () => {
    const makeMetadata = (column: Record<string, unknown>) => ({
      version: '1.1.0',
      primary_column: 'geometry',
      columns: {geometry: {encoding: 'WKB', geometry_types: ['Point'], ...column}}
    });

    const omitted = GeoParquetMetadataSchema.parse(makeMetadata({}));
    const unknown = GeoParquetMetadataSchema.parse(makeMetadata({crs: null, epoch: 2024.25}));
    const explicit = GeoParquetMetadataSchema.parse(
      makeMetadata({crs: {type: 'GeographicCRS', name: 'WGS 84'}})
    );

    expect('crs' in omitted.columns.geometry).toBe(false);
    expect(unknown.columns.geometry.crs).toBeNull();
    expect(unknown.columns.geometry.epoch).toBe(2024.25);
    expect(explicit.columns.geometry.crs).toMatchObject({type: 'GeographicCRS'});
    expect(GeoParquetMetadataSchema.safeParse(makeMetadata({crs: 'EPSG:4326'})).success).toBe(
      false
    );
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
