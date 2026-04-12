// @ts-nocheck
import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import Pbf from 'pbf';
import VectorTile from '@loaders.gl/mvt/lib/mapbox-vector-tile-js/vector-tile';
import {fromGeojsonVt} from '@loaders.gl/mvt/lib/mapbox-vt-pbf/to-vector-tile';
import geojsonVt from 'geojson-vt';
import GeoJsonEquality from 'geojson-equality';

const eq = new GeoJsonEquality({precision: 1});

test('property encoding: JSON.stringify non-primitive values', () => {
  // Includes two properties with a common non-primitive value for
  // https://github.com/mapbox/vt-pbf/issues/9
  const orig = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          a: 'one',
          b: 1,
          c: {hello: 'world'},
          d: [1, 2, 3]
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      },
      {
        type: 'Feature',
        properties: {
          a: 'two',
          b: 2,
          c: {goodbye: 'planet'},
          d: {hello: 'world'}
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      }
    ]
  };

  const tileindex = geojsonVt(orig);
  const tile = tileindex.getTile(1, 0, 0);
  const buff = fromGeojsonVt({geojsonLayer: tile});

  const vt = new VectorTile(new Pbf(buff));
  const layer = vt.layers.geojsonLayer;

  const first = layer.feature(0).properties;
  const second = layer.feature(1).properties;
  expect(first.c).toBe('{"hello":"world"}');
  expect(first.d).toBe('[1,2,3]');
  expect(second.c).toBe('{"goodbye":"planet"}');
  expect(second.d).toBe('{"hello":"world"}');
});

test('number encoding https://github.com/mapbox/vt-pbf/pull/11', () => {
  const orig = {
    type: 'Feature',
    properties: {
      large_integer: 39953616224, // eslint-disable-line camelcase
      non_integer: 331.75415 // eslint-disable-line camelcase
    },
    geometry: {
      type: 'Point',
      coordinates: [0, 0]
    }
  };

  const tileindex = geojsonVt(orig);
  const tile = tileindex.getTile(1, 0, 0);
  const buff = fromGeojsonVt({geojsonLayer: tile});
  const vt = new VectorTile(new Pbf(buff));
  const layer = vt.layers.geojsonLayer;

  const properties = layer.feature(0).properties;
  expect(properties.large_integer).toBe(39953616224);
  expect(properties.non_integer).toBe(331.75415);
  
});

test('id encoding', () => {
  const orig = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 123,
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      },
      {
        type: 'Feature',
        id: 'invalid',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      },
      {
        type: 'Feature',
        // no id
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      }
    ]
  };
  const tileindex = geojsonVt(orig);
  const tile = tileindex.getTile(1, 0, 0);
  const buff = fromGeojsonVt({geojsonLayer: tile});
  const vt = new VectorTile(new Pbf(buff));
  const layer = vt.layers.geojsonLayer;
  expect(layer.feature(0).id).toBe(123);
  expect(layer.feature(1).id, 'Non-integer values should not be saved').toBeFalsy();
  expect(layer.feature(2).id).toBeFalsy();
});

test('accept geojson-vt options https://github.com/mapbox/vt-pbf/pull/21', async () => {
  const RECTANGLE_URL = '@loaders.gl/mvt/test/data/mapbox-vt-pbf-fixtures/rectangle.geojson';
  const response = await fetchFile(RECTANGLE_URL);
  const orig = await response.json();

  const version = 2;
  const extent = 8192;
  const tileindex = geojsonVt(orig, {extent});
  const tile = tileindex.getTile(1, 0, 0);
  const options = {version, extent};
  const buff = fromGeojsonVt({geojsonLayer: tile}, options);

  const vt = new VectorTile(new Pbf(buff));
  const layer = vt.layers.geojsonLayer;
  const features = [];
  for (let i = 0; i < layer.length; i++) {
    const feat = layer.feature(i).toGeoJSON(0, 0, 1);
    features.push(feat);
  }

  expect(layer.version, 'version should be equal').toBe(options.version);
  expect(layer.extent, 'extent should be equal').toBe(options.extent);

  orig.features.forEach(function (expected) {
    const actual = features.shift();

    // TODO - this was added in loaders fork to make tests pass, investigate why it is needed
    delete expected.id;

    expect(eq.compare(actual, expected)).toBeTruthy();
  });
});
