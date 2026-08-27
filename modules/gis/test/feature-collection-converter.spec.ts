// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import type {Feature} from '@loaders.gl/schema';
import {
  FeatureCollectionConverter,
  convertFeatureCollection
} from '../src/lib/feature-collection-converters/feature-collection-converter/feature-collection-converter';
import {
  isBinaryFeatureCollection,
  isFlatFeatureCollection,
  isGeojsonFeatureCollection
} from '../src/lib/feature-collection-converters/feature-collection-converter/convert-feature-collection';

const FEATURES: Feature[] = [
  {
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [1, 2]},
    properties: {name: 'point'}
  },
  {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 1]
      ]
    },
    properties: {name: 'line'}
  },
  {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 0]
        ]
      ]
    },
    properties: {name: 'polygon'}
  }
] as Feature[];

describe('FeatureCollectionConverter', () => {
  test('converts GeoJSON through flat and binary representations', () => {
    const flatFeatures = convertFeatureCollection(FEATURES, 'flat-geojson');
    expect(flatFeatures).toHaveLength(3);
    expect(isFlatFeatureCollection(flatFeatures)).toBe(true);

    const binaryFromFlat = convertFeatureCollection(flatFeatures, 'binary-feature-collection');
    const binaryFromGeojson = convertFeatureCollection(FEATURES, 'binary-feature-collection');
    expect(isBinaryFeatureCollection(binaryFromFlat)).toBe(true);
    expect(binaryFromFlat.points.positions.value).toEqual(binaryFromGeojson.points.positions.value);

    const roundTripped = convertFeatureCollection(binaryFromFlat, 'geojson');
    expect(roundTripped).toHaveLength(3);
    expect(roundTripped.map(feature => feature.geometry?.type)).toEqual([
      'Point',
      'LineString',
      'Polygon'
    ]);
  });

  test('detects supported input shapes and conversion routes', () => {
    const flatFeatures = FeatureCollectionConverter.convert(FEATURES, 'flat-geojson') as any[];
    const binaryFeatures = FeatureCollectionConverter.convert(
      flatFeatures,
      'binary-feature-collection'
    );

    expect(FeatureCollectionConverter.detectInputShape(FEATURES)).toBe('geojson');
    expect(FeatureCollectionConverter.detectInputShape(flatFeatures)).toBe('flat-geojson');
    expect(FeatureCollectionConverter.detectInputShape(binaryFeatures)).toBe(
      'binary-feature-collection'
    );
    expect(FeatureCollectionConverter.detectInputShape(null)).toBeNull();

    expect(FeatureCollectionConverter.canConvert('geojson', 'flat-geojson')).toBe(true);
    expect(FeatureCollectionConverter.canConvert('geojson', 'binary-feature-collection')).toBe(
      true
    );
    expect(FeatureCollectionConverter.canConvert('flat-geojson', 'binary-feature-collection')).toBe(
      true
    );
    expect(FeatureCollectionConverter.canConvert('binary-feature-collection', 'geojson')).toBe(
      true
    );
    expect(FeatureCollectionConverter.canConvert('geojson', 'geojson')).toBe(false);
    expect(FeatureCollectionConverter.canConvert('flat-geojson', 'geojson')).toBe(false);

    const selectedFeature = FeatureCollectionConverter.convert(binaryFeatures, 'geojson', {
      globalFeatureId: 1
    }) as Feature;
    expect(selectedFeature.geometry?.type).toBe('LineString');
  });

  test('rejects mismatched inputs and unsupported targets', () => {
    const flatFeatures = convertFeatureCollection(FEATURES, 'flat-geojson');
    const binaryFeatures = convertFeatureCollection(FEATURES, 'binary-feature-collection');

    expect(isGeojsonFeatureCollection([])).toBe(true);
    expect(isGeojsonFeatureCollection(flatFeatures)).toBe(false);
    expect(isBinaryFeatureCollection(FEATURES)).toBe(false);

    expect(() => convertFeatureCollection(binaryFeatures as any, 'flat-geojson')).toThrow(
      'expected GeoJSON features'
    );
    expect(() =>
      convertFeatureCollection(binaryFeatures as any, 'binary-feature-collection')
    ).toThrow('expected GeoJSON or Flat GeoJSON input');
    expect(() => convertFeatureCollection(FEATURES as any, 'geojson')).toThrow(
      'expected a binary feature collection'
    );
    expect(() => convertFeatureCollection(FEATURES as any, 'unsupported' as any)).toThrow(
      'Unsupported feature collection conversion target'
    );
    expect(() => FeatureCollectionConverter.convert(FEATURES, 'unsupported' as any)).toThrow(
      'Unsupported feature collection conversion target'
    );
  });
});
