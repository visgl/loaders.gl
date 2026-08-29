// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import Pbf from 'pbf';
import type {FeatureCollection, Geometry} from '@loaders.gl/schema';
import {fromGeojson, normalizeGeojson} from '../src/lib/mapbox-vt-pbf/to-vector-tile';
import {VectorTile} from '../src/lib/vector-tile/vector-tile';

const GEOMETRIES: Geometry[] = [
  {type: 'Point', coordinates: [0.25, 0.5]},
  {
    type: 'MultiPoint',
    coordinates: [
      [0.1, 0.2],
      [0.3, 0.4]
    ]
  },
  {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [0.5, 0.5],
      [1, 1]
    ]
  },
  {
    type: 'MultiLineString',
    coordinates: [
      [
        [0, 0],
        [1, 1]
      ],
      [
        [0, 1],
        [1, 0]
      ]
    ]
  },
  {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0]
      ]
    ]
  },
  {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [0.4, 0],
          [0.4, 0.4],
          [0, 0]
        ]
      ],
      [
        [
          [0.6, 0.6],
          [1, 0.6],
          [1, 1],
          [0.6, 0.6]
        ]
      ]
    ]
  }
];

/** Creates a zeroed geometry counter accepted by binary vector tile features. */
function createGeometryInfo(): Record<string, number> {
  return {
    pointFeaturesCount: 0,
    pointPositionsCount: 0,
    lineFeaturesCount: 0,
    linePathsCount: 0,
    linePositionsCount: 0,
    polygonFeaturesCount: 0,
    polygonObjectsCount: 0,
    polygonRingsCount: 0,
    polygonPositionsCount: 0
  };
}

test('vector tile writer and reader cover every GeoJSON geometry family', () => {
  const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: GEOMETRIES.map((geometry, index) => ({
      type: 'Feature',
      id: index + 1,
      properties: {name: geometry.type, active: true, rank: index, empty: null},
      geometry
    }))
  };
  const buffer = fromGeojson(geojson, {layerName: 'coverage', extent: 256});
  const layer = new VectorTile(new Pbf(buffer)).layers.coverage;

  expect(layer.length).toBe(GEOMETRIES.length);
  expect(() => layer.getGeoJSONFeature(-1)).toThrow(/out of bounds/);
  expect(() => layer.getBinaryFeature(layer.length, createGeometryInfo() as any)).toThrow(
    /out of bounds/
  );

  for (let index = 0; index < layer.length; index++) {
    const feature = layer.getGeoJSONFeature(index);
    expect(feature.id).toBe(index + 1);
    expect(feature.properties.name).toBe(GEOMETRIES[index].type);
    expect(feature.bbox()).toHaveLength(4);
    expect(feature.toGeoJSONFeature('local').geometry.type).toMatch(/Point|LineString|Polygon/);
    expect(feature.toGeoJSONFeature('wgs84', {x: 0, y: 0, z: 0}).geometry).toBeTruthy();

    const geometryInfo = createGeometryInfo();
    const binaryFeature = layer
      .getBinaryFeature(index, geometryInfo as any)
      .toBinaryFeature(index % 2 ? 'wgs84' : 'local', {x: 0, y: 0, z: 0});
    expect(binaryFeature.id).toBe(index + 1);
    expect(binaryFeature.geometry.data.length).toBeGreaterThan(0);
  }
});

test('GeoJSON normalization accepts arrays and features and rejects other objects', () => {
  const feature = {
    type: 'Feature' as const,
    properties: {},
    geometry: {type: 'Point' as const, coordinates: [2, 3]}
  };
  expect(normalizeGeojson([feature])).toEqual({type: 'FeatureCollection', features: [feature]});
  expect(normalizeGeojson(feature)).toEqual({type: 'FeatureCollection', features: [feature]});
  expect(() => normalizeGeojson({type: 'Point', coordinates: [0, 0]})).toThrow(/Invalid GeoJSON/);
});

test('vector tile writer accepts preprojected features and longitude-latitude projection', () => {
  const preprojected = {
    type: 'FeatureCollection' as const,
    features: [{id: 7, type: 1, geometry: [[4, 8]], tags: {name: 'raw'}}]
  } as any;
  const rawLayer = new VectorTile(new Pbf(fromGeojson(preprojected, {extent: 16}))).layers
    .geojsonLayer;
  expect(rawLayer.getGeoJSONFeature(0).loadGeometry()).toEqual([[[4, 8]]]);

  const geographic: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: null,
        geometry: {type: 'Point', coordinates: [-122.4, 37.8]}
      }
    ]
  };
  const geographicLayer = new VectorTile(
    new Pbf(fromGeojson(geographic, {extent: 4096, tileIndex: {x: 0, y: 0, z: 0}}))
  ).layers.geojsonLayer;
  expect(geographicLayer.getGeoJSONFeature(0).properties).toEqual({});
});
