import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {geojsonToFlatGeojson} from '@loaders.gl/gis';

const FEATURES_2D = '@loaders.gl/gis/test/data/2d_features.json';

test.only('gis#geojson-to-flatGeojson', async (t) => {
  const response = await fetchFile(FEATURES_2D);
  const {features} = await response.json();

  const flatFeatures = geojsonToFlatGeojson(features);

  const [point, multiPoint, lineString, multiLineString, polygon, polygonWithHole, multiPolygon] =
    flatFeatures;

  flatFeatures.map((f, i) => {
    t.notOk(
      f.geometry.coordinates,
      `coordinates array is removed from ${features[i].geometry.type}`
    );
  });

  t.end();
});
