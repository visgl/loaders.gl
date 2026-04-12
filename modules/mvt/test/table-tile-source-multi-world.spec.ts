// loaders.gl
// SPDX-License-Identifier: MIT AND ISC
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import {expect, test} from 'vitest';
import {TableTileSource} from '@loaders.gl/mvt';
import type {GeoJSONTable, Feature} from '@loaders.gl/schema';

const leftPoint = {
  type: 'Feature',
  properties: {},
  geometry: {
    coordinates: [-540, 0],
    type: 'Point'
  }
} as const satisfies Feature;

const rightPoint = {
  type: 'Feature',
  properties: {},
  geometry: {
    coordinates: [540, 0],
    type: 'Point'
  }
} as const satisfies Feature;

function makeGeoJSONTable(feature: Feature): GeoJSONTable {
  return {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features: [feature]
  };
}

test('GeoJSONVT#handle point only in the rightside world', async () => {
  try {
    const source = new TableTileSource(makeGeoJSONTable(rightPoint));
    await source.ready;

    expect(source.tiles[0].features[0].geometry[0]).toBe(1);
    expect(source.tiles[0].features[0].geometry[1]).toBe(0.5);
  } catch (err) {
    t.ifError(err);
  }
  
});

test('GeoJSONVT#handle point only in the leftside world', async () => {
  try {
    const source = new TableTileSource(makeGeoJSONTable(leftPoint));
    expect(source.tiles[0].features[0].geometry[0]).toBe(0);
    expect(source.tiles[0].features[0].geometry[1]).toBe(0.5);
  } catch (err) {
    t.ifError(err);
  }
  
});

test('GeoJSONVT#handle points in the leftside world and the rightside world', async () => {
  try {
    const source = new TableTileSource({
      shape: 'geojson-table',
      type: 'FeatureCollection',
      features: [leftPoint, rightPoint]
    });

    expect(source.tiles[0].features[0].geometry[0]).toBe(0);
    expect(source.tiles[0].features[0].geometry[1]).toBe(0.5);

    expect(source.tiles[0].features[1].geometry[0]).toBe(1);
    expect(source.tiles[0].features[1].geometry[1]).toBe(0.5);
  } catch (err) {
    t.ifError(err);
  }
  
});
