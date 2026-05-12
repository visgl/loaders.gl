// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load, loadInBatches, isIterator, isAsyncIterable} from '@loaders.gl/core';
import {ObjectRowTableBatch, getTableLength} from '@loaders.gl/schema-utils';
import {
  JSONLoader,
  _FastJSONLoader as FastJSONLoader,
  _GeoJSONLoader as GeoJSONLoader
} from '@loaders.gl/json';
import type {JSONLoaderOptions} from '@loaders.gl/json';
import {JSONLoader as BundledJSONLoader} from '@loaders.gl/json/bundled';

const GEOJSON_PATH = '@loaders.gl/json/test/data/geojson-big.json';
const GEOJSON_KEPLER_DATASET_PATH = '@loaders.gl/json/test/data/kepler-dataset-sf-incidents.json';
const STREAMING_LOADER_CONFIGS: {name: string; options?: JSONLoaderOptions}[] = [
  {name: 'JSONLoader'},
  {name: 'JSONLoader json.backend=fast', options: {json: {backend: 'fast'}}}
];

test('JSONLoader#load(geojson.json)', async t => {
  const table = await load(GEOJSON_PATH, JSONLoader, {json: {table: true}});
  t.equal(
    table.shape === 'object-row-table' && table.data.length,
    308,
    'Correct number of rows received'
  );
  t.end();
});

test('JSONLoader#load(geojson.json, shape: arrow-table)', async t => {
  const arrowTable = await load(GEOJSON_PATH, JSONLoader, {
    json: {table: true, shape: 'arrow-table'}
  });
  t.equal(arrowTable.shape, 'arrow-table', 'Correct Arrow table type received');
  t.equal(arrowTable.data.numRows, 308, 'Correct number of Arrow rows received');
  t.equal(arrowTable.data.getChild('type')?.get(0), 'Feature', 'Arrow field values are preserved');
  t.end();
});

test('BundledJSONLoader#parse(ArrayBuffer, shape: arrow-table)', async t => {
  const arrayBuffer = new TextEncoder().encode(
    JSON.stringify({metadata: {name: 'features'}, features: [{id: 1}, {id: 2}]})
  ).buffer;
  const arrowTable = await BundledJSONLoader.parse(arrayBuffer, {
    json: {table: true, shape: 'arrow-table'}
  });

  t.equal(arrowTable.shape, 'arrow-table', 'Correct Arrow table type received');
  t.equal(arrowTable.data.numRows, 2, 'Correct number of Arrow rows received');
  t.equal(arrowTable.data.getChild('id')?.get(0), 1, 'Arrow field values are preserved');
  t.end();
});

test('FastJSONLoader#load(geojson.json)', async t => {
  const table = await load(GEOJSON_PATH, FastJSONLoader, {json: {table: true}});
  t.equal(
    table.shape === 'object-row-table' && table.data.length,
    308,
    'Correct number of rows received'
  );
  t.end();
});

test('FastJSONLoader#parse(ArrayBuffer)', async t => {
  const arrayBuffer = new TextEncoder().encode('[{"id": 1}, {"id": 2}]').buffer;
  const table = await FastJSONLoader.parse(arrayBuffer, {json: {table: true}});

  t.equal(table.shape, 'object-row-table', 'parsed JSON array as row table');
  t.equal(table.data.length, 2, 'parsed both rows');
  t.end();
});

test('FastJSONLoader#loadInBatches(jsonpaths)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, FastJSONLoader, {
    json: {jsonpaths: ['$.features']}
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    rowCount += batch.length;
    // @ts-ignore
    t.equal(batch.jsonpath?.toString(), '$.features', 'correct jsonpath on batch');
  }

  t.equal(rowCount, 308, 'Correct number of row received');
  t.end();
});

