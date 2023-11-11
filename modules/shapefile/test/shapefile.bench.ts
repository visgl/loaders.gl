// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import {fetchFile, load} from '@loaders.gl/core';
import {ShapefileLoader} from '@loaders.gl/shapefile';

const DECKGL_DATA_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const SHAPEFILE_URL = `${DECKGL_DATA_URL}/test-data/shapefile/geo_export_14556060-0002-4a9e-8ef0-03da3e246166.shp`;

export default async function shapefileLoaderBench(suite) {
  const response = await fetchFile(SHAPEFILE_URL);
  const arrayBuffer = await response.arrayBuffer();

  // Add the tests
  suite.group('ShapefileLoader');

  suite.addAsync(
    'parse(ShapefileLoader without worker)',
    {multiplier: 77, unit: 'MB'},
    async () => {
      await load(arrayBuffer.slice(0), ShapefileLoader, {worker: false});
    }
  );
}
