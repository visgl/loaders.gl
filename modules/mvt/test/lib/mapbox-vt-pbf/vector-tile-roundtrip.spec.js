// @ts-nocheck
import {expect, test} from 'vitest';
import {isBrowser} from '@loaders.gl/loader-utils';
import VectorTile from '@loaders.gl/mvt/lib/mapbox-vector-tile-js/vector-tile';
import {fromGeojsonVt, fromVectorTileJs} from '@loaders.gl/mvt/lib/mapbox-vt-pbf/to-vector-tile';
import Pbf from 'pbf';
import geojsonVt from 'geojson-vt';
import geojsonFixtures from '@mapbox/geojson-fixtures';
import mvtf from '@mapbox/mvt-fixtures';
import GeoJsonEquality from 'geojson-equality';

// Mock: vtvalidate library doesn't compile under Node 12
const vtvalidate = {
  isValid(buff, onValidationComplete) {
    onValidationComplete(null, false);
  }
};

const eq = new GeoJsonEquality({precision: 1});

function validateTileAsync(buffer) {
  return new Promise((resolve, reject) => {
    vtvalidate.isValid(buffer, (error, invalid) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(invalid);
    });
  });
}

test.skipIf(isBrowser)('geojson-vt', async () => {
  const geometryTypes = [
    'polygon',
    'point',
    'multipoint',
    'multipolygon',
    'polygon',
    'multilinestring'
  ];

  const fixtures = geometryTypes.map(function (type) {
    return {
      name: type,
      data: {type: 'Feature', properties: {}, geometry: geojsonFixtures.geometry[type]}
    };
  });

  for (const fixture of fixtures) {
    const tile = geojsonVt(fixture.data).getTile(0, 0, 0);
    const buffer = fromGeojsonVt({geojsonLayer: tile});
    const invalid = await validateTileAsync(buffer);

    expect(!invalid, invalid).toBeTruthy();

    const expected = fixture.data.type === 'FeatureCollection' ? fixture.data.features : [fixture.data];
    const layer = new VectorTile(new Pbf(buffer)).layers.geojsonLayer;
    expect(layer.length, `${expected.length} features`).toBe(expected.length);
    for (let index = 0; index < layer.length; index++) {
      const actual = layer.feature(index).toGeoJSON(0, 0, 0);
      expect(eq.compare(actual, expected[index]), `feature ${index}`).toBeTruthy();
    }
  }
});

test('vector-tile-js', async () => {
  // See https://github.com/mapbox/mvt-fixtures/blob/master/FIXTURES.md for
  // fixture descriptions
  const fixtures = [];
  mvtf.each(function (fixture) {
    fixtures.push(fixture);
  });

  for (const fixture of fixtures) {
    if (!fixture.validity.v2) {
      continue;
    }

    if (fixture.id === '020') {
      continue;
    }

    if (fixture.id === '049' || fixture.id === '050') {
      continue;
    }

    const original = new VectorTile(new Pbf(fixture.buffer));
    const buffer = fromVectorTileJs(original);
    const roundtripped = new VectorTile(new Pbf(buffer));
    let invalid = await validateTileAsync(buffer);

    if (invalid && invalid === 'ClosePath command count is not 1') {
      continue;
    }

    // UNKOWN geometry type is valid in the spec, but vtvalidate considers
    // it an error
    if (fixture.id === '016' || fixture.id === '039') {
      invalid = null;
    }

    expect(!invalid, invalid).toBeTruthy();

    for (const name in original.layers) {
      const originalLayer = original.layers[name];
      expect(roundtripped.layers[name], `layer ${name}`).toBeTruthy();
      const roundtrippedLayer = roundtripped.layers[name];
      expect(roundtrippedLayer.length).toBe(originalLayer.length);
      for (let index = 0; index < originalLayer.length; index++) {
        const actual = roundtrippedLayer.feature(index);
        const expected = originalLayer.feature(index);

        expect(actual.id, 'id').toBe(expected.id);
        expect(actual.type, 'type').toBe(expected.type);
        expect(actual.properties, 'properties').toEqual(expected.properties);
        expect(actual.loadGeometry(), 'geometry').toEqual(expected.loadGeometry());
      }
    }
  }
});
