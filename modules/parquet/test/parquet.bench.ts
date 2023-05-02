import {ParquetLoader, ParquetColumnarLoader} from '@loaders.gl/parquet';
import {fetchFile, load} from '@loaders.gl/core';

// const PARQUET_URL = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
const PARQUET_URL = '@loaders.gl/parquet/test/data/fruits.parquet';
const GEO_PARQUET_URL = '@loaders.gl/parquet/test/data/geoparquet/airports.parquet';

export async function parquetBench(suite) {
  suite.group('ParquetLoader');

  let response = await fetchFile(PARQUET_URL);
  const arrayBuffer = await response.arrayBuffer();

  response = await fetchFile(GEO_PARQUET_URL);
  const geoArrayBuffer = await response.arrayBuffer();

  suite.addAsync('load(ParquetLoader) - Parquet load', {multiplier: 40000, unit: 'rows'}, async () => {
    await load(arrayBuffer, ParquetLoader, {worker: false});
  });

  // let i = 0;
  suite.addAsync('load(ParquetColumnarLoader) - Parquet load', {multiplier: 40000, unit: 'rows'}, async () => {
    // const j = i++;
    // console.time(`load-${j}`);
    await load(arrayBuffer, ParquetColumnarLoader, {worker: false});
    // console.timeEnd(`load-${j}`);
  });

  suite.addAsync('load(ParquetColumnarLoader) - GeoParquet load', {multiplier: 40000, unit: 'rows'}, async () => {
    await load(geoArrayBuffer, ParquetColumnarLoader, {worker: false});
  });
}
