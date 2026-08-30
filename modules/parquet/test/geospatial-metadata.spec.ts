// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Schema} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';
import {describe, expect, it} from 'vitest';
import {
  applyGeoParquetToFieldMetadata,
  applyLoadersSchemaToArrowTable,
  ensureGeoParquetMetadata,
  ensureGeoParquetMetadataOnArrowTable,
  getParquetFileMetadataMap,
  normalizeArrowTableGeoMetadata
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

  it('preserves unknown column metadata while synthesizing GeoParquet metadata', () => {
    const schema: Schema = {
      fields: [
        {
          name: 'geometry',
          type: 'binary',
          metadata: {
            'ARROW:extension:name': 'geoarrow.wkb',
            'ARROW:extension:metadata': JSON.stringify({
              crs: 'OGC:CRS84',
              source: {driver: 'custom'},
              future_flag: true
            })
          }
        }
      ],
      metadata: {}
    };

    ensureGeoParquetMetadata(schema);

    expect(JSON.parse(schema.metadata.geo).columns.geometry).toMatchObject({
      source: {driver: 'custom'},
      future_flag: true
    });
  });

  it('accepts binary view GeoParquet fields when applying metadata', () => {
    const schema: Schema = {
      fields: [{name: 'geometry', type: 'binary-view'}],
      metadata: {
        geo: JSON.stringify({
          version: '1.1.0',
          primary_column: 'geometry',
          columns: {geometry: {encoding: 'WKB', geometry_types: ['Point']}}
        })
      }
    };

    applyGeoParquetToFieldMetadata(schema);

    expect(schema.fields[0].metadata?.['ARROW:extension:name']).toBe('geoarrow.wkb');
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

  it('maps GeoParquet 2.0 GEOGRAPHY logical types to WKB with explicit edge semantics', () => {
    const schema: Schema = {
      fields: [{name: 'geometry', type: 'binary'}],
      metadata: {
        geo: JSON.stringify({
          version: '2.0.0',
          primary_column: 'geometry',
          columns: {
            geometry: {
              encoding: 'GEOGRAPHY',
              geometry_types: ['Point'],
              crs: null,
              epoch: 2024.25,
              vendor_metadata: {source: 'sensor'}
            }
          }
        })
      }
    };

    applyGeoParquetToFieldMetadata(schema);

    expect(schema.fields[0].metadata).toEqual({
      'ARROW:extension:name': 'geoarrow.wkb',
      'ARROW:extension:metadata': JSON.stringify({
        edges: 'spherical',
        epoch: 2024.25,
        vendor_metadata: {source: 'sensor'}
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
    expect(schema.fields[0].metadata).toEqual({
      'ARROW:extension:name': 'geoarrow.wkb',
      'ARROW:extension:metadata': JSON.stringify({
        epoch: 2022.5,
        vendor: 'preserved'
      })
    });
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

  it('synthesizes every supported GeoArrow encoding and preserves valid optional metadata', () => {
    const encodings = [
      'geoarrow.point',
      'geoarrow.linestring',
      'geoarrow.polygon',
      'geoarrow.multipoint',
      'geoarrow.multilinestring',
      'geoarrow.multipolygon'
    ];
    const fields = encodings.map((encoding, index) => ({
      name: `geometry${index}`,
      type: 'binary' as const,
      metadata: {
        'ARROW:extension:name': encoding,
        ...(index === 0
          ? {
              'ARROW:extension:metadata': JSON.stringify({
                crs: 'EPSG:4326',
                edges: 'spherical'
              })
            }
          : index === 1
            ? {
                'ARROW:extension:metadata': JSON.stringify({
                  crs: {type: 'GeographicCRS'},
                  geometry_types: ['LineString Z']
                })
              }
            : {
                'ARROW:extension:metadata': JSON.stringify({
                  crs: 'EPSG:4326',
                  crs_type: 'authority_code'
                })
              })
      }
    }));
    const schema: Schema = {
      fields,
      metadata: {
        geo: JSON.stringify({
          version: 'broken',
          primary_column: 3,
          columns: {
            geometry0: {
              encoding: 'point',
              geometry_types: [],
              orientation: 'counterclockwise',
              bbox: [0, 1, 2, 3],
              epoch: 2025.5,
              covering: {bbox: {xmin: ['xmin']}}
            }
          }
        })
      }
    };

    ensureGeoParquetMetadata(schema);

    const metadata = JSON.parse(schema.metadata.geo);
    expect(metadata.primary_column).toBe('geometry0');
    expect(Object.keys(metadata.columns)).toHaveLength(6);
    expect(metadata.columns.geometry0).toMatchObject({
      encoding: 'point',
      geometry_types: ['Point'],
      edges: 'spherical',
      orientation: 'counterclockwise',
      bbox: [0, 1, 2, 3],
      epoch: 2025.5
    });
    expect(metadata.columns.geometry1).toMatchObject({
      encoding: 'linestring',
      geometry_types: ['LineString Z'],
      crs: {type: 'GeographicCRS'}
    });
    expect(metadata.columns.geometry5.geometry_types).toEqual(['MultiPolygon']);
  });

  it('handles extension aliases, malformed metadata, incompatible fields, and empty schemas', () => {
    const schema: Schema = {
      fields: [
        {name: 'wkb', type: 'binary', metadata: {'ARROW:extension:name': 'WKB'}},
        {name: 'wkt', type: 'utf8', metadata: {'ARROW:extension:name': 'WKT'}},
        {
          name: 'malformed',
          type: 'binary',
          metadata: {
            'ARROW:extension:name': 'geoarrow.wkb',
            'ARROW:extension:metadata': '{'
          }
        },
        {name: 'unsupported', type: 'binary', metadata: {'ARROW:extension:name': 'vendor.geo'}},
        {name: 'plain', type: 'binary'}
      ],
      metadata: {}
    };
    ensureGeoParquetMetadata(schema);
    const metadata = JSON.parse(schema.metadata.geo);
    expect(Object.keys(metadata.columns)).toEqual(['wkb', 'malformed']);

    const noGeometry: Schema = {fields: [{name: 'value', type: 'int32'}], metadata: {}};
    expect(ensureGeoParquetMetadata(noGeometry)).toBe(noGeometry);
    expect(noGeometry.metadata.geo).toBeUndefined();

    const valid: Schema = {
      fields: [],
      metadata: {
        geo: JSON.stringify({version: '1.1.0', primary_column: 'geometry', columns: {geometry: {encoding: 'wkb', geometry_types: []}}})
      }
    };
    expect(ensureGeoParquetMetadata(valid)).toBe(valid);
  });

  it('applies only type-compatible GeoParquet columns and synchronizes Arrow metadata', () => {
    const geo = JSON.stringify({
      version: '1.1.0',
      primary_column: 'wkb',
      columns: {
        wkb: {encoding: 'wkb', geometry_types: ['Point'], crs: {type: 'GeographicCRS'}},
        native: {encoding: 'point', geometry_types: ['Point']},
        wrongWkb: {encoding: 'wkb', geometry_types: []},
        wrongNative: {encoding: 'point', geometry_types: []},
        unsupported: {encoding: 'vendor', geometry_types: []}
      }
    });
    const schema: Schema = {
      fields: [
        {name: 'wkb', type: 'binary'},
        {name: 'native', type: {type: 'fixed-size-list', listSize: 2, children: [{name: 'xy', type: 'float64'}]} as any},
        {name: 'wrongWkb', type: 'utf8'},
        {name: 'wrongNative', type: 'binary'},
        {name: 'unsupported', type: 'binary'},
        {name: 'absent', type: 'binary'}
      ],
      metadata: {geo}
    };
    applyGeoParquetToFieldMetadata(schema);
    expect(schema.fields[0].metadata?.['ARROW:extension:name']).toBe('geoarrow.wkb');
    expect(schema.fields[1].metadata?.['ARROW:extension:name']).toBe('geoarrow.point');
    expect(schema.fields.slice(2).every(field => !field.metadata)).toBe(true);

    const table = arrow.tableFromArrays({
      wkb: arrow.vectorFromArray([new Uint8Array([1])], new arrow.Binary()),
      untouched: [1]
    });
    const applied = applyLoadersSchemaToArrowTable(table, {
      fields: [
        {name: 'wkb', type: 'binary', metadata: {'ARROW:extension:name': 'geoarrow.wkb'}},
        {name: 'untouched', type: 'int32'}
      ],
      metadata: {geo}
    });
    expect(applied.schema.metadata.get('geo')).toBe(geo);
    expect(applied.schema.fields[0].metadata.get('ARROW:extension:name')).toBe('geoarrow.wkb');

    const normalized = normalizeArrowTableGeoMetadata(
      {shape: 'arrow-table', data: table},
      new Map([['geo', geo]])
    );
    expect(normalized.schema.metadata.geo).toBe(geo);
    expect(normalized.data.schema.fields[0].metadata.get('ARROW:extension:name')).toBe(
      'geoarrow.wkb'
    );
    expect(ensureGeoParquetMetadataOnArrowTable(normalized).schema).toBe(normalized.schema);
  });

  it('returns the parquet-wasm key/value metadata map unchanged', () => {
    const metadata = new Map([['creator', 'coverage-suite']]);
    expect(
      getParquetFileMetadataMap({fileMetadata: () => ({keyValueMetadata: () => metadata})})
    ).toBe(metadata);
  });
});
