// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  load,
  loadInBatches,
  isIterator,
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
import * as arrow from 'apache-arrow';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {
  deserializeCSVWorkerResult,
  serializeCSVWorkerResult
} from '../src/lib/csv-worker-transport';

// Small CSV Sample Files
const CSV_NUMBERS_100_URL = '@loaders.gl/csv/test/data/numbers-100.csv';
const CSV_NUMBERS_10000_URL = '@loaders.gl/csv/test/data/numbers-10000.csv';
const CSV_INCIDENTS_URL_QUOTES = '@loaders.gl/csv/test/data/sf_incidents-small.csv';
const CSV_SAMPLE_URL = '@loaders.gl/csv/test/data/sample.csv';
const CSV_SAMPLE_URL_DUPLICATE_COLS = '@loaders.gl/csv/test/data/sample-duplicate-cols.csv';
const CSV_SAMPLE_URL_EMPTY_LINES = '@loaders.gl/csv/test/data/sample-empty-line.csv';
const CSV_NO_HEADER_URL = '@loaders.gl/csv/test/data/numbers-100-no-header.csv';
const TSV_BRAZIL = '@loaders.gl/csv/test/data/tsv/brazil.tsv';

test('CSVLoader#root export includes metadata loader', () => {
  expect(typeof CSVLoader.preload).toBe('function');
  expect('parse' in CSVLoader).toBe(false);
  expect('parseInBatches' in CSVLoader).toBe(false);
  expect(CSVWorkerLoader).toBe(CSVLoader);
  expect('CSVLoaderWithParser' in csv).toBe(false);
  expect('CSVArrowLoader' in csv).toBe(false);
  expect('CSVArrowWriter' in csv).toBe(false);
});

test('CSVLoader#bundled export includes parser methods', () => {
  expect(typeof BundledCSVLoader.parse).toBe('function');
  expect(typeof BundledCSVLoader.parseInBatches).toBe('function');
  expect(BundledCSVWorkerLoader).toBe(BundledCSVLoader);
});

test('CSVLoader#unbundled export preloads parser implementation', async () => {
  expect(preloadSync(UnbundledCSVLoader)).toBe(null);
  expect(UnbundledCSVWorkerLoader).toBe(UnbundledCSVLoader);
  expect(typeof UnbundledCSVLoader.preload).toBe('function');
  expect('parse' in UnbundledCSVLoader).toBe(false);
  expect('parseSync' in UnbundledCSVLoader).toBe(false);
  expect('parseInBatches' in UnbundledCSVLoader).toBe(false);

  const table = await parse('city,population\nParis,2148000', UnbundledCSVLoader, {
    core: {worker: false},
    csv: {shape: 'arrow-table', header: true}
  });
  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows).toBe(1);
  expect(table.data.getChild('city')?.get(0)).toBe('Paris');

  const parserLoader = await preload(UnbundledCSVLoader);
  expect(typeof parserLoader.parse).toBe('function');
  expect(preloadSync(UnbundledCSVLoader)).toBe(parserLoader);
});

test('CSVLoader#loadInBatches(numbers-100.csv)', async () => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false, batchSize: 40},
    csv: {shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
  });

  expect(isIterator(iterator) || isAsyncIterable(iterator)).toBe(true);

  let batchCount = 0;
  for await (const batch of iterator) {
    expect(batch.data).toBeInstanceOf(arrow.Table);
    batchCount++;
  }
  expect(batchCount).toBe(3);
});

