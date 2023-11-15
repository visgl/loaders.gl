import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {load, loadInBatches, isAsyncIterable} from '@loaders.gl/core';
import {CSVLoader} from '../src/csv-loader';
import {getTableLength} from '@loaders.gl/schema';

// Small CSV Sample Files
const CSV_SAMPLE_URL = '@loaders.gl/csv/test/data/sample.csv';
const CSV_SAMPLE_VERY_LONG_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
const CSV_SAMPLE_URL_DUPLICATE_COLS = '@loaders.gl/csv/test/data/sample-duplicate-cols.csv';
const CSV_SAMPLE_URL_EMPTY_LINES = '@loaders.gl/csv/test/data/sample-empty-line.csv';
const CSV_STATES_URL = '@loaders.gl/csv/test/data/states.csv';
const CSV_INCIDENTS_URL_QUOTES = '@loaders.gl/csv/test/data/sf_incidents-small.csv';
const CSV_NO_HEADER_URL = '@loaders.gl/csv/test/data/numbers-100-no-header.csv';

const TSV_BRAZIL = '@loaders.gl/csv/test/data/tsv/brazil.tsv';

test('CSVLoader#loader conformance', (t) => {
  validateLoader(t, CSVLoader, 'CSVLoader');
  t.end();
});

test('CSVLoader#load(states.csv)', async (t) => {
  const table = await load(CSV_STATES_URL, CSVLoader);
  t.equal(getTableLength(table), 110);
  t.end();
});

// eslint-disable-next-line max-statements
test('CSVLoader#load', async (t) => {
  const table = await load(CSV_SAMPLE_URL, CSVLoader, {csv: {shape: 'object-row-table'}});
  t.assert(table.shape === 'object-row-table', 'Got correct table shape');
  if (table.shape === 'object-row-table') {
    t.is(getTableLength(table), 2, 'Got correct table size, correctly inferred no header');
    t.deepEqual(table.data[0], {column1: 'A', column2: 'B', column3: 1}, 'Got correct first row');
  }

  const table1 = await load(CSV_SAMPLE_URL, CSVLoader, {
    csv: {shape: 'object-row-table', header: true}
  });

  t.assert(table1.shape === 'object-row-table', 'Got correct table shape');
  if (table1.shape === 'object-row-table') {
    t.is(getTableLength(table1), 1, 'Got correct table size, forced first row as header');
    t.deepEqual(table1.data[0], {A: 'X', B: 'Y', 1: 2}, 'Got correct first row');
  }

  const table2 = await load(CSV_SAMPLE_URL, CSVLoader, {csv: {shape: 'array-row-table'}});
  t.assert(table2.shape === 'array-row-table', 'Got correct table shape');
  if (table2.shape === 'array-row-table') {
    t.is(getTableLength(table2), 2, 'Got correct table size');
    t.deepEqual(
      table2.data,
      [
        ['A', 'B', 1],
        ['X', 'Y', 2]
      ],
      'Got correct array content'
    );
  }

  const table3 = await load(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });
  t.assert(table3.shape === 'object-row-table', 'Got correct table shape');
  if (table3.shape === 'object-row-table') {
    t.is(getTableLength(table3), 2000, 'Got correct table size');
    t.deepEqual(
      table3.data[0],
      {
        TLD: 'ABC',
        'meaning of life': 42,
        placeholder: 'Lorem ipsum dolor sit'
      },
      'Got correct first row'
    );
  }

  const table4 = await load(CSV_INCIDENTS_URL_QUOTES, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });
  t.assert(table4.shape === 'object-row-table', 'Got correct table shape');
  if (table4.shape === 'object-row-table') {
    t.is(getTableLength(table4), 499, 'Got correct table size (csv with quotes)');
    t.deepEqual(
      table4.data[0],
      {
        IncidntNum: 160919032,
        Category: 'VANDALISM',
        Descript: 'MALICIOUS MISCHIEF, VANDALISM OF VEHICLES',
        DayOfWeek: 'Friday',
        DateTime: '11/11/16 7:00',
        PdDistrict: 'MISSION',
        Address: '1400 Block of UTAH ST',
        Resolution: 'NONE',
        Longitude: -122.4052518,
        Latitude: 37.75152496
      },
      'Got correct first row (csv with quotes)'
    );
  }
  t.end();
});

