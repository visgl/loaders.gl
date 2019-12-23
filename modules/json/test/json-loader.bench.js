import {JSONLoader} from '@loaders.gl/json';
import {load, loadInBatches} from '@loaders.gl/core';

import clarinetBench from './clarinet/clarinet.bench';

const GEOJSON_URL = '@loaders.gl/json/test/data/geojson-big.json';

export default async function jsonLoaderBench(suite) {
  // Test underlying clarinet library
  await clarinetBench(suite);

  suite.group('JSONLoader - loading from file');

  suite.addAsync('load(JSONLoader) - Uses JSON.parse', async () => {
    await load(GEOJSON_URL, JSONLoader);
  });

  suite.addAsync('loadInBatches(JSONLoader) - Uses Clarinet', async () => {
    const asyncIterator = await loadInBatches(GEOJSON_URL, JSONLoader);
    // const asyncIterator = await parseInBatches(STRING, JSONLoader);
    const data = [];
    for await (const batch of asyncIterator) {
      data.push(...batch.data);
    }
  });
}
