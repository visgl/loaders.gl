// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {createScanEngine} from '@loaders.gl/scan';

test('executes Arrow queries asynchronously across runtimes', async () => {
  const engine = await createScanEngine();
  const result = await engine.queryAsync(makeArrowTable({value: [1, 2]}), {limit: 1});

  expect(result.data.numRows).toBe(1);
});

/** Wraps simple test columns in the loaders.gl Arrow table shape. */
function makeArrowTable(columns: Record<string, readonly unknown[]>): ArrowTable {
  const data = arrow.tableFromArrays(columns);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}
