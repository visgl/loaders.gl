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
test('geojson-vt', () => {
  if (isBrowser) {
    console.log('Skipping as @mapbox/geojson-fixtures is only supported in Node.js');
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
    console.log(`Testing ${fixture.name}`);
    const tile = geojsonVt(fixture.data).getTile(0, 0, 0);
    const buff = fromGeojsonVt({geojsonLayer: tile});
    vtvalidate.isValid(buff, (err, invalid) => {
      expect(err, 'validation callback returns no error').toBeNull();
      expect(!invalid, invalid).toBeTruthy();
      // Compare roundtripped features with originals
      const expected =
        fixture.data.type === 'FeatureCollection' ? fixture.data.features : [fixture.data];
      const layer = new VectorTile(new Pbf(buff)).layers.geojsonLayer;
      expect(layer.length, `${expected.length} features`).toBe(expected.length);
      for (let i = 0; i < layer.length; i++) {
        const actual = layer.feature(i).toGeoJSON(0, 0, 0);
        expect(eq.compare(actual, expected[i]), `feature ${i}`).toBeTruthy();
      }
    });
  });
});
test('vector-tile-js', () => {
  // See https://github.com/mapbox/mvt-fixtures/blob/master/FIXTURES.md for
  // fixture descriptions
  mvtf.each(function (fixture) {
    // skip invalid tiles
    if (!fixture.validity.v2) return;
    console.log(`mvt-fixtures: ${fixture.id} ${fixture.description}`);
    const original = new VectorTile(new Pbf(fixture.buffer));
    if (fixture.id === '020') {
      console.log('Skipping test due to https://github.com/mapbox/vt-pbf/issues/30');
      return;
    }
    if (fixture.id === '049' || fixture.id === '050') {
      console.log('Skipping test due to https://github.com/mapbox/vt-pbf/issues/31');
      return;
    }
    const buff = fromVectorTileJs(original);
    const roundtripped = new VectorTile(new Pbf(buff));
    vtvalidate.isValid(buff, (err, invalid) => {
      expect(err, 'validation callback returns no error').toBeNull();
      if (invalid && invalid === 'ClosePath command count is not 1') {
        console.log('Skipping test due to https://github.com/mapbox/vt-pbf/issues/28');
        return;
      }
      // UNKOWN geometry type is valid in the spec, but vtvalidate considers
      // it an error
      if (fixture.id === '016' || fixture.id === '039') {
        invalid = null;
      }
      expect(!invalid, invalid).toBeTruthy();
      // Compare roundtripped features with originals
      for (const name in original.layers) {
        const originalLayer = original.layers[name];
        expect(roundtripped.layers[name], `layer ${name}`).toBeTruthy();
        const roundtrippedLayer = roundtripped.layers[name];
        expect(roundtrippedLayer.length).toBe(originalLayer.length);
        for (let i = 0; i < originalLayer.length; i++) {
          const actual = roundtrippedLayer.feature(i);
          const expected = originalLayer.feature(i);
          expect(actual.id, 'id').toBe(expected.id);
          expect(actual.type, 'type').toBe(expected.type);
          expect(actual.properties, 'properties').toEqual(expected.properties);
          expect(actual.loadGeometry(), 'geometry').toEqual(expected.loadGeometry());
        }
      }
    });
  });
});
