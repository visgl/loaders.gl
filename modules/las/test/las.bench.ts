// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LAZPerfLoader, LAZRsLoader} from '@loaders.gl/las';
import {fetchFile, load} from '@loaders.gl/core';

const LAZ_URL = '@loaders.gl/las/test/data/indoor.laz';
// const GEO_PARQUET_URL = '@loaders.gl/parquet/test/data/geoparquet/airports.parquet';

export async function lazBench(suite) {
  suite.group('ParquetLoader');

  const response = await fetchFile(LAZ_URL);
  const arrayBuffer = await response.arrayBuffer();

  suite.addAsync('load(LAZPerfLoader) - LAZ load', {multiplier: 40000, unit: 'rows'}, async () => {
    await load(arrayBuffer, LAZPerfLoader, {worker: false});
  });

  suite.addAsync('load(LAZRsLoader) - LAZ load', {multiplier: 40000, unit: 'rows'}, async () => {
    await load(arrayBuffer, LAZRsLoader, {worker: false});
  });
}
