// @ts-nocheck
import test from 'tape-promise/tape';
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

test('geojson-vt', (t) => {
  if (isBrowser) {
    t.comment('Skipping as @mapbox/geojson-fixtures is only supported in Node.js');
    t.end();
    return;
  }

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

  fixtures.forEach(function (fixture) {
    t.comment(`Testing ${fixture.name}`);
    const tile = geojsonVt(fixture.data).getTile(0, 0, 0);
    const buff = fromGeojsonVt({geojsonLayer: tile});
    vtvalidate.isValid(buff, (err, invalid) => {
      t.error(err);

      t.ok(!invalid, invalid);

      // Compare roundtripped features with originals
      const expected =
        fixture.data.type === 'FeatureCollection' ? fixture.data.features : [fixture.data];
      const layer = new VectorTile(new Pbf(buff)).layers.geojsonLayer;
      t.equal(layer.length, expected.length, `${expected.length} features`);
      for (let i = 0; i < layer.length; i++) {
        const actual = layer.feature(i).toGeoJSON(0, 0, 0);
        t.ok(eq.compare(actual, expected[i]), `feature ${i}`);
      }
      t.end();
    });
  });

  t.end();
});

test('vector-tile-js', (t) => {
  // See https://github.com/mapbox/mvt-fixtures/blob/master/FIXTURES.md for
  // fixture descriptions
  mvtf.each(function (fixture) {
    // skip invalid tiles
    if (!fixture.validity.v2) return;

    t.comment(`mvt-fixtures: ${fixture.id} ${fixture.description}`);
    const original = new VectorTile(new Pbf(fixture.buffer));

    if (fixture.id === '020') {
      t.comment('Skipping test due to https://github.com/mapbox/vt-pbf/issues/30');
      t.end();
      return;
    }

    if (fixture.id === '049' || fixture.id === '050') {
      t.comment('Skipping test due to https://github.com/mapbox/vt-pbf/issues/31');
      t.end();
      return;
    }

    const buff = fromVectorTileJs(original);
    const roundtripped = new VectorTile(new Pbf(buff));

    vtvalidate.isValid(buff, (err, invalid) => {
      t.error(err);

      if (invalid && invalid === 'ClosePath command count is not 1') {
        t.comment('Skipping test due to https://github.com/mapbox/vt-pbf/issues/28');
        t.end();
        return;
      }

      // UNKOWN geometry type is valid in the spec, but vtvalidate considers
      // it an error
      if (fixture.id === '016' || fixture.id === '039') {
        invalid = null;
      }

      t.ok(!invalid, invalid);

      // Compare roundtripped features with originals
      for (const name in original.layers) {
        const originalLayer = original.layers[name];
        t.ok(roundtripped.layers[name], `layer ${name}`);
        const roundtrippedLayer = roundtripped.layers[name];
        t.equal(roundtrippedLayer.length, originalLayer.length);
        for (let i = 0; i < originalLayer.length; i++) {
          const actual = roundtrippedLayer.feature(i);
          const expected = originalLayer.feature(i);

          t.equal(actual.id, expected.id, 'id');
          t.equal(actual.type, expected.type, 'type');
          t.deepEqual(actual.properties, expected.properties, 'properties');
          t.deepEqual(actual.loadGeometry(), expected.loadGeometry(), 'geometry');
        }
      }
    });
  });
  t.end();
});
