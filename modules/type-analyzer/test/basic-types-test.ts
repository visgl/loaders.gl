// loaders.gl, MIT license
// Forked from https://github.com/uber-web/type-analyzer under MIT license
// Copyright (c) 2017 Uber Technologies, Inc.

import test from 'tape-promise/tape';
import {EXAMPLE_STRING_NUMBER} from './data/fixtures/example-data';

import {computeColumnMetadata, ColumnMetadata} from '@loaders.gl/type-analyzer';

function mapArr(d) {
  return {col: d};
}

test('computeColumnMetadata: basic functionality', (t) => {
  t.deepEqual(computeColumnMetadata([]), [], 'doesnt freak out when you hand it empty data');
  t.deepEqual(computeColumnMetadata(undefined), [], 'doesnt freak out when you hand it nothing');

  const arr = [1, null, '3', undefined, -5].map(mapArr);
  t.deepEqual(
    computeColumnMetadata(arr)[0].type,
    'INT',
    'doesnt freak out when you hand it nulls and undefineds'
  );

  t.end();
});

test('computeColumnMetadata: boolean validator', (t) => {
  let arr: unknown[] = [];
  let columnMetadata: ColumnMetadata;

  arr = [1, 0, 1, 0, 1, 0].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(columnMetadata[0].type, 'INT', 'Inteprets ones and zeros as int, not booleans');

  arr = ['true', 'false', 'true', 'false', 'true', 'false'].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(columnMetadata[0].type, 'BOOLEAN', 'Inteprets true and false strings as booleans');

  arr = ['yes', 'no', 'yes', 'no', 'yes', 'no'].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(columnMetadata[0].type, 'BOOLEAN', 'Inteprets yes and no strings as booleans');

  t.end();
});

test('computeColumnMetadata: array validator', (t) => {
  let arr: unknown[] = [];
  let columnMetadata: ColumnMetadata;

  arr = [[1, 2, 3], [4, 5, 6], [7, 8, 9], ['1', 'b'], ['2', 3], ['he']].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(columnMetadata[0].type, 'ARRAY', 'Should interpret as Array, if data contain js array');

  arr = [[1, 2, 3], [4, 5, 6], [7, 8, 9], ['1', 'b'], ['2', 3], ['he']]
    .map((v) => JSON.stringify(v))
    .map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(
    columnMetadata[0].type,
    'ARRAY',
    'Should interpret as Array, if data contain js stringify array'
  );

  t.end();
});

test.skip('computeColumnMetadata: object validator', (t) => {
  let arr: unknown[] = [];
  let columnMetadata: ColumnMetadata;

  arr = [{a: 1}, [4, 5, 6], {b: 2}, {c: 3}, {d: 4}, {d: 5}].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(
    columnMetadata[0].type,
    'OBJECT',
    'Should interpret as Object, if data contain js object'
  );

  arr = [{a: 1}, [4, 5, 6], {b: 2}, {c: 3}, {d: 4}, {d: 5}]
    .map((v) => JSON.stringify(v))
    .map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(
    columnMetadata[0].type,
    'OBJECT',
    'Should interpret as Object, if data contain json string'
  );

  t.end();
});

