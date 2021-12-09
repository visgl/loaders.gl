import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

import {geojsonToBinary, geojsonToBinaryOld} from '@loaders.gl/gis';

const GEOJSON_URL = '@loaders.gl/json/test/data/geojson-big.json';

export default async function gisBench(suite) {
  suite.group('geojson-to-binary');

  const {features} = await load(GEOJSON_URL, JSONLoader);
  const options = {multiplier: 308, unit: 'features'};

  suite.addAsync('geojsonToBinary - GeoJSON to Binary conversion', options, async () => {
    geojsonToBinary(features);
  });

  suite.addAsync('geojsonToBinaryOld - GeoJSON to Binary conversion', options, async () => {
    geojsonToBinaryOld(features);
  });
}
