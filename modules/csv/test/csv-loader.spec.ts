import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {
  load,
  loadInBatches,
  isAsyncIterable,
  parse,
  parseInBatches,
  preload,
  preloadSync
} from '@loaders.gl/core';
import {CSVLoader, CSVWorkerLoader} from '@loaders.gl/csv';
import {
  CSVLoader as BundledCSVLoader,
  CSVWorkerLoader as BundledCSVWorkerLoader
} from '@loaders.gl/csv/bundled';
import {
  CSVLoader as UnbundledCSVLoader,
  CSVWorkerLoader as UnbundledCSVWorkerLoader
} from '@loaders.gl/csv/unbundled';
import * as csv from '@loaders.gl/csv';
import {getGeoMetadata} from '@loaders.gl/gis';
import {getTableLength} from '@loaders.gl/schema-utils';
// Small CSV Sample Files
const CSV_SAMPLE_URL = '@loaders.gl/csv/test/data/sample.csv';
const CSV_SAMPLE_VERY_LONG_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
const CSV_SAMPLE_URL_DUPLICATE_COLS = '@loaders.gl/csv/test/data/sample-duplicate-cols.csv';
const CSV_SAMPLE_URL_EMPTY_LINES = '@loaders.gl/csv/test/data/sample-empty-line.csv';
const CSV_STATES_URL = '@loaders.gl/csv/test/data/states.csv';
const CSV_INCIDENTS_URL_QUOTES = '@loaders.gl/csv/test/data/sf_incidents-small.csv';
const CSV_NO_HEADER_URL = '@loaders.gl/csv/test/data/numbers-100-no-header.csv';
const CSV_GEOSPATIAL_WKT_URL = '@loaders.gl/csv/test/data/geospatial-points-wkt.csv';
const CSV_GEOSPATIAL_WKB_URL = '@loaders.gl/csv/test/data/geospatial-points-wkb.csv';
const TSV_BRAZIL = '@loaders.gl/csv/test/data/tsv/brazil.tsv';
test('CSVLoader#loader conformance', () => {
  validateLoader(CSVLoader, 'CSVLoader');
});
test('CSV root loaders expose metadata loaders and deprecated WorkerLoader aliases', () => {
  expect(typeof CSVLoader.preload, 'CSVLoader exposes preload').toBe('function');
  expect('parse' in CSVLoader, 'CSVLoader does not expose parse').toBeFalsy();
  expect('parseInBatches' in CSVLoader, 'CSVLoader does not expose parseInBatches').toBeFalsy();
  expect(CSVWorkerLoader, 'CSVWorkerLoader aliases CSVLoader').toBe(CSVLoader);
  expect(
    'CSVLoaderWithParser' in csv,
    'root package does not export CSVLoaderWithParser'
  ).toBeFalsy();
});
test('CSV bundled loaders expose parser methods and deprecated WorkerLoader aliases', () => {
  expect(typeof BundledCSVLoader.parse, 'bundled CSVLoader exposes parse').toBe('function');
  expect(typeof BundledCSVLoader.parseInBatches, 'bundled CSVLoader exposes parseInBatches').toBe(
    'function'
  );
  expect(BundledCSVWorkerLoader, 'bundled CSVWorkerLoader aliases CSVLoader').toBe(
    BundledCSVLoader
  );
});
test('CSV unbundled metadata loaders expose preload and deprecated WorkerLoader aliases', async () => {
  expect(preloadSync(UnbundledCSVLoader), 'unbundled CSVLoader is not preloaded initially').toBe(
    null
  );
  expect(typeof UnbundledCSVLoader.preload, 'unbundled CSVLoader exposes preload').toBe('function');
  expect('parse' in UnbundledCSVLoader, 'unbundled CSVLoader does not expose parse').toBeFalsy();
  expect(
    'parseSync' in UnbundledCSVLoader,
    'unbundled CSVLoader does not expose parseSync'
  ).toBeFalsy();
  expect(
    'parseInBatches' in UnbundledCSVLoader,
    'unbundled CSVLoader does not expose parseInBatches'
  ).toBeFalsy();
  expect(UnbundledCSVWorkerLoader, 'unbundled CSVWorkerLoader aliases CSVLoader').toBe(
    UnbundledCSVLoader
  );
  const parsedTable = await parse('city,population\nParis,2148000', UnbundledCSVLoader, {
    csv: {header: true, shape: 'object-row-table'}
  });
  expect(parsedTable.shape, 'parse works with unbundled CSVLoader').toBe('object-row-table');
  if (parsedTable.shape === 'object-row-table') {
    expect(parsedTable.data[0]).toEqual({city: 'Paris', population: 2148000});
  }
  const preloadedLoader = await preload(UnbundledCSVLoader);
  expect(typeof preloadedLoader.parse, 'preload returns parser-bearing CSV loader').toBe(
    'function'
  );
  expect(preloadSync(UnbundledCSVLoader), 'preloadSync returns cached CSV loader').toBe(
    preloadedLoader
  );
});
test('CSVLoader#load(states.csv)', async () => {
  const table = await load(CSV_STATES_URL, CSVLoader);
  expect(getTableLength(table)).toBe(110);
});
test('CSVLoader#load(numbers-100.csv, shape: arrow-table)', async () => {
  const table = await load(CSV_NO_HEADER_URL, CSVLoader, {
    core: {worker: false},
    csv: {header: false, shape: 'arrow-table'}
  });
  expect(table.shape, 'Got correct table shape').toBe('arrow-table');
  expect(table.data.numRows, 'Got correct row count').toBe(100);
  expect(table.data.getChildAt(0)?.get(0), 'Got correct first value').toBe(1);
});
test('CSVLoader#load(geospatial-points-wkt.csv, detectGeometryColumns)', async () => {
  const table = await load(CSV_GEOSPATIAL_WKT_URL, CSVLoader, {
    csv: {shape: 'object-row-table', detectGeometryColumns: true}
  });
  expect(table.shape, 'Got correct table shape').toBe('object-row-table');
  if (table.shape === 'object-row-table') {
    const geometryField = table.schema?.fields.find(field => field.name === 'geometry');
    const geoMetadata = getGeoMetadata(table.schema?.metadata);
    expect(geometryField?.type, 'WKT geometry field is converted to a binary column').toBe(
      'binary'
    );
    expect(
      geometryField?.metadata?.['ARROW:extension:name'],
      'WKT geometry field is annotated as WKB'
    ).toBe('geoarrow.wkb');
    expect(geoMetadata?.primary_column, 'Geo metadata primary column is set').toBe('geometry');
    expect(geoMetadata?.columns.geometry.encoding, 'Geo metadata includes WKB encoding').toBe(
      'wkb'
    );
    expect(
      geoMetadata?.columns.geometry.geometry_types[0],
      'Geo metadata includes inferred geometry type'
    ).toBe('Point');
    expect(
      table.data[0].geometry instanceof Uint8Array,
      'WKT geometry value is encoded as WKB'
    ).toBeTruthy();
  }
});
test('CSVLoader#load(geospatial-points-wkt.csv, detectGeometryColumns, source geometry)', async () => {
  const table = await load(CSV_GEOSPATIAL_WKT_URL, CSVLoader, {
    csv: {shape: 'object-row-table', detectGeometryColumns: true, geometryEncoding: 'source'}
  });
  expect(table.shape, 'Got correct table shape').toBe('object-row-table');
  if (table.shape === 'object-row-table') {
    const geometryField = table.schema?.fields.find(field => field.name === 'geometry');
    const geoMetadata = getGeoMetadata(table.schema?.metadata);
    expect(geometryField?.type, 'WKT geometry field is a string column').toBe('utf8');
    expect(
      geometryField?.metadata?.['ARROW:extension:name'],
      'WKT geometry field is annotated'
    ).toBe('geoarrow.wkt');
    expect(geoMetadata?.columns.geometry.encoding, 'Geo metadata includes WKT encoding').toBe(
      'wkt'
    );
    expect(table.data[0].geometry, 'WKT geometry value is preserved').toBe(
      'POINT (-122.3933 37.7955)'
    );
  }
});
test('CSVLoader#load(geospatial-points-wkb.csv, detectGeometryColumns)', async () => {
  const table = await load(CSV_GEOSPATIAL_WKB_URL, CSVLoader, {
    csv: {shape: 'array-row-table', detectGeometryColumns: true}
  });
  expect(table.shape, 'Got correct table shape').toBe('array-row-table');
  if (table.shape === 'array-row-table') {
    const wkbField = table.schema?.fields.find(field => field.name === 'wkb');
    const geoMetadata = getGeoMetadata(table.schema?.metadata);
    expect(wkbField?.type, 'WKB geometry field is a binary column').toBe('binary');
    expect(wkbField?.metadata?.['ARROW:extension:name'], 'WKB geometry field is annotated').toBe(
      'geoarrow.wkb'
    );
    expect(geoMetadata?.columns.wkb.encoding, 'Geo metadata includes WKB encoding').toBe('wkb');
    expect(table.data[0][2] instanceof Uint8Array, 'WKB geometry value is decoded').toBeTruthy();
  }
});
// eslint-disable-next-line max-statements
test('CSVLoader#load', async () => {
  const table = await load(CSV_SAMPLE_URL, CSVLoader, {csv: {shape: 'object-row-table'}});
  expect(table.shape, 'Got correct table shape').toBe('object-row-table');
  if (table.shape === 'object-row-table') {
    expect(getTableLength(table), 'Got correct table size, correctly inferred no header').toBe(2);
    expect(table.data[0], 'Got correct first row').toEqual({
      column1: 'A',
      column2: 'B',
      column3: 1
    });
  }
  const table1 = await load(CSV_SAMPLE_URL, CSVLoader, {
    csv: {shape: 'object-row-table', header: true}
  });
  expect(table1.shape, 'Got correct table shape').toBe('object-row-table');
  if (table1.shape === 'object-row-table') {
    expect(getTableLength(table1), 'Got correct table size, forced first row as header').toBe(1);
    expect(table1.data[0], 'Got correct first row').toEqual({A: 'X', B: 'Y', 1: 2});
  }
  const table2 = await load(CSV_SAMPLE_URL, CSVLoader, {csv: {shape: 'array-row-table'}});
  expect(table2.shape, 'Got correct table shape').toBe('array-row-table');
  if (table2.shape === 'array-row-table') {
    expect(getTableLength(table2), 'Got correct table size').toBe(2);
    expect(table2.data, 'Got correct array content').toEqual([
      ['A', 'B', 1],
      ['X', 'Y', 2]
    ]);
  }
  const table3 = await load(CSV_SAMPLE_VERY_LONG_URL, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });
  expect(table3.shape, 'Got correct table shape').toBe('object-row-table');
  if (table3.shape === 'object-row-table') {
    expect(getTableLength(table3), 'Got correct table size').toBe(2000);
    expect(table3.data[0], 'Got correct first row').toEqual({
      TLD: 'ABC',
      'meaning of life': 42,
      placeholder: 'Lorem ipsum dolor sit'
    });
  }
  const table4 = await load(CSV_INCIDENTS_URL_QUOTES, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });
  expect(table4.shape, 'Got correct table shape').toBe('object-row-table');
  if (table4.shape === 'object-row-table') {
    expect(getTableLength(table4), 'Got correct table size (csv with quotes)').toBe(499);
    expect(table4.data[0], 'Got correct first row (csv with quotes)').toEqual({
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
    });
  }
});
test('CSVLoader#load(sample.csv, duplicate column names)', async () => {
  const table = await load(CSV_SAMPLE_URL_DUPLICATE_COLS, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });
  expect(table.shape, 'Got correct table shape').toBe('object-row-table');
  if (table.shape === 'object-row-table') {
    expect(getTableLength(table), 'Got correct table size').toBe(3);
    expect(table.data, 'dataset should be parsed with the corrected duplicate headers').toEqual([
      {A: 'x', B: 1, 'A.1': 'y', 'A.1.1': 'z', 'A.2': 'w', 'B.1': 2},
      {A: 'y', B: 29, 'A.1': 'z', 'A.1.1': 'y', 'A.2': 'w', 'B.1': 19},
      {A: 'x', B: 1, 'A.1': 'y', 'A.1.1': 'z', 'A.2': 'w', 'B.1': 2}
    ]);
  }
  const table2 = await load(CSV_SAMPLE_URL_DUPLICATE_COLS, CSVLoader, {
    csv: {shape: 'array-row-table', header: false}
  });
  expect(table2.shape, 'Got correct table shape').toBe('array-row-table');
  if (table2.shape === 'array-row-table') {
    expect(getTableLength(table2), 'Got correct table size').toBe(4);
    expect(table2.data, 'dataset should be parsed correctly as the array rows').toEqual([
      ['A', 'B', 'A', 'A.1', 'A', 'B'],
      ['x', 1, 'y', 'z', 'w', 2],
      ['y', 29, 'z', 'y', 'w', 19],
      ['x', 1, 'y', 'z', 'w', 2]
    ]);
  }
});
// TSV
test('CSVLoader#load(brazil.tsv)', async () => {
  const table = await load(TSV_BRAZIL, CSVLoader);
  expect(getTableLength(table)).toBe(10);
});
// loadInBatches
test('CSVLoader#loadInBatches(sample.csv, columns)', async () => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    csv: {
      shape: 'columnar-table'
    }
  });
  expect(isAsyncIterable(iterator), 'loadInBatches returned iterator').toBeTruthy();
  let batchCount = 0;
  for await (const batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    expect(batch.length, 'Got correct batch size').toBe(2);
    expect(batch.shape, 'Got correct batch shape').toBe('columnar-table');
    if (batch.shape === 'columnar-table') {
      expect(
        validateColumn(batch.data.column1, batch.length, 'string'),
        'column 0 valid'
      ).toBeTruthy();
      expect(
        validateColumn(batch.data.column2, batch.length, 'string'),
        'column 1 valid'
      ).toBeTruthy();
      expect(
        validateColumn(batch.data.column3, batch.length, 'float'),
        'column 2 valid'
      ).toBeTruthy();
    }
    batchCount++;
  }
  expect(batchCount, 'Correct number of batches received').toBe(1);
});
test('CSVLoader#loadInBatches(geospatial-points-wkt.csv, detectGeometryColumns)', async () => {
  const iterator = await loadInBatches(CSV_GEOSPATIAL_WKT_URL, CSVLoader, {
    csv: {shape: 'columnar-table', detectGeometryColumns: true},
    batchSize: 2
  });
  let firstBatch: any = null;
  for await (const batch of iterator) {
    firstBatch = firstBatch || batch;
  }
  expect(firstBatch?.shape, 'Got correct batch shape').toBe('columnar-table');
  if (firstBatch?.shape === 'columnar-table') {
    const geometryField = firstBatch.schema?.fields.find(field => field.name === 'geometry');
    const geoMetadata = getGeoMetadata(firstBatch.schema?.metadata);
    expect(firstBatch.length, 'Got correct batch size').toBe(3);
    expect(
      geometryField?.metadata?.['ARROW:extension:name'],
      'WKT batch geometry field is annotated as WKB'
    ).toBe('geoarrow.wkb');
    expect(geoMetadata?.columns.geometry.encoding, 'Batch geo metadata includes encoding').toBe(
      'wkb'
    );
    expect(
      firstBatch.data.geometry[0] instanceof Uint8Array,
      'WKT batch geometry value is encoded'
    ).toBeTruthy();
  }
});
test('CSVLoader#load(geospatial-points-wkt.csv, arrow-table, detectGeometryColumns)', async () => {
  const table = await load(CSV_GEOSPATIAL_WKT_URL, CSVLoader, {
    core: {worker: false},
    csv: {shape: 'arrow-table', detectGeometryColumns: true}
  });
  expect(table.shape, 'Got correct table shape').toBe('arrow-table');
  const geometryField = table.schema?.fields.find(field => field.name === 'geometry');
  const geoMetadata = getGeoMetadata(table.schema?.metadata);
  expect(geometryField?.type, 'WKT Arrow geometry field is binary').toBe('binary');
  expect(
    geometryField?.metadata?.['ARROW:extension:name'],
    'WKT Arrow geometry field is annotated as WKB'
  ).toBe('geoarrow.wkb');
  expect(geoMetadata?.columns.geometry.encoding, 'Arrow geo metadata includes WKB encoding').toBe(
    'wkb'
  );
  expect(
    table.data.getChild('geometry')?.get(0) instanceof Uint8Array,
    'Arrow geometry is WKB'
  ).toBeTruthy();
});
test('CSVLoader#loadInBatches(numbers-100.csv, shape: arrow-table)', async () => {
  const iterator = await loadInBatches(CSV_STATES_URL, CSVLoader, {
    core: {worker: false, batchSize: 40},
    csv: {shape: 'arrow-table'}
  });
  let batchCount = 0;
  let rowCount = 0;
  for await (const batch of iterator) {
    expect(batch.shape, `Got correct Arrow batch shape for batch ${batchCount}`).toBe(
      'arrow-table'
    );
    rowCount += batch.data.numRows;
    batchCount++;
  }
  expect(batchCount >= 1, 'Received one or more batches').toBeTruthy();
  expect(rowCount, 'Correct number of rows received').toBe(110);
});
test('CSVLoader#loadInBatches(sample-very-long.csv, columns)', async () => {
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
    expect(batch.length, 'Got correct batch size').toBe(batchSize);
    expect(batch.shape, 'Got correct batch shape').toBe('columnar-table');
    if (batch.shape === 'columnar-table') {
      expect(
        validateColumn(batch.data.TLD, batch.length, 'string'),
        'column TLD valid'
      ).toBeTruthy();
      expect(
        validateColumn(batch.data['meaning of life'], batch.length, 'float'),
        'column meaning of life valid'
      ).toBeTruthy();
      expect(
        validateColumn(batch.data.placeholder, batch.length, 'string'),
        'column placeholder valid'
      ).toBeTruthy();
    }
    batchCount++;
    if (batchCount === 5) {
      break;
    }
  }
  expect(batchCount, 'Correct number of batches received').toBe(5);
});
test('CSVLoader#loadInBatches(sample.csv, array-rows)', async () => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {shape: 'array-row-table'});
  let batchCount = 0;
  for await (const batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    expect(batch.shape, 'Got correct batch shape').toBe('array-row-table');
    if (batch.shape === 'array-row-table') {
      expect(batch.length, 'Got correct batch size').toBe(2);
      expect(batch.data[0], 'Got correct first row').toEqual(['A', 'B', 1]);
    }
    batchCount++;
  }
  expect(batchCount, 'Correct number of batches received').toBe(1);
});
test('CSVLoader#loadInBatches(sample.csv, object-rows)', async () => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });
  let batchCount = 0;
  for await (const batch of iterator) {
    expect(batch.shape, 'Got correct batch shape').toBe('object-row-table');
    if (batch.shape === 'object-row-table') {
      // t.comment(
      //   `BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`
      // );
      expect(batch.length, 'Got correct batch size').toBe(2);
      expect(batch.data[0], 'Got correct first row').toEqual({
        column1: 'A',
        column2: 'B',
        column3: 1
      });
    }
    batchCount++;
  }
  expect(batchCount, 'Correct number of batches received').toBe(1);
});
test('CSVLoader#loadInBatches(sample.csv, arrays, header)', async () => {
  let iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    csv: {
      shape: 'array-row-table',
      header: false
    }
  });
  let batchCount = 0;
  for await (const batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    expect(batch.shape, 'Got correct batch shape').toBe('array-row-table');
    if (batch.shape === 'array-row-table') {
      expect(batch.length, 'Got correct batch size').toBe(2);
      expect(batch.data[0], 'Got correct first row').toEqual(['A', 'B', 1]);
    }
    batchCount++;
  }
  expect(batchCount, 'Correct number of batches received').toBe(1);
  iterator = await loadInBatches(CSV_SAMPLE_URL, CSVLoader, {
    csv: {header: false, shape: 'object-row-table'}
  });
  batchCount = 0;
  for await (const batch of iterator) {
    // t.comment(`BATCH ${batch.count}: ${batch.length} ${JSON.stringify(batch.data).slice(0, 200)}`);
    expect(batch.shape, 'Got correct batch shape').toBe('object-row-table');
    if (batch.shape === 'object-row-table') {
      expect(batch.length, 'Got correct batch size').toBe(2);
      expect(batch.data[0], 'Got correct first row').toEqual({
        column1: 'A',
        column2: 'B',
        column3: 1
      });
    }
    batchCount++;
  }
  expect(batchCount, 'Correct number of batches received').toBe(1);
});
test('CSVLoader#loadInBatches(no header, row format, prefix)', async () => {
  const batchSize = 25;
  const iterator = await loadInBatches(CSV_NO_HEADER_URL, CSVLoader, {
    csv: {
      shape: 'object-row-table',
      columnPrefix: 'column_'
    },
    batchSize
  });
  for await (const batch of iterator) {
    expect(batch.shape, 'Got correct batch shape').toBe('object-row-table');
    if (batch.shape === 'object-row-table') {
      // t.comment(JSON.stringify(batch.data[0]));
      expect(batch.data[0].column_1, 'first column has a value').toBeTruthy();
      expect(batch.data[0].column_2, 'second column has a value value').toBeTruthy();
      expect(batch.data[0].column_3, 'third column has a value').toBeTruthy();
    }
  }
});
test('CSVLoader#loadInBatches(sample.csv, no dynamicTyping)', async () => {
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
    expect(batch.shape, 'Got correct batch shape').toBe('columnar-table');
    if (batch.shape === 'columnar-table') {
      expect(getTableLength(batch), 'Got correct batch size').toBe(2);
      expect(
        validateColumn(batch.data.column1, batch.length, 'string'),
        'column 0 valid'
      ).toBeTruthy();
      expect(
        validateColumn(batch.data.column2, batch.length, 'string'),
        'column 1 valid'
      ).toBeTruthy();
      expect(
        validateColumn(batch.data.column3, batch.length, 'string'),
        'column 2 is a string and is valid'
      ).toBeTruthy();
    }
    rowCount = rowCount + batch.length;
  }
  expect(rowCount, 'Correct number of rows received').toBe(2);
});
test('CSVLoader#loadInBatches(sample.csv, duplicate columns)', async () => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL_DUPLICATE_COLS, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });
  const rows: any[] = [];
  for await (const batch of iterator) {
    if (batch.shape === 'object-row-table') {
      rows.push(...batch.data);
    }
  }
  expect(rows.length, 'Got correct table size').toBe(3);
  expect(rows, 'dataset should be parsed with the corrected duplicate headers').toEqual([
    {A: 'x', B: 1, 'A.1': 'y', 'A.1.1': 'z', 'A.2': 'w', 'B.1': 2},
    {A: 'y', B: 29, 'A.1': 'z', 'A.1.1': 'y', 'A.2': 'w', 'B.1': 19},
    {A: 'x', B: 1, 'A.1': 'y', 'A.1.1': 'z', 'A.2': 'w', 'B.1': 2}
  ]);
  const iterator2 = await loadInBatches(CSV_SAMPLE_URL_DUPLICATE_COLS, CSVLoader, {
    csv: {shape: 'array-row-table'}
  });
  const rows2: any[] = [];
  for await (const batch of iterator2) {
    if (batch.shape === 'array-row-table') {
      rows2.push(...batch.data);
    }
  }
  expect(rows2.length, 'Got correct table size').toBe(3);
  expect(rows2, 'dataset should be parsed correctly as array rows').toEqual([
    ['x', 1, 'y', 'z', 'w', 2],
    ['y', 29, 'z', 'y', 'w', 19],
    ['x', 1, 'y', 'z', 'w', 2]
  ]);
});
test('CSVLoader#loadInBatches(skipEmptyLines greedy)', async () => {
  const iterator = await loadInBatches(CSV_SAMPLE_URL_EMPTY_LINES, CSVLoader, {
    csv: {shape: 'object-row-table', skipEmptyLines: 'greedy'}
  });
  const rows: unknown[] = [];
  for await (const batch of iterator) {
    expect(batch.shape, 'Got correct batch shape').toBe('object-row-table');
    if (batch.shape === 'object-row-table') {
      rows.push(...batch.data);
    }
  }
  expect(rows.length, 'Got correct table size').toBe(2);
  expect(rows, 'dataset should be parsed with the correct content').toEqual([
    {A: 'x', B: 1, C: 'some text'},
    {A: 'y', B: 2, C: 'other text'}
  ]);
});
test('CSVLoader#loadInBatches(csv with quotes)', async () => {
  const iterator = await loadInBatches(CSV_INCIDENTS_URL_QUOTES, CSVLoader, {
    csv: {shape: 'object-row-table'}
  });
  const rows: unknown[] = [];
  for await (const batch of iterator) {
    expect(batch.shape, 'Got correct batch shape').toBe('object-row-table');
    if (batch.shape === 'object-row-table') {
      rows.push(...batch.data);
    }
  }
  expect(rows.length, 'Got the correct table size').toBe(499);
  expect(rows[0], 'Got correct first row (csv with quotes)').toEqual({
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
  });
});
test('CSVLoader#parseInBatches preserves UTF-8 characters split across chunks after preload', async () => {
  const csvText = 'city\nZürich\n東京\n';
  const csvBytes = new TextEncoder().encode(csvText);
  const splitIndex = csvBytes.indexOf(0xc3) + 1;
  const preloadedLoader = await preload(CSVLoader);
  const iterator = await parseInBatches(
    [csvBytes.subarray(0, splitIndex), csvBytes.subarray(splitIndex)],
    preloadedLoader,
    {
      csv: {
        header: true,
        shape: 'object-row-table'
      }
    }
  );
  const rows: unknown[] = [];
  for await (const batch of iterator) {
    if (batch.shape === 'object-row-table') {
      rows.push(...batch.data);
    }
  }
  expect(rows, 'preserves split UTF-8 characters').toEqual([{city: 'Zürich'}, {city: '東京'}]);
});
test('CSV parser loaders are available through direct implementation imports', async () => {
  const preloadedLoader = await preload(CSVLoader);
  const csvTable = await parse('city,population\nParis,2148000', preloadedLoader, {
    csv: {shape: 'object-row-table'}
  });
  expect(csvTable.shape, 'preloaded CSV loader parses text directly').toBe('object-row-table');
});
function validateColumn(column, length, type) {
  if (column.length !== length) {
    return `column length should be ${length}`;
  }
  let validator: Function | null = null;
  switch (type) {
    case 'string':
      validator = d => typeof d === 'string';
      break;
    case 'float':
      validator = d => Number.isFinite(d);
      break;
    default:
      return null;
  }
  return column.every(validator) ? true : `column elements are not all ${type}s`;
}
