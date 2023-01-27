import test from 'tape-promise/tape';
import {load, loadInBatches} from '@loaders.gl/core';
import {ExcelLoader} from '@loaders.gl/excel';
import {CSVLoader} from '@loaders.gl/csv';

const ZIPCODES_XLSX_PATH = `@loaders.gl/excel/test/data/zipcodes.xlsx`;
const ZIPCODES_XLSB_PATH = `@loaders.gl/excel/test/data/zipcodes.xlsb`;
const ZIPCODES_CSV_PATH = `@loaders.gl/excel/test/data/zipcodes.csv`;

test('ExcelLoader#load(ZIPCODES)', async (t) => {
  const csvData = await load(ZIPCODES_CSV_PATH, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });
  t.equal(csvData.length, 42049, 'CSV (reference): Correct number of row received');

  let table = await load(ZIPCODES_XLSB_PATH, ExcelLoader);
  t.equal(table.data.length, 42049, 'XLSB: Correct number of row received');
  t.deepEqual(table.data[0], csvData[0], 'XLSB: Data corresponds to CSV');

  table = await load(ZIPCODES_XLSX_PATH, ExcelLoader);
  t.equal(table.data.length, 42049, 'XLSX: Correct number of row received');
  t.deepEqual(table.data[100], csvData[100], 'XLSX: Data corresponds to CSV');

  t.end();
});

test('ExcelLoader#loadInBatches (on worker)', async (t) => {
  // Workers are not supported under Node at the moment.
  const batches = await loadInBatches(ZIPCODES_XLSX_PATH, ExcelLoader);
  for await (const batch of batches) {
    t.equal(batch.data.data.length, 42049, 'XLSX: Correct number of row received');
  }
  t.end();
});
