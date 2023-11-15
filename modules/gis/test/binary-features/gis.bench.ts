import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

import {geojsonToBinary} from '@loaders.gl/gis';

// const GEOJSON_URL = '@loaders.gl/json/test/data/geojson-big.json';
const GEOJSON_POLYGONS_URL = '@loaders.gl/mvt/test/data/geojson-vt/us-states.json';

export default async function gisBench(suite) {
  suite.group('geojson-to-binary');

  // @ts-expect-error
  const {features} = await load(GEOJSON_POLYGONS_URL, JSONLoader);
  const options = {multiplier: features.length, unit: 'features'};
  suite.addAsync('geojsonToBinary(triangulate=true)', options, async () => {
    geojsonToBinary(features);
  });
  suite.addAsync('geojsonToBinary(triangulate=false)', options, async () => {
    geojsonToBinary(features, {fixRingWinding: true, triangulate: false});
  });
}
