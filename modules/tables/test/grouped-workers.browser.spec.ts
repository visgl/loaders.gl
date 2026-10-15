// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {ExcelLoader} from '@loaders.gl/tables';

const WORKSHEET_URL = '@loaders.gl/excel/test/data/zipcodes-small.xlsx';

test.each(['tables', 'excel'])('Excel worker assets remain executable under %s', async owner => {
  const workerUrl = new URL(`/modules/${owner}/dist/excel-worker.js`, window.location.origin).href;
  const table = await load(WORKSHEET_URL, ExcelLoader, {
    core: {worker: true},
    excel: {workerUrl, shape: 'arrow-table'}
  });
  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows).toBe(12);
  expect(table.data.getChild('zip_code')?.get(0)).toBeTruthy();
});
