// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load, loadInBatches} from '@loaders.gl/core';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';
import {ExcelArrowLoader, ExcelLoader} from '@loaders.gl/excel';
import {CSVLoader} from '@loaders.gl/csv';
import {convertExcelRowsToArrowTable} from '../src/lib/convert-excel-rows-to-arrow';

const ZIPCODES_XLSX_PATH = '@loaders.gl/excel/test/data/zipcodes.xlsx';
const ZIPCODES_XLSB_PATH = '@loaders.gl/excel/test/data/zipcodes.xlsb';
const ZIPCODES_CSV_PATH = '@loaders.gl/excel/test/data/zipcodes.csv';

test('ExcelLoader#load(ZIPCODES)', async t => {
  const csvTable = (await load(ZIPCODES_CSV_PATH, CSVLoader, {
    csv: {shape: 'object-row-table'}
  })) as ObjectRowTable;

  let table = await load(ZIPCODES_XLSB_PATH, ExcelLoader);
  t.equal(table.data.length, 42049, 'XLSB: Correct number of row received');
  t.deepEqual(table.data[0], csvTable.data[0], 'XLSB: Data corresponds to CSV');

  table = await load(ZIPCODES_XLSX_PATH, ExcelLoader);
  t.equal(table.data.length, 42049, 'XLSX: Correct number of row received');
  t.deepEqual(table.data[100], csvTable.data[100], 'XLSX: Data corresponds to CSV');

  t.end();
});

test('ExcelLoader#loadInBatches (on worker)', async t => {
  // This masquerades an atomic loader as batches
  const batches = (await loadInBatches(
    ZIPCODES_XLSX_PATH,
    ExcelLoader
  )) as unknown as AsyncIterable<ObjectRowTableBatch>;
  let firstBatch: ObjectRowTableBatch | null = null;
  for await (const batch of batches) {
    firstBatch = firstBatch || batch;
  }
  t.equal(firstBatch?.shape, 'object-row-table', 'XLSX: correct batch type received');
  t.equal(firstBatch?.data.length, 42049, 'XLSX: Correct batch row count received');
  t.end();
});

test('ExcelArrowLoader#load(ZIPCODES)', async t => {
  const csvTable = (await load(ZIPCODES_CSV_PATH, CSVLoader, {
    csv: {shape: 'object-row-table'}
  })) as ObjectRowTable;
  const classicTable = await load(ZIPCODES_XLSX_PATH, ExcelLoader, {
    excel: {shape: 'arrow-table'}
  });

  const table = await load(ZIPCODES_XLSX_PATH, ExcelArrowLoader);
  t.equal(table.shape, 'arrow-table', 'XLSX: correct table type received');
  t.equal(table.data.numRows, classicTable.data.numRows, 'XLSX: row count matches ExcelLoader');

  for (const rowIndex of [0, 100]) {
    const row = classicTable.data.get(rowIndex)?.toJSON() || {};
    for (const [fieldName, value] of Object.entries(row)) {
      t.equal(
        table.data.getChild(fieldName)?.get(rowIndex),
        value,
        `XLSX: ${fieldName} row ${rowIndex} matches ExcelLoader`
      );
    }
  }

  t.equal(
    table.data.getChild('zip_code')?.get(0),
    csvTable.data[0].zip_code,
    'XLSX: zip_code corresponds to CSV'
  );
  t.equal(
    table.data.getChild('city')?.get(100),
    csvTable.data[100].city,
    'XLSX: city corresponds to CSV'
  );

  t.end();
});

test('ExcelLoader#load(ZIPCODES, shape: arrow-table)', async t => {
  const classicTable = await load(ZIPCODES_XLSX_PATH, ExcelLoader);
  const table = await load(ZIPCODES_XLSX_PATH, ExcelLoader, {
    excel: {shape: 'arrow-table'}
  });

  t.equal(table.shape, 'arrow-table', 'XLSX: correct Arrow table type received');
  t.equal(
    table.data.numRows,
    classicTable.data.length,
    'XLSX: Arrow row count matches classic loader'
  );
  t.equal(
    table.data.getChild('city')?.get(100),
    classicTable.data[100].city,
    'XLSX: Arrow values match classic loader'
  );
  t.end();
});

test('convertExcelRowsToArrowTable handles empty and nullable primitive rows', t => {
  const emptyTable = convertExcelRowsToArrowTable([]);

  t.equal(emptyTable.shape, 'arrow-table', 'Empty rows return an Arrow table');
  t.equal(emptyTable.data.numCols, 0, 'Empty rows return no columns');
  t.equal(emptyTable.data.numRows, 0, 'Empty rows return no rows');

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

  t.equal(table.schema?.fields.find(field => field.name === 'numberValue')?.type, 'float64');
  t.equal(table.schema?.fields.find(field => field.name === 'booleanValue')?.type, 'bool');
  t.equal(table.schema?.fields.find(field => field.name === 'stringValue')?.type, 'utf8');
  t.equal(table.schema?.fields.find(field => field.name === 'dateValue')?.type, 'date-millisecond');
  t.equal(table.schema?.fields.find(field => field.name === 'emptyValue')?.type, 'null');
  t.equal(table.data.getChild('numberValue')?.get(1), 1, 'Number value is preserved');
  t.equal(table.data.getChild('booleanValue')?.get(1), true, 'Boolean value is preserved');
  t.equal(table.data.getChild('stringValue')?.get(1), 'x', 'String value is preserved');
  t.end();
});

test('ExcelLoader#loadInBatches(shape: arrow-table)', async t => {
  const classicTable = await load(ZIPCODES_XLSX_PATH, ExcelLoader);
  const batches = (await loadInBatches(ZIPCODES_XLSX_PATH, ExcelLoader, {
    excel: {shape: 'arrow-table'}
  })) as unknown as AsyncIterable<any>;
  let firstBatch: any = null;
  for await (const batch of batches) {
    firstBatch = firstBatch || batch;
  }

  t.equal(firstBatch?.shape, 'arrow-table', 'XLSX: correct Arrow batch type received');
  t.equal(firstBatch?.data.numRows, 42049, 'XLSX: correct Arrow batch row count received');
  t.equal(
    firstBatch?.data.getChild('city')?.get(100),
    classicTable.data[100].city,
    'XLSX: Arrow batch values are preserved'
  );
  t.end();
});

test('ExcelArrowLoader#loadInBatches', async t => {
  const classicBatches = (await loadInBatches(ZIPCODES_XLSX_PATH, ExcelLoader, {
    excel: {shape: 'arrow-table'}
  })) as unknown as AsyncIterable<any>;
  let classicFirstBatch: any = null;
  for await (const batch of classicBatches) {
    classicFirstBatch = classicFirstBatch || batch;
  }

  const batches = (await loadInBatches(
    ZIPCODES_XLSX_PATH,
    ExcelArrowLoader
  )) as unknown as AsyncIterable<any>;
  let firstBatch: any = null;
  for await (const batch of batches) {
    firstBatch = firstBatch || batch;
  }
  t.equal(firstBatch?.shape, 'arrow-table', 'XLSX: correct batch type received');
  t.equal(
    firstBatch?.data.numRows,
    classicFirstBatch?.data.numRows,
    'XLSX: batch row count matches ExcelLoader'
  );
  t.equal(
    firstBatch?.data.getChild('city')?.get(100),
    classicFirstBatch?.data.get(100)?.toJSON()?.city,
    'XLSX: batch city value matches ExcelLoader'
  );
  t.end();
});
