// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateWriter} from 'test/common/conformance';
import {parseSync, encodeSync} from '@loaders.gl/core';
import {ArrowWriter} from '@loaders.gl/arrow';
import {ArrowLoader} from '@loaders.gl/arrow/bundled';
test('ArrowWriter#writer conformance', () => {
  validateWriter(ArrowWriter, 'ArrowWriter');
});
test('ArrowWriter#encode', async () => {
  const LENGTH = 2000;
  const rainAmounts = Float32Array.from({length: LENGTH}, () =>
    Number((Math.random() * 20).toFixed(1))
  );
  const rainDates = Array.from(
    {length: LENGTH},
    (_, i) => new Date(Date.now() - 1000 * 60 * 60 * 24 * i)
  );
  const arraysData = [
    {array: rainAmounts, name: 'precipitation', type: 0},
    {array: rainDates, name: 'date', type: 1}
  ];
  const arrayBuffer = encodeSync(arraysData, ArrowWriter);
  expect(arrayBuffer).toBeTruthy();
  const table = parseSync(arrayBuffer, ArrowLoader);
  expect(table).toBeTruthy();
  expect(table.shape).toBe('columnar-table');
  if (table.shape === 'columnar-table') {
    expect(table.data.precipitation).toBeTruthy();
    expect(table.data.precipitation.length).toBe(LENGTH);
  }
});