test('CSVLoader#load(sample.csv, duplicate column names)', async (t) => {
  const table = await load(CSV_SAMPLE_URL_DUPLICATE_COLS, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });
  t.assert(table.shape === 'object-row-table', 'Got correct table shape');
  if (table.shape === 'object-row-table') {
    t.is(getTableLength(table), 3, 'Got correct table size');
    t.deepEqual(
      table.data,
      [
        {A: 'x', B: 1, 'A.1': 'y', 'A.1.1': 'z', 'A.2': 'w', 'B.1': 2},
        {A: 'y', B: 29, 'A.1': 'z', 'A.1.1': 'y', 'A.2': 'w', 'B.1': 19},
        {A: 'x', B: 1, 'A.1': 'y', 'A.1.1': 'z', 'A.2': 'w', 'B.1': 2}
      ],
      'dataset should be parsed with the corrected duplicate headers'
    );
  }

  const table2 = await load(CSV_SAMPLE_URL_DUPLICATE_COLS, CSVLoader, {
    csv: {shape: 'array-row-table', header: false}
  });
  t.assert(table2.shape === 'array-row-table', 'Got correct table shape');
  if (table2.shape === 'array-row-table') {
    t.is(getTableLength(table2), 4, 'Got correct table size');
    t.deepEqual(
      table2.data,
      [
        ['A', 'B', 'A', 'A.1', 'A', 'B'],
        ['x', 1, 'y', 'z', 'w', 2],
        ['y', 29, 'z', 'y', 'w', 19],
        ['x', 1, 'y', 'z', 'w', 2]
      ],
      'dataset should be parsed correctly as the array rows'
    );
  }
});

// TSV

test('CSVLoader#load(brazil.tsv)', async (t) => {
  const table = await load(TSV_BRAZIL, CSVLoader);
  t.equal(getTableLength(table), 10);
  t.end();
});

// loadInBatches

test('CSVLoader#loadInBatches(sample.csv, columns)', async (t) => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    csv: {
      shape: 'columnar-table'
    }
  });
  t.ok(isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, 2, 'Got correct batch size');

    t.equal(batch.shape, 'columnar-table', 'Got correct batch shape');
    if (batch.shape === 'columnar-table') {
      t.ok(validateColumn(batch.data.column1, batch.length, 'string'), 'column 0 valid');
      t.ok(validateColumn(batch.data.column2, batch.length, 'string'), 'column 1 valid');
      t.ok(validateColumn(batch.data.column3, batch.length, 'float'), 'column 2 valid');
    }

    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');
  t.end();
});

test('CSVLoader#loadInBatches(sample-very-long.csv, columns)', async (t) => {
  const batchSize = 25;
  const iterator = await loadInBatches(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {
    csv: {
      shape: 'columnar-table'
    },
    batchSize
  });

  let batchCount = 0;
  for await (const batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.length, batchSize, 'Got correct batch size');

    t.equal(batch.shape, 'columnar-table', 'Got correct batch shape');
    if (batch.shape === 'columnar-table') {
      t.ok(validateColumn(batch.data.TLD, batch.length, 'string'), 'column TLD valid');
      t.ok(
        validateColumn(batch.data['meaning of life'], batch.length, 'float'),
        'column meaning of life valid'
      );
      t.ok(
        validateColumn(batch.data.placeholder, batch.length, 'string'),
        'column placeholder valid'
      );
    }
    batchCount++;
    if (batchCount === 5) {
      break;
    }
  }
  t.equal(batchCount, 5, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(sample.csv, array-rows)', async (t) => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {shape: 'array-row-table'});

  let batchCount = 0;
  for await (const batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.shape, 'array-row-table', 'Got correct batch shape');
    if (batch.shape === 'array-row-table') {
      t.equal(batch.length, 2, 'Got correct batch size');
      t.deepEqual(batch.data[0], ['A', 'B', 1], 'Got correct first row');
    }
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(sample.csv, object-rows)', async (t) => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });

  let batchCount = 0;
  for await (const batch of iterator) {
    t.equal(batch.shape, 'object-row-table', 'Got correct batch shape');
    if (batch.shape === 'object-row-table') {
      t.comment(
        `BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`
      );
      t.equal(batch.length, 2, 'Got correct batch size');
      t.deepEqual(batch.data[0], {column1: 'A', column2: 'B', column3: 1}, 'Got correct first row');
    }
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(sample.csv, arrays, header)', async (t) => {
  let iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    csv: {
      shape: 'array-row-table',
      header: false
    }
  });

  let batchCount = 0;
  for await (const batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.shape, 'array-row-table', 'Got correct batch shape');
    if (batch.shape === 'array-row-table') {
      t.equal(batch.length, 2, 'Got correct batch size');
      t.deepEqual(batch.data[0], ['A', 'B', 1], 'Got correct first row');
    }
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    csv: {header: false, shape: 'object-row-table'}
  });

  batchCount = 0;
  for await (const batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.shape, 'object-row-table', 'Got correct batch shape');
    if (batch.shape === 'object-row-table') {
      t.equal(batch.length, 2, 'Got correct batch size');
      t.deepEqual(batch.data[0], {column1: 'A', column2: 'B', column3: 1}, 'Got correct first row');
    }
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(no header, row format, prefix)', async (t) => {
  const batchSize = 25;
  const iterator = await loadInBatches(CSV_NO_HEADER_URL, CSVLoader, {
    csv: {
      shape: 'object-row-table',
      columnPrefix: 'column_'
    },
    batchSize
  });

  for await (const batch of iterator) {
    t.equal(batch.shape, 'object-row-table', 'Got correct batch shape');
    if (batch.shape === 'object-row-table') {
      // t.comment(JSON.stringify(batch.data[0]));
      t.ok(batch.data[0].column_1, 'first column has a value');
      t.ok(batch.data[0].column_2, 'second column has a value value');
      t.ok(batch.data[0].column_3, 'third column has a value');
    }
  }

  t.end();
});

