// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {ARROW_SIMPLE} from '../data/arrow/test-cases';

import {fetchFile, parse} from '@loaders.gl/core';
import {ArrowLoader, convertTableToArrow} from '@loaders.gl/arrow';

test('ArrowLoader#shapes', async (t) => {
  for (const testCase of [{filename: ARROW_SIMPLE}]) {
    const response = await fetchFile(testCase.filename);
    const table = await parse(response, ArrowLoader, {arrow: {shape: 'object-row-table'}});

    // @ts-expect-error
    t.ok(table.shape === 'object-row-table', 'shape is object-row-table');

    const arrowTable = convertTableToArrow(table);

    t.ok(arrowTable);
  }
  t.end();
});
