// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {CSVLoader} from '@loaders.gl/csv';
import {ExcelLoader} from '@loaders.gl/excel';
import * as excel from '@loaders.gl/excel';
import * as bundledExcel from '@loaders.gl/excel/bundled';
import * as unbundledExcel from '@loaders.gl/excel/unbundled';
import {convertExcelRowsToArrowTable} from '../src/lib/convert-excel-rows-to-arrow';

const ZIPCODES_XLSX_PATH = '@loaders.gl/excel/test/data/zipcodes-small.xlsx';
const ZIPCODES_XLSB_PATH = '@loaders.gl/excel/test/data/zipcodes-small.xlsb';
const ZIPCODES_CSV_PATH = '@loaders.gl/excel/test/data/zipcodes-small.csv';
const ROW_COUNT = 12;

test('ExcelLoader#small XLSB and XLSX fixtures match CSV', async () => {
  const csvTable = (await load(ZIPCODES_CSV_PATH, CSVLoader, {
    csv: {shape: 'object-row-table'},
    core: {worker: false}
  })) as ObjectRowTable;
  const [xlsbTable, xlsxTable] = await Promise.all([
    load(ZIPCODES_XLSB_PATH, ExcelLoader, {core: {worker: false}}),
    load(ZIPCODES_XLSX_PATH, ExcelLoader, {core: {worker: false}})
  ]);

  expect(xlsbTable.data).toHaveLength(ROW_COUNT);
  expect(xlsxTable.data).toHaveLength(ROW_COUNT);
  expect(xlsbTable.data[0]).toEqual(csvTable.data[0]);
  expect(xlsxTable.data[5]).toEqual(csvTable.data[5]);
});

test('ExcelLoader#small XLSX fixture supports Arrow output', async () => {
  const table = await load(ZIPCODES_XLSX_PATH, ExcelLoader, {
    excel: {shape: 'arrow-table'},
    core: {worker: false}
  });

  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows).toBe(ROW_COUNT);
  expect(table.data.getChild('zip_code')?.get(0)).toBeTruthy();
});

test('ExcelLoader#removed Arrow variant exports are absent', () => {
  expect('ExcelArrowLoader' in excel).toBe(false);
  expect('ExcelArrowLoaderOptions' in excel).toBe(false);
  expect('ExcelArrowLoader' in bundledExcel).toBe(false);
  expect('ExcelArrowLoader' in unbundledExcel).toBe(false);
});

test('convertExcelRowsToArrowTable handles empty and nullable primitive rows', () => {
  const emptyTable = convertExcelRowsToArrowTable([]);
  expect(emptyTable.shape).toBe('arrow-table');
  expect(emptyTable.data.numCols).toBe(0);
  expect(emptyTable.data.numRows).toBe(0);

  const dateValue = new Date('2020-01-02T00:00:00.000Z');
  const table = convertExcelRowsToArrowTable([
    {
      numberValue: null,
      booleanValue: null,
      stringValue: null,
      dateValue: null,
      emptyValue: null
    },
    {
      numberValue: 1,
      booleanValue: true,
      stringValue: 'x',
      dateValue,
      emptyValue: null
    }
  ]);

  expect(table.schema?.fields.find(field => field.name === 'numberValue')?.type).toBe('float64');
  expect(table.schema?.fields.find(field => field.name === 'booleanValue')?.type).toBe('bool');
  expect(table.schema?.fields.find(field => field.name === 'stringValue')?.type).toBe('utf8');
  expect(table.schema?.fields.find(field => field.name === 'dateValue')?.type).toBe(
    'date-millisecond'
  );
  expect(table.schema?.fields.find(field => field.name === 'emptyValue')?.type).toBe('null');
  expect(table.data.getChild('numberValue')?.get(1)).toBe(1);
  expect(table.data.getChild('booleanValue')?.get(1)).toBe(true);
  expect(table.data.getChild('stringValue')?.get(1)).toBe('x');
});
