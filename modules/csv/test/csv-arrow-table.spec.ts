// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('CSVLoader#root export includes metadata loader', t => {
  t.equal(typeof CSVLoader.preload, 'function', 'root CSVLoader exposes preload');
  t.notOk('parse' in CSVLoader, 'root CSVLoader does not expose parse');
  t.notOk('parseInBatches' in CSVLoader, 'root CSVLoader does not expose parseInBatches');
  t.equal(CSVWorkerLoader, CSVLoader, 'CSVWorkerLoader aliases CSVLoader');
  t.notOk('CSVLoaderWithParser' in csv, 'root does not export CSVLoaderWithParser');
  t.notOk('CSVArrowLoader' in csv, 'root does not export CSVArrowLoader');
  t.notOk('CSVArrowWriter' in csv, 'root does not export CSVArrowWriter');
  t.end();
});

test('CSVLoader#bundled export includes parser methods', t => {
  t.equal(typeof BundledCSVLoader.parse, 'function', 'bundled CSVLoader exposes parse');
  t.equal(
    typeof BundledCSVLoader.parseInBatches,
    'function',
    'bundled CSVLoader exposes parseInBatches'
  );
  t.equal(BundledCSVWorkerLoader, BundledCSVLoader, 'bundled CSVWorkerLoader aliases CSVLoader');
  t.end();
});

test('CSVLoader#unbundled export preloads parser implementation', async t => {
  t.equal(preloadSync(UnbundledCSVLoader), null, 'unbundled CSVLoader is not preloaded initially');
  t.equal(UnbundledCSVWorkerLoader, UnbundledCSVLoader, 'worker alias points to CSVLoader');
  t.equal(typeof UnbundledCSVLoader.preload, 'function', 'unbundled CSVLoader exposes preload');
  t.notOk('parse' in UnbundledCSVLoader, 'unbundled CSVLoader does not expose parse');
  t.notOk('parseSync' in UnbundledCSVLoader, 'unbundled CSVLoader does not expose parseSync');
  t.notOk(
    'parseInBatches' in UnbundledCSVLoader,
    'unbundled CSVLoader does not expose parseInBatches'
  );

  const table = await parse('city,population\nParis,2148000', UnbundledCSVLoader, {
    core: {worker: false},
    csv: {shape: 'arrow-table', header: true}
  });
  t.equal(table.shape, 'arrow-table', 'parse returns Arrow table shape');
  t.equal(table.data.numRows, 1, 'returns Arrow rows');
  t.equal(table.data.getChild('city')?.get(0), 'Paris', 'returns Arrow column values');

  const parserLoader = await preload(UnbundledCSVLoader);
  t.equal(typeof parserLoader.parse, 'function', 'preload returns parser-bearing CSVLoader');
  t.equal(preloadSync(UnbundledCSVLoader), parserLoader, 'preloadSync returns cached CSVLoader');
  t.end();
});

test('CSVLoader#loadInBatches(numbers-100.csv)', async t => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false, batchSize: 40},
    csv: {shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
  });

  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow RecordBatch');
    // t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 3, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(numbers-10000.csv)', async t => {
  const iterator = await loadInBatches(CSV_NUMBERS_10000_URL, CSVLoader, {
    core: {worker: false, batchSize: 2000},
    csv: {shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow RecordBatch');
    // t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 5, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#loadInBatches(incidents.csv)', async t => {
  const iterator = await loadInBatches(CSV_INCIDENTS_URL_QUOTES, CSVLoader, {
    core: {worker: false},
    csv: {shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batchCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow RecordBatch');
    // t.comment(`BATCH: ${batch.length}`);
    batchCount++;
  }
  t.equal(batchCount, 1, 'Correct number of batches received');

  t.end();
});

test('CSVLoader#load(numbers-100.csv)', async t => {
  const table = await load(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false},
    csv: {shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
  });

  t.ok(table.data instanceof arrow.Table, 'returns arrow table');
  t.equal(table.data.numRows, 100, 'respects header detection and excludes header row');

  const zipColumn = table.data.getChildAt(1);
  t.equal(zipColumn?.get(0), '09857', 'retains leading zeroes by parsing as strings');

  const fieldTypeNames = table.data.schema.fields.map(field => field.type.toString());
  t.ok(
    fieldTypeNames.every(typeName => typeName === 'Utf8'),
    'all columns are Utf8'
  );

  t.end();
});

test('CSVLoader#load matches CSVLoader output across fixture cases', async t => {
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
    t.equal(csvShape, shape, `${name}: uses expected CSVLoader row shape`);
    const arrowTable = await load(url, CSVLoader, {
      core: {worker: false},
      csv: {...arrowOptions, shape: 'arrow-table'}
    });
    const arrowRows = materializeArrowTableRows(arrowTable, shape);

    t.deepEqual(arrowRows, csvLoaderTable.data, `${name}: arrow-table matches CSVLoader`);
  }

  t.end();
});

test('CSVLoader#parseInBatches matches CSVLoader output across fixture cases', async t => {
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
    t.deepEqual(arrowRows, csvLoaderRows, `${name}: arrow-table batches match CSVLoader`);
  }

  t.end();
});

