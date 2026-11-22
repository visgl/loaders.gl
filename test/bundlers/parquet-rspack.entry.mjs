// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {load, loadInBatches} from '@loaders.gl/core';
import {ParquetLoader} from '@loaders.gl/tables/parquet';
import fixtureUrl from '../../modules/tables/test/parquet/data/apache/good/nulls.snappy.parquet';

globalThis.parquetRows = (async () => {
  const table = await load(fixtureUrl, ParquetLoader);
  let batchRows = 0;
  for await (const batch of await loadInBatches(fixtureUrl, ParquetLoader)) {
    batchRows += batch.numRows;
  }
  return [table.numRows, batchRows];
})();
