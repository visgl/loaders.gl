import {JSONLoader} from '@loaders.gl/json';
import {load, loadInBatches} from '@loaders.gl/core';

import clarinetBench from './clarinet/clarinet.bench';

const GEOJSON_URL = '@loaders.gl/json/test/data/geojson-big.json';

export default async function jsonLoaderBench(suite) {
  suite.group('JSONLoader');

  const options = {multiplier: 308, unit: 'features'};

  suite.addAsync('loadInBatches(JSONLoader) - Streaming GeoJSON load', options, async () => {
    const asyncIterator = await loadInBatches(GEOJSON_URL, JSONLoader);
    // const asyncIterator = await parseInBatches(STRING, JSONLoader);
    const data = [];
    for await (const batch of asyncIterator) {
      data.push(...batch.data);
    }
  });

  suite.addAsync('load(JSONLoader) - Atomic GeoJSON load (JSON.parse)', options, async () => {
    await load(GEOJSON_URL, JSONLoader);
  });

  // Test underlying clarinet library
  await clarinetBench(suite);
}