test('CSVLoader#parse handles raw UTF-8 and quoted fields without string tokenization', async t => {
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

  t.equal(table.data.numRows, 4, 'returns all data rows');
  t.equal(table.data.numCols, 2, 'returns all columns');
  t.equal(table.data.getChild('name')?.get(0), 'Åsa', 'keeps non-ascii UTF-8 values');
  t.equal(table.data.getChild('note')?.get(0), 'mañana', 'keeps non-ascii UTF-8 values');
  t.equal(table.data.getChild('note')?.get(1), 'x,y', 'keeps delimiters inside quotes');
  t.equal(table.data.getChild('note')?.get(2), 'hello\nthere', 'keeps newlines inside quotes');
  t.equal(table.data.getChild('note')?.get(3), 'b"c', 'unescapes doubled quotes');

  t.end();
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

test('CSVLoader#parse byte path handles TSV, duplicate headers, and missing cells', async t => {
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

  t.deepEqual(
    table.data.schema.fields.map(field => field.name),
    ['a', 'a.1'],
    'deduplicates header names'
  );
  t.equal(table.data.getChild('a')?.get(0), '1', 'auto-detects tab delimiter');
  t.equal(table.data.getChild('a.1')?.get(0), '2', 'reads second tab-delimited column');
  t.equal(table.data.getChild('a')?.get(1), '3', 'reads rows with missing trailing cells');
  t.equal(table.data.getChild('a.1')?.get(1), null, 'marks missing trailing cells as null');

  t.end();
});

test('CSVLoader#parse only adds __parsed_extra for Papa-compatible extra cells', async t => {
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

  t.notOk(
    noExtraTable.data.getChild('__parsed_extra'),
    'does not add __parsed_extra when rows do not have extra cells'
  );

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

  t.ok(
    extraTable.data.getChild('__parsed_extra'),
    'adds __parsed_extra for Papa-compatible header rows with extra cells'
  );

  const headerlessExtraTable = await parse(extraBuffer.buffer, preloadedLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      header: false,
      skipEmptyLines: true
    }
  });

  t.notOk(
    headerlessExtraTable.data.getChild('__parsed_extra'),
    'does not add __parsed_extra when header object semantics are not requested'
  );

  t.end();
});

test('CSVLoader#loadInBatches(numbers-100.csv, utf8 columns)', async t => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false, batchSize: 40},
    csv: {shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow table batch');
    const fieldTypeNames = batch.data.schema.fields.map(field => field.type.toString());
    t.ok(
      fieldTypeNames.every(typeName => typeName === 'Utf8'),
      'all batch columns are Utf8'
    );

    rowCount += batch.data.numRows;
  }

  t.equal(rowCount, 100, 'returns all data rows across batches');

  t.end();
});

test('CSVLoader#load(numbers-100.csv, dynamicTyping true)', async t => {
  const table = await load(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      dynamicTyping: true
    }
  });

  t.ok(table.data instanceof arrow.Table, 'returns arrow table');
  t.equal(table.data.numRows, 100, 'respects header detection and excludes header row');

  const zipColumn = table.data.getChildAt(1);
  t.equal(zipColumn?.get(0), 9857, 'applies dynamic typing by default');

  const fieldTypeNames = table.data.schema.fields.map(field => field.type.toString());
  t.ok(
    fieldTypeNames.every(typeName => typeName === 'Float64'),
    'numeric columns are typed'
  );

  t.end();
});

