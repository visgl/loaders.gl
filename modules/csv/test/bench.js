import {parseFile} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/experimental';
import SAMPLE_CSV from '../data/sample-very-long.csv';
// import {isBrowser, readFile, loadFile} from '@loaders.gl/core';
// import {parseFileAsIterator, parseFileAsAsyncIterator} from '@loaders.gl/core';

/*
// Comparison loader based on D3
import {csvParseRows} from 'd3-dsv';

const D3CSVLoader = {
  name: 'CSV',
  extension: 'csv',
  testText: null,
  parseTextSync: csvParseRows
};
*/

export default function csvBench(bench) {
  bench = bench.group('CSV Decode');

  bench = bench.addAsync(`CSVLoader#decode#${option.name}`, async () => {
    parseFile(SAMPLE_CSV, CSVLoader);
  });

  return bench;
}
