import {TableBatchBuilder} from '@loaders.gl/tables';
import StreamingJSONParser from './parser/streaming-json-parser';

// TODO - support batch size 0 = no batching/single batch?
// eslint-disable-next-line max-statements
export default async function* parseJSONInBatches(asyncIterator, options) {
  const {batchSize} = options.json;
  const TableBatchType = options.json.TableBatch;

  let isFirstChunk = true;
  let tableBatchBuilder = null;
  let schema = null;

  const parser = new StreamingJSONParser();
  tableBatchBuilder = tableBatchBuilder || new TableBatchBuilder(TableBatchType, schema, batchSize);

  for await (const chunk of asyncIterator) {
    const rows = parser.write(chunk);

    if (isFirstChunk) {
      console.log(parser.getPartialObject());
      debugger; // eslint-disable-line
      isFirstChunk = false;
      schema = deduceSchema(rows);
    }

    // Add the row
    for (const row of rows) {
      tableBatchBuilder.addRow(row);
      // If a batch has been completed, emit it
      if (tableBatchBuilder.isFull()) {
        yield tableBatchBuilder.getNormalizedBatch();
      }
    }

    tableBatchBuilder.chunkComplete();
    if (tableBatchBuilder.isFull()) {
      yield tableBatchBuilder.getNormalizedBatch();
    }
  }

  // yield final batch
  const batch = tableBatchBuilder.getNormalizedBatch();
  if (batch) {
    yield batch;
  }
}

function deduceSchema(rows) {
  const row = rows[0];

  const schema = {};
  let i = 0;
  for (const columnName in row) {
    const value = row[columnName];
    switch (typeof value) {
      case 'number':
      case 'boolean':
        // TODO - booleans could be handled differently...
        schema[columnName] = {name: String(columnName), index: i, type: Float32Array};
        break;

      case 'object':
        schema[columnName] = {name: String(columnName), index: i, type: Array};
        break;

      case 'string':
      default:
        schema[columnName] = {name: String(columnName), index: i, type: Array};
      // We currently only handle numeric rows
      // TODO we could offer a function to map strings to numbers?
    }
    i++;
  }
  return schema;
}