test('CSVLoader#loadInBatches(numbers-10000.csv)', async () => {
  const iterator = await loadInBatches(CSV_NUMBERS_10000_URL, CSVLoader, {
    core: {worker: false, batchSize: 2000},
    csv: {shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
  });
  expect(isIterator(iterator) || isAsyncIterable(iterator)).toBe(true);

  let batchCount = 0;
  for await (const batch of iterator) {
    expect(batch.data).toBeInstanceOf(arrow.Table);
    batchCount++;
  }
  expect(batchCount).toBe(5);
});

test('CSVLoader#loadInBatches(incidents.csv)', async () => {
  const iterator = await loadInBatches(CSV_INCIDENTS_URL_QUOTES, CSVLoader, {
    core: {worker: false},
    csv: {shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
  });
  expect(isIterator(iterator) || isAsyncIterable(iterator)).toBe(true);

  let batchCount = 0;
  for await (const batch of iterator) {
    expect(batch.data).toBeInstanceOf(arrow.Table);
    batchCount++;
  }
  expect(batchCount).toBe(1);
});

test('CSVLoader#load(numbers-100.csv)', async () => {
  const table = await load(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false},
    csv: {shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
  });

  expect(table.data).toBeInstanceOf(arrow.Table);
  expect(table.data.numRows).toBe(100);

  const zipColumn = table.data.getChildAt(1);
  expect(zipColumn?.get(0)).toBe('09857');

  const fieldTypeNames = table.data.schema.fields.map(field => field.type.toString());
  expect(fieldTypeNames.every(typeName => typeName === 'Utf8')).toBe(true);
});

test('CSVLoader#load prefers supported Arrow Utf8View columns', async () => {
  const table = await load(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      dynamicTyping: false,
      skipEmptyLines: false,
      viewTypes: 'require'
    }
  });

  expect(table.data.schema.fields.every(field => field.type.constructor.name === 'Utf8View')).toBe(
    true
  );
  expect(table.schema.fields.every(field => field.type === 'utf8-view')).toBe(true);
  expect(table.data.getChildAt(1)?.get(0)).toBe('09857');
});

