"use strict";var AsyncQueue;module.link('@loaders.gl/experimental',{AsyncQueue(v){AsyncQueue=v}},0);var TableBatchBuilder,RowTableBatch;module.link('@loaders.gl/experimental/categories/table',{TableBatchBuilder(v){TableBatchBuilder=v},RowTableBatch(v){RowTableBatch=v}},1);var Papa;module.link('./papaparse/papaparse',{default(v){Papa=v}},2);var AsyncIteratorStreamer;module.link('./papaparse/async-iterator-streamer',{default(v){AsyncIteratorStreamer=v}},3);




module.exportDefault({
  name: 'CSV',
  extensions: ['csv'],
  testText: null,
  parseInBatches: parseCSVInBatches,
  options: {
    TableBatch: RowTableBatch
  }
});

// TODO - support batch size 0 = no batching/single batch?
function parseCSVInBatches(asyncIterator, options) {
  // options
  const {batchSize = 10} = options;

  const TableBatchType = options.TableBatch;
  const asyncQueue = new AsyncQueue();

  let isFirstRow = true;
  let headerRow = null;
  let tableBatchBuilder = null;
  let schema = null;

  const config = {
    download: false, // We handle loading, no need for papaparse to do it for us
    dynamicTyping: true, // Convert numbers and boolean values in rows from strings
    header: false, // Unfortunately, header detection is not automatic and does not infer types

    // chunk(results, parser) {
    //   // TODO batch before adding to queue.
    //   console.log('Chunk:', results, parser);
    //   asyncQueue.enqueue(results.data);
    // },

    // step is called on every row
    step(results, parser) {
      const row = results.data;

      // Check if we need to save a header row
      if (isFirstRow && !headerRow) {
        if (isHeaderRow(row)) {
          headerRow = row;
          return;
        }
      }

      // If first data row, we can deduce the schema
      if (isFirstRow) {
        isFirstRow = false;
        schema = deduceSchema(row, headerRow);
      }

      // Add the row
      tableBatchBuilder =
        tableBatchBuilder || new TableBatchBuilder(TableBatchType, schema, batchSize);

      tableBatchBuilder.addRow(row);
      // If a batch has been completed, emit it
      if (tableBatchBuilder.isFull()) {
        asyncQueue.enqueue(tableBatchBuilder.getNormalizedBatch());
      }
    },

    // complete is called when all rows have been read
    complete(results, file) {
      // Ensure any final (partial) batch gets emitted
      const batch = tableBatchBuilder.getNormalizedBatch();
      if (batch) {
        asyncQueue.enqueue(batch);
      }
      asyncQueue.close();
    }
  };

  Papa.parse(asyncIterator, config, AsyncIteratorStreamer);

  // TODO - Does it matter if we return asyncIterable or asyncIterator
  // return asyncQueue[Symbol.asyncIterator]();
  return asyncQueue;
}

function isHeaderRow(row) {
  return row.every(value => typeof value === 'string');
}

function deduceSchema(row, headerRow) {
  const schema = {};
  for (let i = 0; i < row.length; i++) {
    const columnName = (headerRow && headerRow[i]) || String(i);
    const value = row[i];
    switch (typeof value) {
      case 'number':
      case 'boolean':
        // TODO - booleans could be handled differently...
        schema[columnName] = {name: columnName, type: Float32Array};
        break;
      case 'string':
      default:
        schema[columnName] = {name: columnName, type: Array};
      // We currently only handle numeric rows
      // TODO we could offer a function to map strings to numbers?
    }
  }
  return schema;
}