test('CSVLoader#load(numbers-100.csv, dynamicTyping false)', async t => {
  const table = await load(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false},
    csv: {
      shape: 'arrow-table',
      dynamicTyping: false
    }
  });

  t.ok(table.data instanceof arrow.Table, 'returns arrow table');
  t.equal(table.data.numRows, 100, 'respects header detection and excludes header row');

  const zipColumn = table.data.getChildAt(1);
  t.equal(zipColumn?.get(0), '09857', 'keeps strings when dynamic typing is disabled');

  const fieldTypeNames = table.data.schema.fields.map(field => field.type.toString());
  t.ok(
    fieldTypeNames.every(typeName => typeName === 'Utf8'),
    'all columns are Utf8'
  );

  t.end();
});

test('CSVLoader#loadInBatches(numbers-100.csv, dynamicTyping true)', async t => {
  const iterator = await loadInBatches(CSV_NUMBERS_100_URL, CSVLoader, {
    core: {worker: false, batchSize: 40},
    csv: {
      shape: 'arrow-table',
      dynamicTyping: true
    }
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    t.ok(batch.data instanceof arrow.Table, 'returns arrow table batch');
    const fieldTypeNames = batch.data.schema.fields.map(field => field.type.toString());
    t.ok(
      fieldTypeNames.every(typeName => typeName === 'Float64'),
      'all batch columns are typed'
    );

    rowCount += batch.data.numRows;
  }

  t.equal(rowCount, 100, 'returns all data rows across batches');

  t.end();
});

test('CSVLoader#parseInBatches freezes schema after first typed batch', async t => {
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

  t.equal(batches.length, 2, 'returns one row per batch');

  const firstBatchColumnTypeName = batches[0]?.data.schema.fields[0]?.type.toString();
  const secondBatchColumnTypeName = batches[1]?.data.schema.fields[0]?.type.toString();
  t.equal(firstBatchColumnTypeName, 'Float64', 'first batch infers float64');
  t.equal(secondBatchColumnTypeName, 'Float64', 'second batch keeps frozen float64 schema');

  const firstBatchValue = batches[0]?.data.getChildAt(0)?.get(0);
  const secondBatchValue = batches[1]?.data.getChildAt(0)?.get(0);
  t.equal(firstBatchValue, 1, 'first batch keeps typed numeric value');
  t.equal(secondBatchValue, null, 'second batch coerces incompatible string value to null');

  t.end();
});

test('CSVLoader#worker transport serializes and hydrates Arrow table results', async t => {
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
  t.equal(serialized.shape, 'arrow-table', 'serialized result keeps table wrapper shape');
  t.equal(serialized.data.transport, 'arrow-js', 'serialized result uses Arrow JS transport');
  t.notOk(serialized.data.getChild, 'serialized data is plain transport payload');

  const hydrated = deserializeCSVWorkerResult(serialized) as ArrowTable;
  t.ok(hydrated.data instanceof arrow.Table, 'hydrated result restores real Arrow table');
  t.equal(hydrated.data.getChild('city')?.get(0), 'Paris', 'hydrated result keeps values');

  const serializedWithDeprecatedOption = serializeCSVWorkerResult(table, {
    workerTransferBufferCopy: 'none'
  } as any) as {data: {transport: string}};
  t.equal(
    serializedWithDeprecatedOption.data.transport,
    'arrow-js',
    'deprecated buffer copy option is accepted'
  );

  const plainResult = {shape: 'object-row-table', data: [{city: 'Paris'}]};
  t.equal(
    serializeCSVWorkerResult(plainResult),
    plainResult,
    'serialize leaves non-Arrow results untouched'
  );
  t.equal(
    deserializeCSVWorkerResult(plainResult),
    plainResult,
    'deserialize leaves non-Arrow results untouched'
  );

  t.end();
});
