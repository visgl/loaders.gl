import test from 'tape-promise/tape';
import {transformBinaryCoords, transformGeoJsonCoords} from '@loaders.gl/gis';
import {Proj4Projection} from '@math.gl/proj4';

test('gis#reproject GeoJSON', t => {
  const projection = new Proj4Projection({from: 'WGS84', to: 'EPSG:3857'});
  const inputGeoJson = [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-74, 41]
      },
      properties: {}
    }
  ];
  const expectedGeoJson = [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-8237642.318702244, 5012341.663847514]
      },
      properties: {}
    }
  ];

  const out = transformGeoJsonCoords(inputGeoJson, coord => projection.project(coord));
  t.deepEqual(out, expectedGeoJson);
  t.end();
});

test('gis#reproject binary', t => {
  const projection = new Proj4Projection({from: 'WGS84', to: 'EPSG:3857'});
  const binaryData = {
    points: {
      positions: {value: new Float32Array([-74, 41]), size: 2},
      globalFeatureIds: {value: new Uint16Array([0, 1, 1]), size: 1},
      featureIds: {value: new Uint16Array([0, 1, 1]), size: 1},
      numericProps: {
        numeric1: {value: new Uint16Array([1, 2, 2]), size: 1}
      },
      properties: [{string1: 'a'}, {string1: 'b'}]
    }
  };
  const expectedBinaryData = {
    points: {
      positions: {value: new Float32Array([-8237642.318702244, 5012341.663847514]), size: 2},
      globalFeatureIds: {value: new Uint16Array([0, 1, 1]), size: 1},
      featureIds: {value: new Uint16Array([0, 1, 1]), size: 1},
      numericProps: {
        numeric1: {value: new Uint16Array([1, 2, 2]), size: 1}
      },
      properties: [{string1: 'a'}, {string1: 'b'}]
    }
  };

  const out = transformBinaryCoords(binaryData, coord => projection.project(coord));
  t.deepEqual(out, expectedBinaryData);
  t.end();
});