test('CSVLoader#parseInBatches reports supported Arrow Utf8View columns', async () => {
  const csvBuffer = new TextEncoder().encode('name\nArrow\nView\n');
  const preloadedLoader = await preload(CSVLoader);
  const iterator = await parseInBatches([csvBuffer], preloadedLoader, {
    core: {worker: false, batchSize: 1},
    csv: {
      shape: 'arrow-table',
      header: true,
      dynamicTyping: false,
      skipEmptyLines: false,
      viewTypes: 'require'
    }
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    expect(batch.data.schema.fields[0]?.type.constructor.name).toBe('Utf8View');
    expect(batch.schema?.fields[0]?.type).toBe('utf8-view');
    rowCount += batch.length;
  }
  expect(rowCount).toBe(2);
});

test('CSVLoader#load matches CSVLoader output across fixture cases', async () => {
  const cases: Array<{
    name: string;
    url: string;
    shape: 'array-row-table' | 'object-row-table';
    options: {
      csv: {
        header?: boolean | 'auto';
        dynamicTyping: boolean;
        shape?: 'array-row-table' | 'object-row-table';
        skipEmptyLines?: boolean | 'greedy';
        columnPrefix?: string;
      };
    };
  }> = [
    {
      name: 'sample array rows without header',
      url: CSV_SAMPLE_URL,
      shape: 'array-row-table',
      options: {csv: {shape: 'array-row-table', header: false, dynamicTyping: true}}
    },
    {
      name: 'sample object rows without header',
      url: CSV_SAMPLE_URL,
      shape: 'object-row-table',
      options: {csv: {shape: 'object-row-table', header: false, dynamicTyping: true}}
    },
    {
      name: 'sample object rows with header',
      url: CSV_SAMPLE_URL,
      shape: 'object-row-table',
      options: {csv: {shape: 'object-row-table', header: true, dynamicTyping: true}}
    },
    {
      name: 'sample object rows without dynamic typing',
      url: CSV_SAMPLE_URL,
      shape: 'object-row-table',
      options: {
        csv: {shape: 'object-row-table', header: false, dynamicTyping: false}
      }
    },
    {
      name: 'duplicate headers',
      url: CSV_SAMPLE_URL_DUPLICATE_COLS,
      shape: 'object-row-table',
      options: {csv: {shape: 'object-row-table', header: 'auto', dynamicTyping: true}}
    },
    {
      name: 'skip empty lines',
      url: CSV_SAMPLE_URL_EMPTY_LINES,
      shape: 'object-row-table',
      options: {
        csv: {
          shape: 'object-row-table',
          header: 'auto',
          dynamicTyping: true,
          skipEmptyLines: true
        }
      }
    },
    {
      name: 'quoted csv',
      url: CSV_INCIDENTS_URL_QUOTES,
      shape: 'object-row-table',
      options: {csv: {shape: 'object-row-table', header: true, dynamicTyping: true}}
    },
    {
      name: 'no header with custom prefix',
      url: CSV_NO_HEADER_URL,
      shape: 'object-row-table',
      options: {
        csv: {
          shape: 'object-row-table',
          header: false,
          dynamicTyping: true,
          columnPrefix: 'column_'
        }
      }
    },
    {
      name: 'tsv',
      url: TSV_BRAZIL,
      shape: 'object-row-table',
      options: {csv: {shape: 'object-row-table', header: 'auto', dynamicTyping: true}}
    },
    {
      name: 'numeric csv without dynamic typing',
      url: CSV_NUMBERS_100_URL,
      shape: 'object-row-table',
      options: {csv: {shape: 'object-row-table', header: true, dynamicTyping: false}}
    }
  ];

  for (const {name, url, shape, options} of cases) {
    const csvLoaderTable = await load(url, CSVLoader, options);
    const {shape: csvShape, ...arrowOptions} = options.csv;
    expect(csvShape).toBe(shape);
    const arrowTable = await load(url, CSVLoader, {
      core: {worker: false},
      csv: {...arrowOptions, shape: 'arrow-table'}
    });
    const arrowRows = materializeArrowTableRows(arrowTable, shape);

    expect(arrowRows).toEqual(csvLoaderTable.data);
  }
});

test('CSVLoader#parseInBatches matches CSVLoader output across fixture cases', async () => {
  const cases: Array<{
    name: string;
    url: string;
    options: {
      csv: {
        header?: boolean | 'auto';
        dynamicTyping: boolean;
        shape: 'array-row-table' | 'object-row-table';
        skipEmptyLines?: boolean | 'greedy';
        columnPrefix?: string;
      };
    };
  }> = [
    {
      name: 'sample array rows without header',
      url: CSV_SAMPLE_URL,
      options: {csv: {shape: 'array-row-table', header: false, dynamicTyping: true}}
    },
    {
      name: 'sample object rows without header',
      url: CSV_SAMPLE_URL,
      options: {csv: {shape: 'object-row-table', header: false, dynamicTyping: true}}
    },
    {
      name: 'duplicate headers',
      url: CSV_SAMPLE_URL_DUPLICATE_COLS,
      options: {csv: {shape: 'object-row-table', header: 'auto', dynamicTyping: true}}
    },
    {
      name: 'skip empty lines',
      url: CSV_SAMPLE_URL_EMPTY_LINES,
      options: {
        csv: {
          shape: 'object-row-table',
          header: 'auto',
          dynamicTyping: true,
          skipEmptyLines: true
        }
      }
    },
    {
      name: 'quoted csv',
      url: CSV_INCIDENTS_URL_QUOTES,
      options: {csv: {shape: 'object-row-table', header: true, dynamicTyping: true}}
    },
    {
      name: 'numeric csv without dynamic typing',
      url: CSV_NUMBERS_100_URL,
      options: {csv: {shape: 'object-row-table', header: true, dynamicTyping: false}}
    }
  ];

  for (const {name, url, options} of cases) {
    const csvLoaderRows = await collectCSVLoaderBatchRows(url, options);
    const arrowRows = await collectCSVArrowTableBatchRows(url, options);
    expect(arrowRows).toEqual(csvLoaderRows);
  }
});

test('CSVLoader#parse handles raw UTF-8 and quoted fields without string tokenization', async () => {
  const csvText = 'name,note\nÅsa,mañana\nBob,"x,y"\n"Eve","hello\nthere"\n"Dan","b""c"\n';
  const csvBuffer = new TextEncoder().encode(csvText);
  const preloadedLoader = await preload(CSVLoader);

  const table = await parse(csvBuffer.buffer, preloadedLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      dynamicTyping: false,
      header: true,
      skipEmptyLines: false
    }
  });

  expect(table.data.numRows).toBe(4);
  expect(table.data.numCols).toBe(2);
  expect(table.data.getChild('name')?.get(0)).toBe('Åsa');
  expect(table.data.getChild('note')?.get(0)).toBe('mañana');
  expect(table.data.getChild('note')?.get(1)).toBe('x,y');
  expect(table.data.getChild('note')?.get(2)).toBe('hello\nthere');
  expect(table.data.getChild('note')?.get(3)).toBe('b"c');
});