test('CSVLoader#loadInBatches(sample.csv, no dynamicTyping)', async (t) => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    csv: {
      shape: 'columnar-table',
      dynamicTyping: false,
      // We explicitly set the header, since without dynamicTyping the first
      // row might be detected as a header (all values would be string)
      header: false
    }
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    t.equal(batch.shape, 'columnar-table', 'Got correct batch shape');
    if (batch.shape === 'columnar-table') {
      t.equal(getTableLength(batch), 2, 'Got correct batch size');

      t.ok(validateColumn(batch.data.column1, batch.length, 'string'), 'column 0 valid');
      t.ok(validateColumn(batch.data.column2, batch.length, 'string'), 'column 1 valid');
      t.ok(
        validateColumn(batch.data.column3, batch.length, 'string'),
        'column 2 is a string and is valid'
      );
    }

    rowCount = rowCount + batch.length;
  }
  t.equal(rowCount, 2, 'Correct number of rows received');
  t.end();
});

test('CSVLoader#loadInBatches(sample.csv, duplicate columns)', async (t) => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL_DUPLICATE_COLS, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });

  const rows: any[] = [];

  for await (const batch of iterator) {
    if (batch.shape === 'object-row-table') {
      rows.push(...batch.data);
    }
  }

  t.is(rows.length, 3, 'Got correct table size');
  t.deepEqual(
    rows,
    [
      {A: 'x', B: 1, 'A.1': 'y', 'A.1.1': 'z', 'A.2': 'w', 'B.1': 2},
      {A: 'y', B: 29, 'A.1': 'z', 'A.1.1': 'y', 'A.2': 'w', 'B.1': 19},
      {A: 'x', B: 1, 'A.1': 'y', 'A.1.1': 'z', 'A.2': 'w', 'B.1': 2}
    ],
    'dataset should be parsed with the corrected duplicate headers'
  );

  const iterator2 = await loadInBatches(CSV_SAMPLE_URL_DUPLICATE_COLS, CSVLoader, {
    csv: {shape: 'array-row-table'}
  });

  const rows2: any[] = [];

  for await (const batch of iterator2) {
    if (batch.shape === 'array-row-table') {
      rows2.push(...batch.data);
    }
  }

  t.is(rows2.length, 3, 'Got correct table size');
  t.deepEqual(
    rows2,
    [
      ['x', 1, 'y', 'z', 'w', 2],
      ['y', 29, 'z', 'y', 'w', 19],
      ['x', 1, 'y', 'z', 'w', 2]
    ],
    'dataset should be parsed correctly as array rows'
  );
});

test('CSVLoader#loadInBatches(skipEmptyLines)', async (t) => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL_EMPTY_LINES, CSVLoader, {
    csv: {shape: 'object-row-table', skipEmptyLines: true}
  });

  const rows: unknown[] = [];

  for await (const batch of iterator) {
    t.equal(batch.shape, 'object-row-table', 'Got correct batch shape');
    if (batch.shape === 'object-row-table') {
      rows.push(...batch.data);
    }
  }

  t.is(rows.length, 2, 'Got correct table size');
  t.deepEqual(
    rows,
    [
      {A: 'x', B: 1, C: 'some text'},
      {A: 'y', B: 2, C: 'other text'}
    ],
    'dataset should be parsed with the correct content'
  );
  t.end();
});

test('CSVLoader#loadInBatches(csv with quotes)', async (t) => {
  const iterator = await loadInBatches(CSV_INCIDENTS_URL_QUOTES, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });

  const rows: unknown[] = [];
  for await (const batch of iterator) {
    t.equal(batch.shape, 'object-row-table', 'Got correct batch shape');
    if (batch.shape === 'object-row-table') {
      rows.push(...batch.data);
    }
  }
  t.is(rows.length, 499, 'Got the correct table size');
  t.deepEqual(
    rows[0],
    {
      IncidntNum: 160919032,
      Category: 'VANDALISM',
      Descript: 'MALICIOUS MISCHIEF, VANDALISM OF VEHICLES',
      DayOfWeek: 'Friday',
      DateTime: '11/11/16 7:00',
      PdDistrict: 'MISSION',
      Address: '1400 Block of UTAH ST',
      Resolution: 'NONE',
      Longitude: -122.4052518,
      Latitude: 37.75152496
    },
    'Got correct first row (csv with quotes)'
  );
  t.end();
});

function validateColumn(column, length, type) {
  if (column.length !== length) {
    return `column length should be ${length}`;
  }
  let validator: Function | null = null;
  switch (type) {
    case 'string':
      validator = (d) => typeof d === 'string';
      break;

    case 'float':
      validator = (d) => Number.isFinite(d);
      break;

    default:
      return null;
  }

  return column.every(validator) ? true : `column elements are not all ${type}s`;
}
