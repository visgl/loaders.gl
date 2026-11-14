// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {createScanEngine} from '@loaders.gl/core/scan';

test('executes Arrow queries asynchronously across runtimes', async () => {
  const engine = await createScanEngine();
  const result = await engine.queryAsync(makeArrowTable({value: [1, 2]}), {limit: 1});

  expect(result.numRows).toBe(1);
});

/** Builds an Arrow table from test columns. */
function makeArrowTable(columns: Record<string, readonly unknown[]>): arrow.Table {
  return arrow.tableFromArrays(columns);
}