async function collectCSVLoaderBatchRows(
  url: string,
  options: {
    csv: {
      shape: 'array-row-table' | 'object-row-table';
      header?: boolean | 'auto';
      dynamicTyping: boolean;
      skipEmptyLines?: boolean | 'greedy';
      columnPrefix?: string;
    };
  }
): Promise<unknown[]> {
  const rows: unknown[] = [];
  const iterator = await loadInBatches(url, CSVLoader, options);
  for await (const batch of iterator) {
    if (batch.shape === 'array-row-table' || batch.shape === 'object-row-table') {
      rows.push(...batch.data);
    }
  }
  return rows;
}

async function collectCSVArrowTableBatchRows(
  url: string,
  options: {
    csv: {
      shape: 'array-row-table' | 'object-row-table';
      header?: boolean | 'auto';
      dynamicTyping: boolean;
      skipEmptyLines?: boolean | 'greedy';
      columnPrefix?: string;
    };
  }
): Promise<unknown[]> {
  const rows: unknown[] = [];
  const {shape, ...arrowCSVOptions} = options.csv;
  const iterator = await loadInBatches(url, CSVLoader, {
    core: {worker: false},
    csv: {...arrowCSVOptions, shape: 'arrow-table'}
  });
  for await (const batch of iterator) {
    rows.push(
      ...materializeArrowTableRows(
        {shape: 'arrow-table', schema: batch.schema, data: batch.data},
        shape
      )
    );
  }
  return rows;
}

function materializeArrowTableRows(
  arrowTable: ArrowTable,
  shape: 'array-row-table' | 'object-row-table'
): unknown[] {
  return shape === 'array-row-table'
    ? materializeArrowTableArrayRows(arrowTable)
    : materializeArrowTableObjectRows(arrowTable);
}

function materializeArrowTableArrayRows(arrowTable: ArrowTable): unknown[][] {
  const rows: unknown[][] = [];
  for (let rowIndex = 0; rowIndex < arrowTable.data.numRows; rowIndex++) {
    const row: unknown[] = [];
    for (let columnIndex = 0; columnIndex < arrowTable.data.numCols; columnIndex++) {
      row.push(materializeArrowCellValue(arrowTable.data.getChildAt(columnIndex)?.get(rowIndex)));
    }
    rows.push(row);
  }
  return rows;
}

function materializeArrowTableObjectRows(arrowTable: ArrowTable): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];
  const fields = arrowTable.data.schema.fields;
  for (let rowIndex = 0; rowIndex < arrowTable.data.numRows; rowIndex++) {
    const row: Record<string, unknown> = {};
    for (let columnIndex = 0; columnIndex < fields.length; columnIndex++) {
      const cellValue = materializeArrowCellValue(
        arrowTable.data.getChildAt(columnIndex)?.get(rowIndex)
      );
      if (cellValue === null && fields[columnIndex].type instanceof arrow.List) {
        continue;
      }
      row[fields[columnIndex].name] = cellValue;
    }
    rows.push(row);
  }
  return rows;
}

function materializeArrowCellValue(value: unknown): unknown {
  if (value && typeof value === 'object' && Symbol.iterator in value) {
    return Array.from(value as Iterable<unknown>);
  }
  return value;
}

test('CSVLoader#parse byte path handles TSV, duplicate headers, and missing cells', async () => {
  const csvText = 'a\ta\n1\t2\n3\n';
  const csvBuffer = new TextEncoder().encode(csvText);
  const preloadedLoader = await preload(CSVLoader);

  const table = await parse(csvBuffer.buffer, preloadedLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      dynamicTyping: false,
      header: true,
      skipEmptyLines: false
    }
  });

  expect(table.data.schema.fields.map(field => field.name)).toEqual(['a', 'a.1']);
  expect(table.data.getChild('a')?.get(0)).toBe('1');
  expect(table.data.getChild('a.1')?.get(0)).toBe('2');
  expect(table.data.getChild('a')?.get(1)).toBe('3');
  expect(table.data.getChild('a.1')?.get(1)).toBe(null);
});

