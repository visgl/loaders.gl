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
    const result = parseMLT(new ArrayBuffer(0));

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
      mlt: {layers: ['roads', 'areas'], layerProperty: 'source'}
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

    const result = parseMLT(new Uint8Array([1]).buffer, {mlt: {coordinates: 'local'}}) as any;

    expect(result.features).toHaveLength(2);
    expect(result.features[0].geometry.coordinates).toEqual([1, 0.5]);
    expect(result.features[1].geometry.coordinates).toEqual([0.5, 1]);
  });

  test('projects WGS84 coordinates and supports binary and Arrow output shapes', () => {
    decodeTileMock.mockReturnValue([
      {name: 'points', features: [createFeature(0, [[{x: 0, y: 0}]])]}
    ] as any);

    const options = {mlt: {coordinates: 'wgs84', tileIndex: {x: 1, y: 1, z: 2}}} as any;
    const geojson = parseMLT(new Uint8Array([1]).buffer, options) as any;
    expect(geojson.features[0].geometry.coordinates[0]).toBe(-90);
    expect(geojson.features[0].geometry.coordinates[1]).toBeCloseTo(66.513);

    const binary = parseMLT(new Uint8Array([1]).buffer, {mlt: {shape: 'binary-geometry'}}) as any;
    expect(binary.byteLength).toBe(1);

    const arrow = parseMLT(new Uint8Array([1]).buffer, {mlt: {shape: 'arrow-table'}}) as any;
    expect(arrow.schema).toBeDefined();
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

    const result = parseMLT(new Uint8Array([1]).buffer) as any;

    expect(result.features).toEqual([]);
  });
});
