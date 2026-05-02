// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ParquetJSLoader, ParquetLoader, GeoParquetLoader} from '@loaders.gl/parquet';
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
    "load(ParquetLoader, shape: 'arrow-table') - Parquet load",
    {multiplier: 40000, unit: 'rows'},
    async () => {
      await load(arrayBuffer, ParquetLoader, {
        core: {worker: false},
        parquet: {shape: 'arrow-table'}
      });
    }
  );

  suite.addAsync(
    "load(ParquetLoader, shape: 'arrow-table') - GeoParquet load",
    {multiplier: 40000, unit: 'rows'},
    async () => {
      await load(geoArrayBuffer, ParquetLoader, {
        core: {worker: false},
        parquet: {shape: 'arrow-table'}
      });
    }
  );

  suite = suite.group('GeoParquetLoader');

  suite.addAsync(
    'load arrow-table geoarrow.wkb',
    {multiplier: 40000, unit: 'rows'},
    async () => {
      await load(geoArrayBuffer.slice(0), GeoParquetLoader, {
        core: {worker: false},
        parquet: {shape: 'arrow-table'}
      });
    }
  );

  suite.addAsync(
    'load geojson-table',
    {multiplier: 40000, unit: 'rows'},
    async () => {
      await load(geoArrayBuffer.slice(0), GeoParquetLoader, {
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
