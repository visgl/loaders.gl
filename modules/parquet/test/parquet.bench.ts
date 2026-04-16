// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ParquetLoader, ParquetArrowLoader} from '@loaders.gl/parquet';
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
    suite.addAsync(
      `load(ParquetLoader, implementation=${implementation}) - Parquet load`,
      {multiplier: 40000, unit: 'rows'},
      async () => {
        await load(arrayBuffer, ParquetLoader, {
          core: {worker: false},
          parquet: {implementation}
        });
      }
    );
  }

  for (const implementation of IMPLEMENTATIONS) {
    let supportsParquetArrowLoad = true;
    try {
      await load(arrayBuffer.slice(0), ParquetArrowLoader, {
        core: {worker: false},
        parquet: {implementation}
      });
    } catch {
      supportsParquetArrowLoad = false;
    }

    if (supportsParquetArrowLoad) {
      suite.addAsync(
        `load(ParquetArrowLoader, implementation=${implementation}) - Parquet load`,
        {multiplier: 40000, unit: 'rows'},
        async () => {
          await load(arrayBuffer, ParquetArrowLoader, {
            core: {worker: false},
            parquet: {implementation}
          });
        }
      );
    }

    let supportsGeoParquetArrowLoad = true;
    try {
      await load(geoArrayBuffer.slice(0), ParquetArrowLoader, {
        core: {worker: false},
        parquet: {implementation}
      });
    } catch {
      supportsGeoParquetArrowLoad = false;
    }

    if (supportsGeoParquetArrowLoad) {
      suite.addAsync(
        `load(ParquetArrowLoader, implementation=${implementation}) - GeoParquet load`,
        {multiplier: 40000, unit: 'rows'},
        async () => {
          await load(geoArrayBuffer, ParquetArrowLoader, {
            core: {worker: false},
            parquet: {implementation}
          });
        }
      );
    }
  }

  // suite.addAsync('load(ParquetColumnarLoader) - GeoParquet load', {multiplier: 40000, unit: 'rows'}, async () => {
  //   await load(geoArrayBuffer, ParquetColumnarLoader, {
  //     core: {worker: false}
  //   });
  // });
}
