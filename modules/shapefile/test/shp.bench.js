import {SHPLoader} from '@loaders.gl/shapefile';
import {parse, parseInBatches, fetchFile} from '@loaders.gl/core';

const DECKGL_DATA_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const SHAPEFILE_URL = `${DECKGL_DATA_URL}/test-data/shapefile/geo_export_14556060-0002-4a9e-8ef0-03da3e246166.shp`;

export default async function shpLoaderBench(suite) {
  const response = await fetchFile(SHAPEFILE_URL);
  const arrayBuffer = await response.arrayBuffer();

  // Add the tests
  suite.group('SHPLoader');

  suite.addAsync(
    `parse(SHPLoader without worker)`,
    {multiplier: 77, unit: 'MB'},
    async () => await parse(arrayBuffer, SHPLoader, {worker: false})
  );
  suite.addAsync(
    `parseInBatches(SHPLoader without worker)`,
    {multiplier: 77, unit: 'MB'},
    async () => await parseInBatches(arrayBuffer, SHPLoader, {worker: false})
  );

  // TODO: optionally test for equality of batched and atomic loaders
  // Note: first batch returned from asyncIterator is the shp header
  // const rows = [];
  // for await (const batch of asyncIterator) {
  //   rows.push(...batch);
  // }
  // t.deepEqual(rows, output.geometries);
}
