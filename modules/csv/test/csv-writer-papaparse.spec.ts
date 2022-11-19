// This is a fork of papaparse under MIT License
// https://github.com/mholt/PapaParse
/* eslint-disable */

/* @license
Papa Parse
v5.0.0-beta.0
https://github.com/mholt/PapaParse
License: MIT
*/

// @ts-nocheck

/* eslint-disable quotes */
import test from 'tape-promise/tape';
import Papa from '@loaders.gl/csv/libs/papaparse';

// import {isBrowser, load} from '@loaders.gl/core';
// import {parseAsIterator, parseAsAsyncIterator} from '@loaders.gl/core';

// Tests for Papa.unparse() function (JSON to CSV)
var UNPARSE_TESTS = [
  {
    description: 'A simple row',
    notes: 'Comma should be default delimiter',
    input: [['A', 'b', 'c']],
    expected: 'A,b,c'
  },
  {
    description: 'Two rows',
    input: [
      ['A', 'b', 'c'],
      ['d', 'E', 'f']
    ],
    expected: 'A,b,c\r\nd,E,f'
  },
  {
    description: 'Data with quotes',
    input: [
      ['a', '"b"', 'c'],
      ['"d"', 'e', 'f']
    ],
    expected: 'a,"""b""",c\r\n"""d""",e,f'
  },
  {
    description: 'Data with newlines',
    input: [
      ['a', 'b\nb', 'c'],
      ['d', 'e', 'f\r\nf']
    ],
    expected: 'a,"b\nb",c\r\nd,e,"f\r\nf"'
  },
  {
    description: 'Array of objects (header row)',
    input: [
      {Col1: 'a', Col2: 'b', Col3: 'c'},
      {Col1: 'd', Col2: 'e', Col3: 'f'}
    ],
    expected: 'Col1,Col2,Col3\r\na,b,c\r\nd,e,f'
  },
  {
    description: 'With header row, missing a field in a row',
    input: [
      {Col1: 'a', Col2: 'b', Col3: 'c'},
      {Col1: 'd', Col3: 'f'}
    ],
    expected: 'Col1,Col2,Col3\r\na,b,c\r\nd,,f'
  },
  {
    description: 'With header row, with extra field in a row',
    notes: 'Extra field should be ignored; first object in array dictates header row',
    input: [
      {Col1: 'a', Col2: 'b', Col3: 'c'},
      {Col1: 'd', Col2: 'e', Extra: 'g', Col3: 'f'}
    ],
    expected: 'Col1,Col2,Col3\r\na,b,c\r\nd,e,f'
  },
  {
    description: 'Specifying column names and data separately',
    input: {
      fields: ['Col1', 'Col2', 'Col3'],
      data: [
        ['a', 'b', 'c'],
        ['d', 'e', 'f']
      ]
    },
    expected: 'Col1,Col2,Col3\r\na,b,c\r\nd,e,f'
  },
  {
    description: 'Specifying column names only (no data)',
    notes:
      'Papa should add a data property that is an empty array to prevent errors (no copy is made)',
    input: {fields: ['Col1', 'Col2', 'Col3']},
    expected: 'Col1,Col2,Col3'
  },
  {
    description: 'Specifying data only (no field names), improperly',
    notes:
      'A single array for a single row is wrong, but it can be compensated.<br>Papa should add empty fields property to prevent errors.',
    input: {data: ['abc', 'd', 'ef']},
    expected: 'abc,d,ef'
  },
  {
    description: 'Specifying data only (no field names), properly',
    notes:
      'An array of arrays, even if just a single row.<br>Papa should add empty fields property to prevent errors.',
    input: {data: [['a', 'b', 'c']]},
    expected: 'a,b,c'
  },
  {
    description: 'Custom delimiter (semicolon)',
    input: [
      ['A', 'b', 'c'],
      ['d', 'e', 'f']
    ],
    config: {delimiter: ';'},
    expected: 'A;b;c\r\nd;e;f'
  },
  {
    description: 'Custom delimiter (tab)',
    input: [
      ['Ab', 'cd', 'ef'],
      ['g', 'h', 'ij']
    ],
    config: {delimiter: '\t'},
    expected: 'Ab\tcd\tef\r\ng\th\tij'
  },
  {
    description: 'Custom delimiter (ASCII 30)',
    input: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f']
    ],
    config: {delimiter: RECORD_SEP},
    expected: 'a' + RECORD_SEP + 'b' + RECORD_SEP + 'c\r\nd' + RECORD_SEP + 'e' + RECORD_SEP + 'f'
  },
  {
    description: 'Custom delimiter (Multi-character)',
    input: [
      ['A', 'b', 'c'],
      ['d', 'e', 'f']
    ],
    config: {delimiter: ', '},
    expected: 'A, b, c\r\nd, e, f'
  },
  {
    description: 'Bad delimiter (\\n)',
    notes: 'Should default to comma',
    input: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f']
    ],
    config: {delimiter: '\n'},
    expected: 'a,b,c\r\nd,e,f'
  },
  {
    description: 'Custom line ending (\\r)',
    input: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f']
    ],
    config: {newline: '\r'},
    expected: 'a,b,c\rd,e,f'
  },
  {
    description: 'Custom line ending (\\n)',
    input: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f']
    ],
    config: {newline: '\n'},
    expected: 'a,b,c\nd,e,f'
  },
  {
    description: 'Custom, but strange, line ending ($)',
    input: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f']
    ],
    config: {newline: '$'},
    expected: 'a,b,c$d,e,f'
  },
  {
    description: 'Force quotes around all fields',
    input: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f']
    ],
    config: {quotes: true},
    expected: '"a","b","c"\r\n"d","e","f"'
  },
  {
    description: 'Force quotes around all fields (with header row)',
    input: [
      {Col1: 'a', Col2: 'b', Col3: 'c'},
      {Col1: 'd', Col2: 'e', Col3: 'f'}
    ],
    config: {quotes: true},
    expected: '"Col1","Col2","Col3"\r\n"a","b","c"\r\n"d","e","f"'
  },
  {
    description: 'Force quotes around certain fields only',
    input: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f']
    ],
    config: {quotes: [true, false, true]},
    expected: '"a",b,"c"\r\n"d",e,"f"'
  },
  {
    description: 'Force quotes around certain fields only (with header row)',
    input: [
      {Col1: 'a', Col2: 'b', Col3: 'c'},
      {Col1: 'd', Col2: 'e', Col3: 'f'}
    ],
    config: {quotes: [true, false, true]},
    expected: '"Col1",Col2,"Col3"\r\n"a",b,"c"\r\n"d",e,"f"'
  },
  {
    description: 'Empty input',
    input: [],
    expected: ''
  },
  {
    description: 'Mismatched field counts in rows',
    input: [['a', 'b', 'c'], ['d', 'e'], ['f']],
    expected: 'a,b,c\r\nd,e\r\nf'
  },
  {
    description: 'JSON null is treated as empty value',
    input: [{Col1: 'a', Col2: null, Col3: 'c'}],
    expected: 'Col1,Col2,Col3\r\na,,c'
  },
  {
    description: 'Custom quote character (single quote)',
    input: [['a,d', 'b', 'c']],
    config: {quoteChar: "'"},
    expected: "'a,d',b,c"
  },
  {
    description: "Don't print header if header:false option specified",
    input: [
      {Col1: 'a', Col2: 'b', Col3: 'c'},
      {Col1: 'd', Col2: 'e', Col3: 'f'}
    ],
    config: {header: false},
    expected: 'a,b,c\r\nd,e,f'
  },
  {
    description: 'Date objects are exported in its ISO representation',
    input: [
      {date: new Date('2018-05-04T21:08:03.269Z'), 'not adate': 16},
      {date: new Date('Tue May 08 2018 08:20:22 GMT-0700 (PDT)'), 'not adate': 32}
    ],
    expected: 'date,not a date\r\n2018-05-04T21:08:03.269Z,16\r\n2018-05-08T15:20:22.000Z,32'
  },
  {
    description: 'Returns empty rows when empty rows are passed and skipEmptyLines is false',
    input: [[null, ' '], [], ['1', '2']],
    config: {skipEmptyLines: false},
    expected: '," "\r\n\r\n1,2'
  },
  {
    description: 'Returns without empty rows when skipEmptyLines is true',
    input: [[null, ' '], [], ['1', '2']],
    config: {skipEmptyLines: true},
    expected: '," "\r\n1,2'
  },
  {
    description: "Returns without rows with no content when skipEmptyLines is 'greedy'",
    input: [[null, ' '], [], ['1', '2']],
    config: {skipEmptyLines: 'greedy'},
    expected: '1,2'
  },
  {
    description:
      'Returns empty rows when empty rows are passed and skipEmptyLines is false with headers',
    input: [{a: null, b: ' '}, {}, {a: '1', b: '2'}],
    config: {skipEmptyLines: false, header: true},
    expected: 'a,b\r\n," "\r\n\r\n1,2'
  },
  {
    description: 'Returns without empty rows when skipEmptyLines is true with headers',
    input: [{a: null, b: ' '}, {}, {a: '1', b: '2'}],
    config: {skipEmptyLines: true, header: true},
    expected: 'a,b\r\n," "\r\n1,2'
  },
  {
    description:
      "Returns without rows with no content when skipEmptyLines is 'greedy' with headers",
    input: [{a: null, b: ' '}, {}, {a: '1', b: '2'}],
    config: {skipEmptyLines: 'greedy', header: true},
    expected: 'a,b\r\n1,2'
  },
  {
    description: 'Column option used to manually specify keys',
    notes:
      'Should not throw any error when attempting to serialize key not present in object. Columns are different than keys of the first object. When an object is missing a key then the serialized value should be an empty string.',
    input: [{a: 1, b: '2'}, {}, {a: 3, d: 'd', c: 4}],
    config: {columns: ['a', 'b', 'c']},
    expected: 'a,b,c\r\n1,2,\r\n\r\n3,,4'
  },
  {
    description: 'Use different escapeChar',
    input: [{a: 'foo', b: '"quoted"'}],
    config: {header: false, escapeChar: '\\'},
    expected: 'foo,"\\"quoted\\""'
  },
  {
    description: 'test defeault escapeChar',
    input: [{a: 'foo', b: '"quoted"'}],
    config: {header: false},
    expected: 'foo,"""quoted"""'
  }
];

test('Unparse Tests', (t) => {
  function generateTest(test) {
    (test.disabled ? test.skip : test)(test.description, () => {
      var actual;

      try {
        actual = Papa.unparse(test.input, test.config);
      } catch (e) {
        if (e instanceof Error) {
          throw e;
        }
        actual = e;
      }

      t.strictEqual(actual, test.expected);
    });
  }

  for (var i = 0; i < UNPARSE_TESTS.length; i++) {
    generateTest(UNPARSE_TESTS[i]);
  }
});
