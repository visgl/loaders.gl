// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encode, load} from '@loaders.gl/core';
import {ParquetJSWriter, ParquetLoader} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {expect, test} from 'vitest';

test('ParquetLoader decodes UTF8 BYTE_ARRAY values as strings (#3122)', async () => {
  const input: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [{name: 'h3', type: 'utf8', nullable: false}],
      metadata: {}
    },
    data: [{h3: '8828d5476bfffff'}, {h3: '8928308280fffff'}]
  };

  const parquetBuffer = await encode(input, ParquetJSWriter, {worker: false});
  const output = await load(parquetBuffer, ParquetLoader, {
    core: {worker: false}
  });

  expect(output.shape).toBe('object-row-table');
  if (output.shape !== 'object-row-table') {
    return;
  }
  expect(output.data).toEqual(input.data);
  expect(output.data.every(row => typeof row.h3 === 'string')).toBe(true);
});
