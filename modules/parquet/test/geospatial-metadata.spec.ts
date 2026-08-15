// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Schema} from '@loaders.gl/schema';
import {describe, expect, it} from 'vitest';
import {ensureGeoParquetMetadata} from '../src/lib/geo/geospatial-metadata';

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
      crs_type: 'projjson',
      edges: 'spherical'
    });
  });
});