test('CSVLoader#parse only adds __parsed_extra for Papa-compatible extra cells', async () => {
  const noExtraText = 'A,B,C\nx,1,some text\ny,2,other text\n\n';
  const noExtraBuffer = new TextEncoder().encode(noExtraText);
  const preloadedLoader = await preload(CSVLoader);
  const noExtraTable = await parse(noExtraBuffer.buffer, preloadedLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      header: true,
      skipEmptyLines: true
    }
  });

  expect(noExtraTable.data.getChild('__parsed_extra')).toBe(null);

  const extraText = 'A,B,C\nx,1,some text\n,,,\ny,2,other text\n';
  const extraBuffer = new TextEncoder().encode(extraText);
  const extraTable = await parse(extraBuffer.buffer, preloadedLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      header: true,
      skipEmptyLines: true
    }
  });

  expect(extraTable.data.getChild('__parsed_extra')).toBeTruthy();

  const headerlessExtraTable = await parse(extraBuffer.buffer, preloadedLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      header: false,
      skipEmptyLines: true
    }
  });

  expect(headerlessExtraTable.data.getChild('__parsed_extra')).toBe(null);
});

test('CSVLoader#loadInBatches(numbers-100.csv, utf8 columns)', async () => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false, batchSize: 40},
    csv: {shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    expect(batch.data).toBeInstanceOf(arrow.Table);
    const fieldTypeNames = batch.data.schema.fields.map(field => field.type.toString());
    expect(fieldTypeNames.every(typeName => typeName === 'Utf8')).toBe(true);

    rowCount += batch.data.numRows;
  }

  expect(rowCount).toBe(100);
});

test('CSVLoader#load(numbers-100.csv, dynamicTyping true)', async () => {
  const table = await load(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      dynamicTyping: true
    }
  });

  expect(table.data).toBeInstanceOf(arrow.Table);
  expect(table.data.numRows).toBe(100);

  const zipColumn = table.data.getChildAt(1);
  expect(zipColumn?.get(0)).toBe(9857);

  const fieldTypeNames = table.data.schema.fields.map(field => field.type.toString());
  expect(fieldTypeNames.every(typeName => typeName === 'Float64')).toBe(true);
});

test('CSVLoader#load(numbers-100.csv, dynamicTyping false)', async () => {
  const table = await load(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      dynamicTyping: false
    }
  });

  expect(table.data).toBeInstanceOf(arrow.Table);
  expect(table.data.numRows).toBe(100);

  const zipColumn = table.data.getChildAt(1);
  expect(zipColumn?.get(0)).toBe('09857');

  const fieldTypeNames = table.data.schema.fields.map(field => field.type.toString());
  expect(fieldTypeNames.every(typeName => typeName === 'Utf8')).toBe(true);
});

test('CSVLoader#loadInBatches(numbers-100.csv, dynamicTyping true)', async () => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false, batchSize: 40},
    csv: {
      shape: 'arrow-table',
      dynamicTyping: true
    }
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    expect(batch.data).toBeInstanceOf(arrow.Table);
    const fieldTypeNames = batch.data.schema.fields.map(field => field.type.toString());
    expect(fieldTypeNames.every(typeName => typeName === 'Float64')).toBe(true);

    rowCount += batch.data.numRows;
  }

  expect(rowCount).toBe(100);
});

test('CSVLoader#parseInBatches freezes schema after first typed batch', async () => {
  const csvText = 'value\n1\nfoo\n';
  const csvBuffer = new TextEncoder().encode(csvText);
  const preloadedLoader = await preload(CSVLoader);

  const iterator = await parseInBatches([csvBuffer], preloadedLoader, {
    core: {
      worker: false,
      batchSize: 1
    },
    csv: {
      shape: 'arrow-table',
      header: true,
      dynamicTyping: true,
      skipEmptyLines: false
    }
  });

  const batches: ArrowTableBatch[] = [];
  for await (const batch of iterator) {
    batches.push(batch);
  }

  expect(batches.length).toBe(2);

  const firstBatchColumnTypeName = batches[0]?.data.schema.fields[0]?.type.toString();
  const secondBatchColumnTypeName = batches[1]?.data.schema.fields[0]?.type.toString();
  expect(firstBatchColumnTypeName).toBe('Float64');
  expect(secondBatchColumnTypeName).toBe('Float64');

  const firstBatchValue = batches[0]?.data.getChildAt(0)?.get(0);
  const secondBatchValue = batches[1]?.data.getChildAt(0)?.get(0);
  expect(firstBatchValue).toBe(1);
  expect(secondBatchValue).toBe(null);
});

