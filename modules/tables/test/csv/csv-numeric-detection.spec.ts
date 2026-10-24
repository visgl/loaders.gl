// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import Papa from '../../src/csv/papaparse/papaparse';
import {
  parseRawArrowCSVASCIIText,
  parseRawArrowCSVBytes
} from '../../src/csv/lib/parsers/parse-raw-arrow-csv-bytes';
import {parseRawArrowCSVText} from '../../src/csv/lib/parsers/parse-csv-to-arrow';

test.each([
  ['0', 0],
  ['-12', -12],
  ['.5', 0.5],
  ['-.5', -0.5],
  ['12.', 12],
  ['12.25', 12.25],
  ['1.e+2', 100],
  [' .5E-2 ', 0.005],
  ['+1', '+1'],
  ['.', '.'],
  ['1e+', '1e+'],
  ['1.2.3', '1.2.3']
])('CSV numeric detection preserves the grammar for %s', (input, expected) => {
  const result = Papa.parse(`"${input}"`, {dynamicTyping: true, delimiter: ','});
  expect(result.data).toEqual([[expected]]);
});

test.each([
  'x',
  'e+',
  '.0x'
])('CSV detection handles long near-numbers ending in %s', async suffix => {
  // These failing numeric candidates trigger quadratic backtracking in the old expression.
  const header = '0'.repeat(16384) + suffix;
  const csvText = `${header},label\nvalue,item`;
  const options = {header: 'auto' as const, dynamicTyping: true, delimiter: ','};
  const asciiTable = parseRawArrowCSVASCIIText(csvText, options)!;
  const byteTable = parseRawArrowCSVBytes(new TextEncoder().encode(csvText).buffer, options)!;
  const fallbackTable = await parseRawArrowCSVText(csvText, {
    csv: {...options, skipEmptyLines: true, skipEmptyLinesIsExplicit: true}
  });
  for (const table of [asciiTable, byteTable, fallbackTable]) {
    expect(table.schema.fields.map(field => field.name)).toEqual([header, 'label']);
    expect(table.data.toArray().map(row => row.toJSON())).toEqual([
      {[header]: 'value', label: 'item'}
    ]);
  }
  expect(Papa.parse(`"${header}"`, {dynamicTyping: true, delimiter: ','}).data).toEqual([[header]]);
});
