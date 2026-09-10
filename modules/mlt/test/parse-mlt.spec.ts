// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, describe, expect, test, vi} from 'vitest';

vi.mock('@maplibre/mlt', () => ({decodeTile: vi.fn()}));

import {decodeTile} from '@maplibre/mlt';
import {parseMLT} from '../src/lib/parse-mlt';

const decodeTileMock = vi.mocked(decodeTile);
const POINTS = [
  {x: 0, y: 0},
  {x: 2048, y: 4096}
];

function createFeature(type: number, coordinates: unknown, id = 1) {
  return {id, geometry: {type, coordinates}, properties: {kind: 'test'}} as any;
}

describe('parseMLT', () => {
  beforeEach(() => {
    decodeTileMock.mockReset();
  });

  test('returns an empty table without decoding an empty tile', () => {
    const result = parseMLT(new ArrayBuffer(0), {mlt: {shape: 'geojson-table'}});

    expect(result).toEqual({shape: 'geojson-table', type: 'FeatureCollection', features: []});
    expect(decodeTileMock).not.toHaveBeenCalled();
  });

  test('converts every supported geometry type and filters layers', () => {
    decodeTileMock.mockReturnValue([
      {
        name: 'roads',
        features: [
          createFeature(0, [[POINTS[0]]]),
          createFeature(1, [POINTS]),
          createFeature(4, [POINTS, [POINTS[1]]])
        ]
      },
      {
        name: 'areas',
        extent: 2048,
        features: [
          createFeature(2, [POINTS, [POINTS[1]]]),
          createFeature(3, [[POINTS[0]], [POINTS[1]]]),
          createFeature(5, [POINTS])
        ]
      },
      {name: 'ignored', features: [createFeature(0, [[POINTS[0]]])]}
    ] as any);

    const result = parseMLT(new Uint8Array([1]).buffer, {
      mlt: {shape: 'geojson-table', layers: ['roads', 'areas'], layerProperty: 'source'}
    }) as any;

    expect(result.features).toHaveLength(6);
    expect(result.features.map(feature => feature.geometry.type)).toEqual([
      'Point',
      'LineString',
      'MultiLineString',
      'Polygon',
      'MultiPoint',
      'MultiPolygon'
    ]);
    expect(result.features[0]).toEqual({
      type: 'Feature',
      id: 1,
      geometry: {type: 'Point', coordinates: [0, 0]},
      properties: {kind: 'test', source: 'roads'}
    });
    expect(result.features[3].geometry.coordinates[0][1]).toEqual([1, 2]);
  });

  test('supports table iterables, getFeatures, default extents, and null geometries', () => {
    decodeTileMock.mockReturnValue({
      first: {
        name: 'first',
        getFeatures: () => [createFeature(0, [[{x: 4096, y: 2048}]]), {geometry: null}]
      },
      second: {
        name: 'second',
        *[Symbol.iterator]() {
          yield createFeature(0, [[{x: 2048, y: 4096}]], 2);
        }
      },
      unnamed: {features: [createFeature(0, [[POINTS[0]]])]}
    } as any);

    const result = parseMLT(new Uint8Array([1]).buffer, {
      mlt: {shape: 'geojson-table', coordinates: 'local'}
    }) as any;

    expect(result.features).toHaveLength(2);
    expect(result.features[0].geometry.coordinates).toEqual([1, 0.5]);
    expect(result.features[1].geometry.coordinates).toEqual([0.5, 1]);
  });

  test('projects WGS84 coordinates and supports binary and Arrow output shapes', () => {
    decodeTileMock.mockReturnValue([
      {name: 'points', features: [createFeature(0, [[{x: 0, y: 0}]])]}
    ] as any);

    const options = {
      mlt: {shape: 'geojson-table', coordinates: 'wgs84', tileIndex: {x: 1, y: 1, z: 2}}
    } as any;
    const geojson = parseMLT(new Uint8Array([1]).buffer, options) as any;
    expect(geojson.features[0].geometry.coordinates[0]).toBe(-90);
    expect(geojson.features[0].geometry.coordinates[1]).toBeCloseTo(66.513);

    const binary = parseMLT(new Uint8Array([1]).buffer, {mlt: {shape: 'binary-geometry'}}) as any;
    expect(binary.byteLength).toBe(1);

    const arrow = parseMLT(new Uint8Array([1]).buffer, {mlt: {shape: 'arrow-table'}}) as any;
    expect(arrow.schema).toBeDefined();
  });

  test('builds Arrow directly from MLT column vectors without materializing GeoJSON features', () => {
    const geometries = [
      [[{x: 0, y: 0}]],
      [
        [
          {x: 0, y: 0},
          {x: 4, y: 4}
        ]
      ],
      [
        [
          {x: 0, y: 0},
          {x: 4, y: 0},
          {x: 4, y: 4},
          {x: 0, y: 0}
        ]
      ],
      [[{x: 0, y: 0}], [{x: 4, y: 4}]],
      [
        [
          {x: 0, y: 0},
          {x: 4, y: 4}
        ],
        [
          {x: 4, y: 0},
          {x: 0, y: 4}
        ]
      ],
      [
        [
          {x: 0, y: 0},
          {x: 4, y: 0},
          {x: 4, y: 4},
          {x: 0, y: 0}
        ],
        [
          {x: 1, y: 1},
          {x: 2, y: 1},
          {x: 1, y: 1}
        ]
      ]
    ];
    const getFeaturesMock = vi.fn();
    decodeTileMock.mockReturnValue([
      {
        name: 'all-geometries',
        extent: 4,
        geometryVector: {
          numGeometries: geometries.length,
          geometryType: (index: number) => index,
          getGeometries: () => geometries
        },
        propertyVectors: [{name: 'kind', getValue: (index: number) => `feature-${index}`}],
        getFeatures: getFeaturesMock
      }
    ] as any);

    const result = parseMLT(new Uint8Array([1]).buffer, {
      mlt: {shape: 'arrow-table', coordinates: 'local'}
    }) as any;

    expect(getFeaturesMock).not.toHaveBeenCalled();
    expect(result.data.numRows).toBe(6);
    expect(result.data.getChild('kind')?.get(0)).toBe('feature-0');
    expect(result.data.getChild('geometry')?.length).toBe(6);
    expect(result.schema.metadata?.geo).toContain('geometry');
  });

  test('honors native GeoArrow output preferences without GeoJSON conversion', () => {
    const getFeaturesMock = vi.fn();
    decodeTileMock.mockReturnValue([
      {
        name: 'points',
        extent: 4,
        geometryVector: {
          numGeometries: 2,
          geometryType: () => 0,
          getGeometries: () => [[[{x: 0, y: 0}]], [[{x: 4, y: 4}]]]
        },
        getFeatures: getFeaturesMock
      }
    ] as any);

    const result = parseMLT(new Uint8Array([1]).buffer, {
      geoarrow: {encodingPreference: 'optimized'},
      mlt: {shape: 'arrow-table', coordinates: 'local'}
    }) as any;

    expect(getFeaturesMock).not.toHaveBeenCalled();
    expect(result.data.schema.fields.at(-1).metadata.get('ARROW:extension:name')).toBe(
      'geoarrow.point'
    );
    expect(result.schema?.fields.at(-1)?.name).toBe('geometry');
    expect(result.data.numRows).toBe(2);
  });

  test('covers native GeoArrow geometry encodings and optimized selection', () => {
    const geometryCoordinates = [
      [[{x: 0, y: 0}]],
      [
        [
          {x: 0, y: 0},
          {x: 4, y: 4}
        ]
      ],
      [
        [
          {x: 0, y: 0},
          {x: 4, y: 4}
        ]
      ],
      [
        [
          {x: 0, y: 0},
          {x: 4, y: 4}
        ],
        [
          {x: 4, y: 0},
          {x: 0, y: 4}
        ]
      ],
      [
        [
          {x: 0, y: 0},
          {x: 4, y: 4},
          {x: 0, y: 0}
        ]
      ],
      [
        [
          {x: 0, y: 0},
          {x: 4, y: 4},
          {x: 0, y: 0}
        ]
      ]
    ];

    const parseNative = (geometryTypes: number[], encodingPreference = 'optimized') => {
      decodeTileMock.mockReturnValue([
        {
          name: 'native',
          extent: 4,
          geometryVector: {
            numGeometries: geometryTypes.length,
            geometryType: (index: number) => geometryTypes[index],
            getGeometries: () =>
              geometryTypes.map(geometryType => geometryCoordinates[geometryType])
          },
          propertyVectors: [
            {name: 'missing', getValue: () => null},
            {name: 'object', getValue: () => ({nested: true})}
          ],
          getFeatures: () => []
        }
      ] as any);

      return parseMLT(new Uint8Array([1]).buffer, {
        geoarrow: {encodingPreference: encodingPreference as any},
        mlt: {shape: 'arrow-table', coordinates: 'local'}
      }) as any;
    };

    for (const geometryType of [0, 1, 2, 3, 4, 5]) {
      const result = parseNative([geometryType]);
      expect(result.data.numRows).toBe(1);
      expect(result.data.getChild('missing')?.get(0)).toBeNull();
      expect(result.data.getChild('object')?.get(0)).toBe('{"nested":true}');
    }

    expect(parseNative([0, 3]).data.schema.fields.at(-1).metadata.get('ARROW:extension:name')).toBe(
      'geoarrow.multipoint'
    );
    expect(parseNative([1, 4]).data.schema.fields.at(-1).metadata.get('ARROW:extension:name')).toBe(
      'geoarrow.multilinestring'
    );
    expect(parseNative([2, 5]).data.schema.fields.at(-1).metadata.get('ARROW:extension:name')).toBe(
      'geoarrow.multipolygon'
    );
    expect(parseNative([0, 1]).data.schema.fields.at(-1).metadata.get('ARROW:extension:name')).toBe(
      'geoarrow.geometry'
    );
  });

  test('keeps dense GeoArrow union children stable across geometry-only tiles', () => {
    const parseGeometryTile = (geometryType: number) => {
      decodeTileMock.mockReturnValue([
        {
          name: 'layer',
          extent: 4,
          geometryVector: {
            numGeometries: 1,
            geometryType: () => geometryType,
            getGeometries: () => [[[{x: 0, y: 0}]]]
          }
        }
      ] as any);

      return parseMLT(new Uint8Array([1]).buffer, {
        geoarrow: {encodingPreference: 'geoarrow.geometry'},
        mlt: {shape: 'arrow-table', coordinates: 'local'}
      }) as any;
    };

    const pointTable = parseGeometryTile(0);
    const polygonTable = parseGeometryTile(2);
    const getUnionChildren = (table: any) =>
      table.data.getChild('geometry').type.children.map((field: any) => field.name);

    expect(getUnionChildren(pointTable)).toEqual(getUnionChildren(polygonTable));
    expect(getUnionChildren(pointTable)).toEqual([
      'Point',
      'LineString',
      'Polygon',
      'MultiPoint',
      'MultiLineString',
      'MultiPolygon'
    ]);
  });

  test('rejects unsupported output shapes and WGS84 options without a tile index', () => {
    expect(() => parseMLT(new ArrayBuffer(0), {mlt: {shape: 'unsupported'}} as any)).toThrow(
      'unsupported'
    );
    expect(() => parseMLT(new ArrayBuffer(0), {mlt: {coordinates: 'wgs84'}})).toThrow(
      'require a tileIndex'
    );
  });

  test('ignores malformed tables, features, points, and geometry types', () => {
    decodeTileMock.mockReturnValue({
      malformed: null,
      invalid: {
        name: 'invalid',
        features: [
          {geometry: {type: 0, coordinates: [[]]}},
          {geometry: {type: 99, coordinates: []}}
        ]
      },
      empty: {name: 'empty', features: []},
      notAFeatureTable: {name: 'not-a-table'}
    } as any);

    const result = parseMLT(new Uint8Array([1]).buffer, {
      mlt: {shape: 'geojson-table'}
    }) as any;

    expect(result.features).toEqual([]);
  });
});
