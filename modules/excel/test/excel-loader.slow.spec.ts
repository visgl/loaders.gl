import {expect, test} from 'vitest';
import {load, loadInBatches} from '@loaders.gl/core';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';
import {ExcelLoader} from '@loaders.gl/excel';
import * as excel from '@loaders.gl/excel';
import * as bundledExcel from '@loaders.gl/excel/bundled';
import * as unbundledExcel from '@loaders.gl/excel/unbundled';
import {CSVLoader} from '@loaders.gl/csv';
import {convertExcelRowsToArrowTable} from '../src/lib/convert-excel-rows-to-arrow';
const ZIPCODES_XLSX_PATH = '@loaders.gl/excel/test/data/zipcodes.xlsx';
const ZIPCODES_XLSB_PATH = '@loaders.gl/excel/test/data/zipcodes.xlsb';
const ZIPCODES_CSV_PATH = '@loaders.gl/excel/test/data/zipcodes.csv';
test('ExcelLoader#load(ZIPCODES)', async () => {
  const csvTable = (await load(ZIPCODES_CSV_PATH, CSVLoader, {
    csv: {shape: 'object-row-table'}
  })) as ObjectRowTable;
  let table = await load(ZIPCODES_XLSB_PATH, ExcelLoader);
  expect(table.data.length, 'XLSB: Correct number of row received').toBe(42049);
  expect(table.data[0], 'XLSB: Data corresponds to CSV').toEqual(csvTable.data[0]);
  table = await load(ZIPCODES_XLSX_PATH, ExcelLoader);
  expect(table.data.length, 'XLSX: Correct number of row received').toBe(42049);
  expect(table.data[100], 'XLSX: Data corresponds to CSV').toEqual(csvTable.data[100]);
});
test('ExcelLoader#loadInBatches (on worker)', async () => {
  // This masquerades an atomic loader as batches
  const batches = (await loadInBatches(
    ZIPCODES_XLSX_PATH,
    ExcelLoader
  )) as unknown as AsyncIterable<ObjectRowTableBatch>;
  let firstBatch: ObjectRowTableBatch | null = null;
  for await (const batch of batches) {
    firstBatch = firstBatch || batch;
  }
  expect(firstBatch?.shape, 'XLSX: correct batch type received').toBe('object-row-table');
  expect(firstBatch?.data.length, 'XLSX: Correct batch row count received').toBe(42049);
});
test('ExcelLoader#removed Arrow variant exports are absent', () => {
  expect('ExcelArrowLoader' in excel, 'root does not export ExcelArrowLoader').toBeFalsy();
  expect(
    'ExcelArrowLoaderOptions' in excel,
    'root does not export ExcelArrowLoaderOptions'
  ).toBeFalsy();
  expect(
    'ExcelArrowLoader' in bundledExcel,
    'bundled does not export ExcelArrowLoader'
  ).toBeFalsy();
  expect(
    'ExcelArrowLoader' in unbundledExcel,
    'unbundled does not export ExcelArrowLoader'
  ).toBeFalsy();
});
test('ExcelLoader#load(ZIPCODES, shape: arrow-table)', async () => {
  const csvTable = (await load(ZIPCODES_CSV_PATH, CSVLoader, {
    csv: {shape: 'object-row-table'}
  })) as ObjectRowTable;
  const classicTable = await load(ZIPCODES_XLSX_PATH, ExcelLoader);
  const table = await load(ZIPCODES_XLSX_PATH, ExcelLoader, {
    excel: {shape: 'arrow-table'}
  });
  expect(table.shape, 'XLSX: correct table type received').toBe('arrow-table');
  expect(table.data.numRows, 'XLSX: row count matches ExcelLoader').toBe(classicTable.data.length);
  for (const rowIndex of [0, 100]) {
    const row = classicTable.data[rowIndex] || {};
    for (const [fieldName, value] of Object.entries(row)) {
      expect(
        table.data.getChild(fieldName)?.get(rowIndex),
        `XLSX: ${fieldName} row ${rowIndex} matches ExcelLoader`
      ).toBe(value);
    }
  }
  expect(table.data.getChild('zip_code')?.get(0), 'XLSX: zip_code corresponds to CSV').toBe(
    csvTable.data[0].zip_code
  );
  expect(table.data.getChild('city')?.get(100), 'XLSX: city corresponds to CSV').toBe(
    csvTable.data[100].city
  );
});
test('convertExcelRowsToArrowTable handles empty and nullable primitive rows', () => {
  const emptyTable = convertExcelRowsToArrowTable([]);
  expect(emptyTable.shape, 'Empty rows return an Arrow table').toBe('arrow-table');
  expect(emptyTable.data.numCols, 'Empty rows return no columns').toBe(0);
  expect(emptyTable.data.numRows, 'Empty rows return no rows').toBe(0);
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
  expect(table.data.getChild('numberValue')?.get(1), 'Number value is preserved').toBe(1);
  expect(table.data.getChild('booleanValue')?.get(1), 'Boolean value is preserved').toBe(true);
  expect(table.data.getChild('stringValue')?.get(1), 'String value is preserved').toBe('x');
});
test('ExcelLoader#loadInBatches(shape: arrow-table)', async () => {
  const classicTable = await load(ZIPCODES_XLSX_PATH, ExcelLoader);
  const batches = (await loadInBatches(ZIPCODES_XLSX_PATH, ExcelLoader, {
    excel: {shape: 'arrow-table'}
  })) as unknown as AsyncIterable<any>;
  let firstBatch: any = null;
  for await (const batch of batches) {
    firstBatch = firstBatch || batch;
  }
  expect(firstBatch?.shape, 'XLSX: correct Arrow batch type received').toBe('arrow-table');
  expect(firstBatch?.data.numRows, 'XLSX: correct Arrow batch row count received').toBe(42049);
  expect(
    firstBatch?.data.getChild('city')?.get(100),
    'XLSX: Arrow batch values are preserved'
  ).toBe(classicTable.data[100].city);
});
