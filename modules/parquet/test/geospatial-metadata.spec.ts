// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Schema} from '@loaders.gl/schema';
import {describe, expect, it} from 'vitest';
import {
  applyGeoParquetToFieldMetadata,
  ensureGeoParquetMetadata
} from '../src/lib/geo/geospatial-metadata';

describe('geospatial metadata', () => {
  it('validates GeoArrow extension metadata before synthesizing GeoParquet metadata', () => {
    const schema: Schema = {
      fields: [
        {
          name: 'geometry',
          type: 'binary',
          metadata: {
            'ARROW:extension:name': 'geoarrow.wkb',
            'ARROW:extension:metadata': JSON.stringify({
              crs: {type: 'GeographicCRS'},
              crs_type: 'projjson',
              edges: 'spherical'
            })
          }
        }
      ],
      metadata: {}
    };

    ensureGeoParquetMetadata(schema);

    const metadata = JSON.parse(schema.metadata.geo);
    expect(metadata.columns.geometry).toMatchObject({
      encoding: 'wkb',
      geometry_types: [],
      crs: {type: 'GeographicCRS'},
      edges: 'spherical'
    });
  });

  it('maps GeoParquet CRS defaults and all non-planar edge algorithms to GeoArrow', () => {
    const schema: Schema = {
      fields: [{name: 'geometry', type: 'binary'}],
      metadata: {
        geo: JSON.stringify({
          version: '2.0.0',
          primary_column: 'geometry',
          columns: {
            geometry: {encoding: 'WKB', geometry_types: ['Point M'], edges: 'karney'}
          }
        })
      }
    };

    applyGeoParquetToFieldMetadata(schema);

    expect(schema.fields[0].metadata).toEqual({
      'ARROW:extension:name': 'geoarrow.wkb',
      'ARROW:extension:metadata': JSON.stringify({
        crs: 'OGC:CRS84',
        crs_type: 'authority_code',
        edges: 'karney'
      })
    });
  });

  it('preserves explicit unknown CRS and coordinate epochs without inventing field CRS', () => {
    const schema: Schema = {
      fields: [{name: 'geometry', type: 'binary'}],
      metadata: {
        geo: JSON.stringify({
          version: '1.1.0',
          primary_column: 'geometry',
          columns: {
            geometry: {
              encoding: 'WKB',
              geometry_types: ['Point'],
              crs: null,
              epoch: 2022.5,
              vendor: 'preserved'
            }
          }
        })
      }
    };

    applyGeoParquetToFieldMetadata(schema);

    expect(JSON.parse(schema.metadata.geo).columns.geometry).toMatchObject({
      crs: null,
      epoch: 2022.5,
      vendor: 'preserved'
    });
    expect(schema.fields[0].metadata).toEqual({'ARROW:extension:name': 'geoarrow.wkb'});
  });

  it('does not misrepresent an unresolved GeoArrow authority CRS as GeoParquet CRS84', () => {
    const schema: Schema = {
      fields: [
        {
          name: 'geometry',
          type: 'binary',
          metadata: {
            'ARROW:extension:name': 'geoarrow.wkb',
            'ARROW:extension:metadata': JSON.stringify({
              crs: 'EPSG:3857',
              crs_type: 'authority_code'
            })
          }
        }
      ],
      metadata: {}
    };

    ensureGeoParquetMetadata(schema);

    expect(schema.metadata.geo).toBeUndefined();
  });
});