for (const config of STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(geojson.json, rows, batchSize = auto)`, async t => {
    const iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config)
    );
    t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

    let batch;
    let batchCount = 0;
    let rowCount = 0;
    for await (batch of iterator) {
      batchCount++;
      rowCount += batch.length;
    }

    t.ok(batchCount <= 4, 'Correct number of batches received');
    t.equal(rowCount, 308, 'Correct number of row received');
    t.end();
  });

  test(`${config.name}#loadInBatches(geojson.json, rows, batchSize = 10)`, async t => {
    const iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        batchSize: 10
      })
    );
    t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

    let batch;
    let batchCount = 0;
    let rowCount = 0;
    for await (batch of iterator) {
      if (batchCount < 30) {
        t.equal(batch.length, 10, `Got correct batch size for batch ${batchCount}`);
      }

      const feature = batch.data[0];
      t.equal(feature.type, 'Feature', 'row 0 valid');
      t.equal(feature.geometry.type, 'Point', 'row 0 valid');

      batchCount++;
      rowCount += batch.length;
    }

    const lastFeature = batch.data[batch.data.length - 1];
    t.equal(lastFeature.type, 'Feature', 'row 0 valid');
    t.equal(lastFeature.properties.name, 'West Oakland (WOAK)', 'row 0 valid');

    t.equal(batchCount, 31, 'Correct number of batches received');
    t.equal(rowCount, 308, 'Correct number of row received');
    t.end();
  });
}

test('JSONLoader#parseInBatches(complete rows with nested arrays)', async t => {
  const valueCount = 2048;
  const rows = Array.from({length: 3}, (_, rowIndex) => ({
    text: `row-${rowIndex}`,
    values: Array.from({length: valueCount}, (_, valueIndex) => rowIndex * valueCount + valueIndex)
  }));

  const iterator = BundledJSONLoader.parseInBatches?.(
    makeChunkedTextIterator(JSON.stringify(rows), 128),
    {
      batchSize: 1
    }
  );

  t.ok(iterator, 'parseInBatches returned iterator');
  if (!iterator) {
    t.end();
    return;
  }

  let emittedRowCount = 0;
  for await (const batch of iterator) {
    if (batch.batchType === 'data') {
      t.equal(batch.length, 1, 'fixed-size batch contains one complete row');
      for (const row of batch.data) {
        const expectedFirstValue = emittedRowCount * valueCount;
        emittedRowCount++;
        t.equal(row.values.length, valueCount, 'nested values array is complete when emitted');
        t.equal(row.values[0], expectedFirstValue, 'first nested value is preserved');
        t.equal(
          row.values[valueCount - 1],
          expectedFirstValue + valueCount - 1,
          'last nested value is preserved'
        );
      }
    }
  }

  t.equal(emittedRowCount, rows.length, 'all rows were emitted');
  t.end();
});

for (const config of STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(jsonpaths)`, async t => {
    let iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        json: {jsonpaths: ['$.features']}
      })
    );

    let rowCount = 0;
    for await (const batch of iterator) {
      rowCount += batch.length;
      // @ts-ignore
      t.equal(batch.jsonpath?.toString(), '$.features', 'correct jsonpath on batch');
    }

    t.equal(rowCount, 308, 'Correct number of row received');

    iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {json: {jsonpaths: ['$.featureTypo']}})
    );

    rowCount = 0;
    for await (const batch of iterator) {
      rowCount += batch.length;
    }

    t.equal(rowCount, 0, 'Correct number of row received');
    t.end();
  });
}

for (const config of STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(jsonpaths, shape: arrow-table)`, async t => {
    const iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        json: {jsonpaths: ['$.features'], shape: 'arrow-table'}
      })
    );

    let rowCount = 0;
    let dataBatchCount = 0;
    for await (const batch of iterator) {
      if (batch.shape === 'arrow-table') {
        dataBatchCount++;
        rowCount += batch.data.numRows;
        // @ts-ignore
        t.equal(batch.jsonpath?.toString(), '$.features', 'correct jsonpath on Arrow batch');
      }
    }

    t.ok(dataBatchCount > 0, 'received Arrow data batches');
    t.equal(rowCount, 308, 'Correct number of Arrow rows received');
    t.end();
  });
}

