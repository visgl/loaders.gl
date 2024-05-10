// loaders.gl
// SPDX-License-Identifier: MIT AND ISC
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import test from 'tape-promise/tape';
import {TableTileSource} from '@loaders.gl/mvt';

const leftPoint = {
  type: 'Feature',
  properties: {},
  geometry: {
    coordinates: [-540, 0],
    type: 'Point'
  }
};

const rightPoint = {
  type: 'Feature',
  properties: {},
  geometry: {
    coordinates: [540, 0],
    type: 'Point'
  }
};

test('GeoJSONVT#handle point only in the rightside world', async (t) => {
  try {
    const source = new TableTileSource(rightPoint);
    await source.ready;

    t.equal(source.tiles[0].features[0].geometry[0], 1);
    t.equal(source.tiles[0].features[0].geometry[1], 0.5);
  } catch (err) {
    t.ifError(err);
  }
  t.end();
});

test('GeoJSONVT#handle point only in the leftside world', async (t) => {
  try {
    const source = new TableTileSource(leftPoint);
    t.equal(source.tiles[0].features[0].geometry[0], 0);
    t.equal(source.tiles[0].features[0].geometry[1], 0.5);
  } catch (err) {
    t.ifError(err);
  }
  t.end();
});

test('GeoJSONVT#handle points in the leftside world and the rightside world', async (t) => {
  try {
    const source = new TableTileSource({
      type: 'FeatureCollection',
      features: [leftPoint, rightPoint]
    });

    t.equal(source.tiles[0].features[0].geometry[0], 0);
    t.equal(source.tiles[0].features[0].geometry[1], 0.5);

    t.equal(source.tiles[0].features[1].geometry[0], 1);
    t.equal(source.tiles[0].features[1].geometry[1], 0.5);
  } catch (err) {
    t.ifError(err);
  }
  t.end();
});
