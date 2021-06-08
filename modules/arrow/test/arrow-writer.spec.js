import test from 'tape-promise/tape';
import {validateWriter} from 'test/common/conformance';

import {parseSync, encodeSync} from '@loaders.gl/core';
import {ArrowLoader, ArrowWriter} from '@loaders.gl/arrow';

test('ArrowWriter#writer conformance', (t) => {
  validateWriter(t, ArrowWriter, 'ArrowWriter');
  t.end();
});

test('ArrowWriter#encode', async (t) => {
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
  t.ok(arrayBuffer);

  const table = parseSync(arrayBuffer, ArrowLoader);
  t.ok(table);
  t.ok(table.date);
  t.ok(table.precipitation);
  t.equals(table.date.length, LENGTH);
  t.equals(table.precipitation.length, LENGTH);

  t.end();
});
