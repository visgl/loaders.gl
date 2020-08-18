import test from 'tape-promise/tape';
import {reprojectGeoJson} from '@loaders.gl/gis';
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

  const out = reprojectGeoJson(inputGeoJson, projection);
  t.deepEqual(out, expectedGeoJson);
  t.end();
});

