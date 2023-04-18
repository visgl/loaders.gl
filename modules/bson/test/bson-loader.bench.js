import {BSONLoader} from '@loaders.gl/bson';
import {load} from '@loaders.gl/core';

const TAGS_BSON_URL = '@loaders.gl/bson/test/data/js-bson/mongodump.airpair.tags.bson';

export default async function bsonLoaderBench(suite) {
  suite.group('BSONLoader');

  const options = {multiplier: 308, unit: 'features'};

  suite.addAsync('load(BSONLoader) - Atomic GeoBSON load (BSON.parse)', options, async () => {
    await load(TAGS_BSON_URL, BSONLoader);
  });
}
