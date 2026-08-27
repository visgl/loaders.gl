// loaders.gl
// SPDX-License-Identifier: MIT AND ISC
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import {expect, test} from 'vitest';
import {TableVectorTileSource} from '@loaders.gl/mvt';
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
  const source = new TableVectorTileSource(makeGeoJSONTable(rightPoint), {});
  await source.ready;
  const tile = source.getProtoTile({z: 0, x: 0, y: 0});
  expect(tile?.protoFeatures[0].geometry[0][0]).toBe(4096);
  expect(tile?.protoFeatures[0].geometry[0][1]).toBe(2048);
});
test('GeoJSONVT#handle point only in the leftside world', async () => {
  const source = new TableVectorTileSource(makeGeoJSONTable(leftPoint), {});
  await source.ready;
  const tile = source.getProtoTile({z: 0, x: 0, y: 0});
  expect(tile?.protoFeatures[0].geometry[0][0]).toBe(0);
  expect(tile?.protoFeatures[0].geometry[0][1]).toBe(2048);
});
test('GeoJSONVT#handle points in the leftside world and the rightside world', async () => {
  const source = new TableVectorTileSource(
    {
      shape: 'geojson-table',
      type: 'FeatureCollection',
      features: [leftPoint, rightPoint]
    },
    {}
  );
  await source.ready;
  const tile = source.getProtoTile({z: 0, x: 0, y: 0});
  expect(tile?.protoFeatures[0].geometry[0][0]).toBe(0);
  expect(tile?.protoFeatures[0].geometry[0][1]).toBe(2048);
  expect(tile?.protoFeatures[1].geometry[0][0]).toBe(4096);
  expect(tile?.protoFeatures[1].geometry[0][1]).toBe(2048);
});