test('CSVLoader#arrow-table dynamic typing covers booleans, dates, exponents, nulls, and mixed columns', async () => {
  const csvText = [
    'boolean,number,date,mixed,empty',
    'TRUE,-1.25e+2,2024-01-02T03:04:05Z,1,',
    'false,6E-1,2024-02-03T04:05:06.789+01:00,text,',
    'true,not-a-number,not-a-date,3,'
  ].join('\n');
  const table = await parse(csvText, CSVLoader, {
    core: {worker: false},
    csv: {shape: 'arrow-table', header: true, dynamicTyping: true, skipEmptyLines: false}
  });

  expect(table.data.schema.fields.map(field => field.type.toString())).toEqual([
    'Bool',
    'Utf8',
    'Utf8',
    'Utf8',
    'Utf8'
  ]);
  expect(table.data.getChild('boolean')?.toArray()).toEqual([true, false, true]);
  expect(table.data.getChild('number')?.toArray()).toEqual(['-125', '0.6', 'not-a-number']);
  expect(table.data.getChild('empty')?.toArray()).toEqual([null, null, null]);
});

test('CSVLoader#arrow-table types homogeneous temporal and numeric edge columns', async () => {
  const csvText = [
    'integer,decimal,exponent,date',
    '-1,.5,1e2,2024-01-02T03:04:05Z',
    '0,2.,-3E-2,2024-02-03T04:05:06.789+01:00',
    '42,4.25,+5e3,2024-03-04T05:06:07-02:00'
  ].join('\n');
  const table = await parse(csvText, CSVLoader, {
    core: {worker: false},
    csv: {shape: 'arrow-table', header: true, dynamicTyping: true}
  });

  expect(table.data.schema.fields.map(field => field.type.toString())).toEqual([
    'Float64',
    'Float64',
    'Utf8',
    'Utf8'
  ]);
  expect(Array.from(table.data.getChild('integer')?.toArray() || [])).toEqual([-1, 0, 42]);
  expect(Array.from(table.data.getChild('decimal')?.toArray() || [])).toEqual([0.5, 2, 4.25]);
  expect(new Date(table.data.getChild('date')?.get(0)).toISOString()).toBe(
    '2024-01-02T03:04:05.000Z'
  );
});

test('CSVLoader#arrow-table fallback handles quoted cells, comments, and custom delimiters', async () => {
  const csvText = [
    '# ignored comment',
    'name;value;flag',
    '"comma, quote ""inside""";1;TRUE',
    'plain;;false'
  ].join('\n');
  const table = await parse(csvText, CSVLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      header: true,
      delimiter: ';',
      comments: '#',
      dynamicTyping: true,
      skipEmptyLines: true
    }
  });

  expect(table.data.getChild('name')?.toArray()).toEqual(['comma, quote "inside"', 'plain']);
  expect(table.data.getChild('value')?.get(0)).toBe(1);
  expect(table.data.getChild('value')?.get(1)).toBe(null);
  expect(table.data.getChild('flag')?.toArray()).toEqual([true, false]);
});

test('CSVLoader#arrow-table geometry detection uses the row-table compatibility path', async () => {
  const table = await parse('longitude,latitude,name\n10,20,point', CSVLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      header: true,
      dynamicTyping: true,
      detectGeometryColumns: true
    }
  });
  expect(table.data.numRows).toBe(1);
  expect(table.data.getChild('longitude')?.get(0)).toBe(10);
  expect(table.data.getChild('latitude')?.get(0)).toBe(20);
});

test('CSVLoader#arrow-table geometry detection supports byte and streaming inputs', async () => {
  const bytes = new TextEncoder().encode('longitude,latitude,name\n10,20,first\n11,21,second');
  const preloadedLoader = await preload(CSVLoader);
  const table = await parse(bytes.buffer, preloadedLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      header: true,
      dynamicTyping: true,
      detectGeometryColumns: true
    }
  });
  expect(table.data.numRows).toBe(2);

  const batches: ArrowTableBatch[] = [];
  const iterator = await parseInBatches(
    [bytes.subarray(0, 30), bytes.subarray(30)],
    preloadedLoader,
    {
      core: {worker: false, batchSize: 1},
      csv: {
        shape: 'arrow-table',
        header: true,
        dynamicTyping: true,
        detectGeometryColumns: true
      }
    }
  );
  for await (const batch of iterator) {
    batches.push(batch);
  }
  expect(batches.reduce((sum, batch) => sum + batch.length, 0)).toBe(2);
  expect(batches.every(batch => batch.shape === 'arrow-table')).toBe(true);
});