test('computeColumnMetadata: number validator', (t) => {
  let arr: unknown[] = [];
  let columnMetadata: ColumnMetadata;

  arr = [1, '222,222', '-333,333,333', -4, '+5,000'].map(mapArr);
  t.equal(computeColumnMetadata(arr)[0].type, 'INT', 'Inteprets values as integers');

  arr = [NaN, NaN, NaN, 1, '222,222', '-333,333,333', -4, '+5,000'].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(columnMetadata[0].type, 'INT', 'Treats NaNs as nulls and inteprets values as integer');

  arr = ['-.1111', '+.2', '+3,333.3333', 444.4444, '5,555,555.5'].map(mapArr);
  t.equal(computeColumnMetadata(arr)[0].type, 'FLOAT', 'Inteprets values as floats');

  arr = [
    1,
    '222,222',
    '-333,333,333',
    -4,
    '+5,000',
    '-.1111',
    '+.2',
    '+3,333.3333',
    444.4444,
    '5,555,555.5'
  ].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(columnMetadata[0].type, 'FLOAT', 'Inteprets a mix of int and float values as floats');

  arr = [NaN, NaN, NaN, '-.1111', '+.2', '+3,333.3333', 444.4444, '5,555,555.5'].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(columnMetadata[0].type, 'FLOAT', 'Treats NaNs as nulls still inteprets values as floats');

  arr = ['$1', '$0.12', '$1.12', '$1,000.12', '$1,000.12'].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(columnMetadata[0].type, 'CURRENCY', 'Inteprets values as currency');
  arr = ['$1', '$0.12', '$1.12', '$1,000.12', '$1,000.12'].map(mapArr);
  t.equal(
    computeColumnMetadata(arr, [], {ignoredDataTypes: 'CURRENCY'})[0].type,
    'STRING',
    'Inteprets values with ignoredDataType:CURRENCY as string'
  );

  arr = ['10.12345%', '-10.222%', '+1,000.33%', '10.4%', '10.55%'].map(mapArr);
  t.equal(computeColumnMetadata(arr)[0].type, 'PERCENT', 'Inteprets values as percents');

  arr = ['\\N', '\\N', '\\N', '10.12345%', '-10.222%', '+1,000.33%', '10.4%', '10.55%'].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(
    columnMetadata[0].type,
    'PERCENT',
    'Ignore database nulls, and inteprets values as percents'
  );

  [2.3, '+4,000', '-5,023.234', '2.3e+2', '$23,203', '23.45%'].forEach(function loopAcrossExamples(
    ex
  ) {
    arr = [ex, ex, ex, ex, ex, ex].map(mapArr);
    t.equal(
      computeColumnMetadata(arr)[0].category,
      'MEASURE',
      `Inteprets sci or money valeus, eg ${ex} formatted values as numbers`
    );
  });

  arr = EXAMPLE_STRING_NUMBER.map(mapArr);
  t.equal(computeColumnMetadata(arr)[0].type, 'NUMBER', 'Inteprets values as numbers');
  t.end();

  arr = ['182891173641581479', '2e53', '1e16', 182891173641581479].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(columnMetadata[0].type, 'NUMBER', 'Inteprets large numeric values as numbers');

  arr = [
    1,
    '222,222',
    '-333,333,333',
    -4,
    '+5,000',
    '-.1111',
    '+.2',
    '+3,333.3333',
    444.4444,
    '5,555,555.5',
    '182891173641581479',
    '2e53',
    '1e16',
    182891173641581479
  ].map(mapArr);
  columnMetadata = computeColumnMetadata(arr);
  t.equal(columnMetadata[0].type, 'NUMBER', 'Inteprets a mix of numeric values as numbers');
});

test('computeColumnMetadata: string validator', (t) => {
  let arr: unknown[] = [];
  let columnMetadata: ColumnMetadata;

  ['Aasdaaaa', 'Bbdsabbb', 'Ccccc', 'Ddddd', 'EeeDe'].forEach(function loopAcrossExamples(ex) {
    arr = [ex, ex, ex, ex, ex, ex].map(mapArr);
    columnMetadata = computeColumnMetadata(arr);
    t.equal(columnMetadata[0].type, 'STRING', `Interprets ${ex} strings a string`);
  });

  ['San Francisco', 'New York', 'Chicago', 'Austin', 'Los Angeles'].forEach(
    function loopAcrossExamples(ex) {
      arr = [ex, ex, ex, ex, ex, ex].map(mapArr);
      columnMetadata = computeColumnMetadata(arr);
      t.equal(columnMetadata[0].type, 'STRING', `Interprets ${ex} strings a string`);
    }
  );
  [
    '13 Domestic Whole',
    '11 Domestic New',
    '13 Domestic Whole',
    '11 Domestic New',
    '21 International New'
  ].forEach(function loopAcrossExamples(ex) {
    arr = [ex, ex, ex, ex, ex, ex].map(mapArr);
    columnMetadata = computeColumnMetadata(arr);
    t.equal(columnMetadata[0].type, 'STRING', `Interprets ${ex} strings a string`);
  });

  arr = ['\\N', '\\N', '\\N', '\\N', '\\N'].map(mapArr);
  columnMetadata = computeColumnMetadata(arr, [], {keepUnknowns: true});
  t.equal(columnMetadata[0].type, 'STRING', 'Interprets as a string');

  t.end();
});

test('computeColumnMetadata: handling of unknown types', (t) => {
  let arr: unknown[] = [];
  let columnMetadata: ColumnMetadata;

  ['', null, undefined, ''].forEach(function loopAcrossExamples(ex) {
    arr = [ex, ex, ex, ex, ex, ex].map(mapArr);
    columnMetadata = computeColumnMetadata(arr, [], {keepUnknowns: true});
    t.equal(columnMetadata[0].type, 'STRING', `Interprets ${ex} as a string`);
  });

  t.end();
});
