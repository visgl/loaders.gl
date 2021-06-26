import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {ExcelLoader} from '@loaders.gl/excel';
import {CSVLoader} from '@loaders.gl/csv';

const ZIPCODES_XLSX_PATH = `@loaders.gl/excel/test/data/zipcodes.xlsx`;
const ZIPCODES_XLSB_PATH = `@loaders.gl/excel/test/data/zipcodes.xlsb`;
const ZIPCODES_CSV_PATH = `@loaders.gl/excel/test/data/zipcodes.csv`;

test('ExcelLoader#load(ZIPCODES)', async (t) => {
  const csvData = await load(ZIPCODES_CSV_PATH, CSVLoader);
  t.equal(csvData.length, 42049, 'CSV (reference): Correct number of row received');

  let data = await load(ZIPCODES_XLSB_PATH, ExcelLoader);
  t.equal(data.length, 42049, 'XLSB: Correct number of row received');
  t.deepEqual(data[0], csvData[0], 'XLSB: Data corresponds to CSV');

  data = await load(ZIPCODES_XLSX_PATH, ExcelLoader);
  t.equal(data.length, 42049, 'XLSX: Correct number of row received');
  t.deepEqual(data[100], csvData[100], 'XLSX: Data corresponds to CSV');

  t.end();
});
