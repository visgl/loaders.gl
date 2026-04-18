// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ParquetJSLoader, ParquetLoader, ParquetArrowLoader} from '@loaders.gl/parquet';
import {fetchFile, load} from '@loaders.gl/core';

// const PARQUET_URL = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
const PARQUET_URL = '@loaders.gl/parquet/test/data/fruits.parquet';
const GEO_PARQUET_URL = '@loaders.gl/parquet/test/data/geoparquet/airports.parquet';
const IMPLEMENTATIONS = ['js', 'wasm'] as const;

export async function parquetBench(suite) {
  suite = suite.group('ParquetLoader');

  let response = await fetchFile(PARQUET_URL);
  const arrayBuffer = await response.arrayBuffer();

  response = await fetchFile(GEO_PARQUET_URL);
  const geoArrayBuffer = await response.arrayBuffer();

  for (const implementation of IMPLEMENTATIONS) {
    const loader = implementation === 'js' ? ParquetJSLoader : ParquetLoader;
    suite.addAsync(
      `load(${implementation === 'js' ? 'ParquetJSLoader' : 'ParquetLoader'}) - Parquet load`,
      {multiplier: 40000, unit: 'rows'},
      async () => {
        await load(arrayBuffer, loader, {
          core: {worker: false}
        });
      }
    );
  }

  suite.addAsync(
    'load(ParquetArrowLoader) - Parquet load',
    {multiplier: 40000, unit: 'rows'},
    async () => {
      await load(arrayBuffer, ParquetArrowLoader, {
        core: {worker: false}
      });
    }
  );

  suite.addAsync(
    'load(ParquetArrowLoader) - GeoParquet load',
    {multiplier: 40000, unit: 'rows'},
    async () => {
      await load(geoArrayBuffer, ParquetArrowLoader, {
        core: {worker: false}
      });
    }
  );

  // suite.addAsync('load(ParquetColumnarLoader) - GeoParquet load', {multiplier: 40000, unit: 'rows'}, async () => {
  //   await load(geoArrayBuffer, ParquetColumnarLoader, {
  //     core: {worker: false}
  //   });
  // });
}
