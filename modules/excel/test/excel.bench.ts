import {ExcelLoader} from '@loaders.gl/excel';
import {load} from '@loaders.gl/core';

const ZIPCODES_XLSX_PATH = `@loaders.gl/excel/test/data/zipcodes.xlsx`;
const ZIPCODES_XLSB_PATH = `@loaders.gl/excel/test/data/zipcodes.xlsb`;

export default async function excelLoaderBench(suite) {
  suite.group('ExcelLoader');

  const options = {multiplier: 42000, unit: 'rows'};

  suite.addAsync('load(ExcelLoader) - xlsx', options, async () => {
    await load(ZIPCODES_XLSX_PATH, ExcelLoader);
  });
  suite.addAsync('load(ExcelLoader) - xlsb', options, async () => {
    await load(ZIPCODES_XLSB_PATH, ExcelLoader);
  });
}