test('CSVLoader#arrow-table applies GeoArrow encoding preference to detected WKT', async () => {
  const bytes = new TextEncoder().encode(
    'geometry,name\nPOINT (10 20),first\nPOINT (11 21),second'
  );
  const iterator = await parseInBatches([bytes], CSVLoader, {
    core: {worker: false, batchSize: 1},
    geoarrow: {encodingPreference: 'optimized'},
    csv: {
      shape: 'arrow-table',
      header: true,
      detectGeometryColumns: true,
      geometryEncoding: 'source'
    }
  });
  const batches: ArrowTableBatch[] = [];
  for await (const batch of iterator) {
    if (batch.batchType === 'data') batches.push(batch);
  }
  expect(batches).toHaveLength(1);
  expect(
    batches[0].schema.fields.find(field => field.name === 'geometry')?.metadata?.[
      'ARROW:extension:name'
    ]
  ).toBe('geoarrow.point');
  expect(batches[0].data.numRows).toBe(2);
});

test('CSVLoader#parseInBatches streams fragmented Arrow batches through one worker session', async () => {
  const csvText = 'id,name\n1,Alice\n2,Bob\n3,Carol\n';
  const bytes = new TextEncoder().encode(csvText);
  // Copy each fragment because worker transport transfers ArrayBuffer ownership.
  const chunks = [bytes.slice(0, 9), bytes.slice(9, 16), bytes.slice(16)];

  async function collectRows(worker: boolean): Promise<{batchTypes: string[]; rows: unknown[][]}> {
    const iterator = await parseInBatches(chunks, CSVLoader, {
      core: {
        worker,
        batchSize: 1,
        metadata: true,
        _workerType: 'test',
        reuseWorkers: false
      },
      csv: {header: true, shape: 'arrow-table', dynamicTyping: true, skipEmptyLines: false}
    });
    const batchTypes: string[] = [];
    const rows: unknown[][] = [];
    for await (const batch of iterator) {
      batchTypes.push(batch.batchType);
      if (batch.batchType === 'data') {
        for (let rowIndex = 0; rowIndex < batch.data.numRows; rowIndex++) {
          rows.push(
            Array.from({length: batch.data.numCols}, (_, columnIndex) =>
              batch.data.getChildAt(columnIndex)?.get(rowIndex)
            )
          );
        }
        expect(batch.data.getChild('id')?.get(0)).toEqual(expect.any(Number));
      }
    }
    return {batchTypes, rows};
  }

  const mainThreadResult = await collectRows(false);
  const workerResult = await collectRows(true);

  expect(workerResult).toEqual(mainThreadResult);
  expect(workerResult.batchTypes[0]).toBe('metadata');
  expect(workerResult.rows).toEqual([
    [1, 'Alice'],
    [2, 'Bob'],
    [3, 'Carol']
  ]);
});

test('CSVLoader#worker transport serializes and hydrates Arrow table results', async () => {
  const table = await parse('city,population\nParis,2148000', CSVLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      header: true,
      dynamicTyping: false
    }
  });

  const serialized = serializeCSVWorkerResult(table, {
    core: {workerTransferBufferCopy: 'all'}
  }) as {
    shape: 'arrow-table';
    data: {transport: string; getChild?: unknown};
  };
  expect(serialized.shape).toBe('arrow-table');
  expect(serialized.data.transport).toBe('arrow-js');
  expect(serialized.data.getChild).toBeFalsy();

  const hydrated = deserializeCSVWorkerResult(serialized) as ArrowTable;
  expect(hydrated.data).toBeInstanceOf(arrow.Table);
  expect(hydrated.data.getChild('city')?.get(0)).toBe('Paris');

  const serializedWithDeprecatedOption = serializeCSVWorkerResult(table, {
    workerTransferBufferCopy: 'none'
  } as any) as {data: {transport: string}};
  expect(serializedWithDeprecatedOption.data.transport).toBe('arrow-js');

  const plainResult = {shape: 'object-row-table', data: [{city: 'Paris'}]};
  expect(serializeCSVWorkerResult(plainResult)).toBe(plainResult);
  expect(deserializeCSVWorkerResult(plainResult)).toBe(plainResult);
});