test('GeoJSONLoader#loadInBatches(jsonpaths)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, GeoJSONLoader, {
    json: {jsonpaths: ['$.features']}
  });

  let rowCount = 0;
  for await (const batch of iterator) {
    rowCount += batch.length;
    // @ts-ignore
    t.equal(batch.jsonpath?.toString(), '$.features', 'correct jsonpath on batch');
  }

  t.equal(rowCount, 308, 'Correct number of row received');
  t.end();
});

// TODO - columnar table batch support not yet fixed
/*
test('JSONLoader#loadInBatches(geojson.json, columns, batchSize = auto)', async t => {
  const iterator = await loadInBatches(GEOJSON_PATH, JSONLoader, {
    json: {
      TableBatch: ColumnarTableBatch
    }
  });
  t.ok(isIterator(iterator) || isAsyncIterable(iterator), 'loadInBatches returned iterator');

  let batch;
  let batchCount = 0;
  let rowCount = 0;
  for await (batch of iterator) {
    batchCount++;
    rowCount += batch.length;
  }

  t.ok(batchCount <= 3, 'Correct number of batches received');
  t.equal(rowCount, 308, 'Correct number of row received');
  t.end();
});
*/

async function testContainerBatches(t, iterator, expectedCount) {
  let opencontainerBatchCount = 0;
  let closecontainerBatchCount = 0;

  for await (const batch of iterator) {
    switch (batch.batchType) {
      case 'partial-result':
        t.ok(batch.container.type, 'batch.container should be set on partial-result');
        opencontainerBatchCount++;
        break;
      case 'final-result':
        t.ok(batch.container.type, 'batch.container should be set on final-result');
        closecontainerBatchCount++;
        break;
      default:
        t.notOk(batch.container, 'batch.container should not be set');
    }
  }

  t.equal(opencontainerBatchCount, expectedCount, 'partial-result batch as expected');
  t.equal(closecontainerBatchCount, expectedCount, 'final-result batch as expected');
}

for (const config of STREAMING_LOADER_CONFIGS) {
  test(`${config.name}#loadInBatches(geojson.json, {metadata: true})`, async t => {
    let iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        metadata: true,
        json: {table: true}
      })
    );
    await testContainerBatches(t, iterator, 1);

    iterator = await loadInBatches(
      GEOJSON_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        metadata: false,
        json: {table: true}
      })
    );
    await testContainerBatches(t, iterator, 0);

    t.end();
  });

  test(`${config.name}#loadInBatches(streaming array of arrays)`, async t => {
    const iterator = await loadInBatches(
      GEOJSON_KEPLER_DATASET_PATH,
      JSONLoader,
      getStreamingLoaderOptions(config, {
        metadata: true,
        json: {
          table: true,
          jsonpaths: ['$.data.allData']
        }
      })
    );

    let rowCount = 0;
    for await (const batch of iterator) {
      switch (batch.batchType) {
        case 'metadata':
        case 'partial-result':
          break;
        case 'data':
          const rowBatch = batch as ObjectRowTableBatch;
          rowCount += getTableLength(rowBatch);
          break;
        case 'final-result':
          if (batch.shape === 'json') {
            t.ok(batch.container, 'final batch contains json');
          }
          break;
        default:
      }
    }
    t.equal(rowCount, 247, '247 rows found');

    t.end();
  });
}

/** Merges scenario options with the streaming parser backend under test. */
function getStreamingLoaderOptions(
  config: {options?: JSONLoaderOptions},
  options: JSONLoaderOptions = {}
): JSONLoaderOptions {
  return {
    ...config.options,
    ...options,
    json: {...config.options?.json, ...options.json}
  };
}

/** Emits UTF-8 JSON text chunks for streaming parser tests. */
async function* makeChunkedTextIterator(text: string, chunkSize: number) {
  const textEncoder = new TextEncoder();
  for (let index = 0; index < text.length; index += chunkSize) {
    yield textEncoder.encode(text.slice(index, index + chunkSize));
  }
}
