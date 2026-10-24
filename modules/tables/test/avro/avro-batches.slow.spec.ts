// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {concatenateAvroTables} from '../../src/avro/lib/parsers/create-avro-table';

test('Avro collects more batches than the JavaScript function-argument limit', () => {
  // Reuse one immutable batch to exercise collection scale without decoding a large fixture.
  const table = new arrow.Table({
    payload: arrow.vectorFromArray([new Uint8Array([1, 2, 3])], new arrow.Binary())
  });
  const result = concatenateAvroTables(Array.from({length: 150_000}, () => table));
  expect(result.numRows).toBe(150_000);
  expect(result.batches).toHaveLength(150_000);
  expect(result.getChild('payload')!.type).toBeInstanceOf(arrow.Binary);
  expect(Array.from(result.getChild('payload')!.get(149_999))).toEqual([1, 2, 3]);
});
