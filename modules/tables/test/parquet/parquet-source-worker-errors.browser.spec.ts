// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encode} from '@loaders.gl/core';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {ParquetJSWriter} from '@loaders.gl/tables/parquet/index';
import {ParquetSource} from '../../src/parquet/parquet-source-loader';

test('ParquetSource propagates worker failure without an aborted caller signal', async () => {
  const fixture = await encode(
    {
      shape: 'object-row-table',
      schema: {fields: [{name: 'value', type: 'int32', nullable: false}], metadata: {}},
      data: [{value: 7}]
    } satisfies ObjectRowTable,
    ParquetJSWriter,
    {worker: false}
  );
  const workerUrl = URL.createObjectURL(
    new Blob(["throw new Error('intentional parquet worker failure');"], {type: 'application/javascript'})
  );
  const source = new ParquetSource(new Blob([fixture]), {
    core: {worker: true},
    parquet: {workerUrl}
  });
  try {
    const iterator = source.read()[Symbol.asyncIterator]();
    await expect(iterator.next()).rejects.toThrow(/intentional parquet worker failure/);
  } finally {
    await source.close();
    URL.revokeObjectURL(workerUrl);
  }
});
