import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {ExcelLoader} from '@loaders.gl/excel';
import {CSVLoader} from '@loaders.gl/csv';

const ZIPCODES_XLSX_PATH = `@loaders.gl/excel/test/data/zipcodes.xlsx`;
const ZIPCODES_XLSB_PATH = `@loaders.gl/excel/test/data/zipcodes.xlsb`;
const ZIPCODES_CSV_PATH = `@loaders.gl/excel/test/data/zipcodes.csv`;

test.only('ExcelLoader#load(ZIPCODES)', async t => {
  let data;

  data = await load(ZIPCODES_CSV_PATH, CSVLoader);
  t.equal(data.length, 42050, 'CSV: Correct number of row received');

  data = await load(ZIPCODES_XLSB_PATH, ExcelLoader);
  t.equal(data.length, 42050, 'XLSB: Correct number of row received');

  data = await load(ZIPCODES_XLSX_PATH, ExcelLoader);
  t.equal(data.length, 42050, 'XLSX: Correct number of row received');

  t.end();
});
