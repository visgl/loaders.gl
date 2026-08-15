// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import type Int64 from 'node-int64';

import {decodeDataPages} from '../../src/parquetjs/parser/decoders';
import type {ParquetReaderContext} from '../../src/parquetjs/schema/declare';

/** Minimal required-column context for page-assembly metadata tests. */
const TEST_CONTEXT: ParquetReaderContext = {
  type: 'INT32',
  rLevelMax: 0,
  dLevelMax: 0,
  compression: 'UNCOMPRESSED',
  column: {
    name: 'value',
    path: ['value'],
    key: 'value',
    primitiveType: 'INT32',
    repetitionType: 'REQUIRED',
    rLevelMax: 0,
    dLevelMax: 0
  }
};

test('decodeDataPages#returns preallocated empty column data', async t => {
  const data = await decodeDataPages(new Uint8Array(), {
    ...TEST_CONTEXT,
    numValues: 0 as unknown as Int64
  });

  t.deepEqual(data.rlevels, [], 'returns no repetition levels');
  t.deepEqual(data.dlevels, [], 'returns no definition levels');
  t.deepEqual(data.values, [], 'returns no values');
  t.deepEqual(data.pageHeaders, [], 'returns no page headers');
  t.equal(data.count, 0, 'returns zero decoded values');
  t.end();
});

test('decodeDataPages#rejects invalid metadata value counts', async t => {
  await t.rejects(
    decodeDataPages(new Uint8Array(), {
      ...TEST_CONTEXT,
      numValues: -1 as unknown as Int64
    }),
    /Invalid Parquet column value count -1/,
    'rejects negative value counts before allocating page buffers'
  );
  t.end();
});
