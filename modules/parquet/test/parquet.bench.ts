// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ParquetLoader, ParquetArrowLoader} from '@loaders.gl/parquet';
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
    await load(arrayBuffer, ParquetLoader, {
      core: {worker: false}
    });
  });

  // let i = 0;
  suite.addAsync('load(ParquetArrowLoader) - Parquet load', {multiplier: 40000, unit: 'rows'}, async () => {
    // const j = i++;
    // console.time(`load-${j}`);
    await load(arrayBuffer, ParquetArrowLoader, {worker: false});
    // console.timeEnd(`load-${j}`);
  });

  suite.addAsync('load(ParquetArrowLoader) - GeoParquet load', {multiplier: 40000, unit: 'rows'}, async () => {
    await load(geoArrayBuffer, ParquetArrowLoader, {
      core: {worker: false}
    });
    // console.timeEnd(`load-${j}`);
  });

  // suite.addAsync('load(ParquetColumnarLoader) - GeoParquet load', {multiplier: 40000, unit: 'rows'}, async () => {
  //   await load(geoArrayBuffer, ParquetColumnarLoader, {
  //     core: {worker: false}
  //   });
  // });

  suite.groupEnd();
}
