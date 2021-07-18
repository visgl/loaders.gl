import type {Batch} from '@loaders.gl/schema';
import type {JSONLoaderOptions} from '../json-loader';
import {TableBatchBuilder} from '@loaders.gl/schema';
import {assert, makeTextDecoderIterator} from '@loaders.gl/loader-utils';
import StreamingJSONParser from './parser/streaming-json-parser';
import JSONPath from './jsonpath/jsonpath';

// TODO - support batch size 0 = no batching/single batch?
// eslint-disable-next-line max-statements, complexity
export default async function* parseJSONInBatches(
  binaryAsyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options: JSONLoaderOptions
): AsyncIterable<Batch> {
  const asyncIterator = makeTextDecoderIterator(binaryAsyncIterator);

  const {metadata} = options;
  const {jsonpaths} = options.json || {};

  let isFirstChunk: boolean = true;

  // TODO fix Schema deduction
  const schema = null; // new Schema([]);
  const shape = options?.json?.shape || 'row-table';
  // @ts-ignore
  const tableBatchBuilder = new TableBatchBuilder(schema, {
    ...options,
    shape
  });

  const parser = new StreamingJSONParser({jsonpaths});

  for await (const chunk of asyncIterator) {
    const rows = parser.write(chunk);

    const jsonpath = rows.length > 0 && parser.getStreamingJsonPathAsString();

    if (rows.length > 0 && isFirstChunk) {
      if (metadata) {
        const initialBatch: Batch = {
          // Common fields
          shape,
          batchType: 'partial-result',
          data: [],
          length: 0,
          bytesUsed: 0,
          // JSON additions
          container: parser.getPartialResult(),
          jsonpath
        };
        yield initialBatch;
      }
      isFirstChunk = false;
      // schema = deduceSchema(rows);
    }

    // Add the row
    for (const row of rows) {
      tableBatchBuilder.addRow(row);
      // If a batch has been completed, emit it
      const batch = tableBatchBuilder.getFullBatch({jsonpath});
      if (batch) {
        yield batch;
      }
    }

    tableBatchBuilder.chunkComplete(chunk);
    const batch = tableBatchBuilder.getFullBatch({jsonpath});
    if (batch) {
      yield batch;
    }
  }

  // yield final batch
  const jsonpath = parser.getStreamingJsonPathAsString();
  const batch = tableBatchBuilder.getFinalBatch({jsonpath});
  if (batch) {
    yield batch;
  }

  if (metadata) {
    const finalBatch: Batch = {
      shape,
      batchType: 'final-result',
      container: parser.getPartialResult(),
      jsonpath: parser.getStreamingJsonPathAsString(),
      data: [],
      length: 0
      // schema: null
    };
    yield finalBatch;
  }
}

export function rebuildJsonObject(batch, data) {
  // Last batch will have this special type and will provide all the root object of the parsed file
  assert(batch.batchType === 'final-result');

  // The streamed JSON data is a top level array (jsonpath = '$'), just return the array of row objects
  if (batch.jsonpath === '$') {
    return data;
  }

  // (jsonpath !== '$') The streamed data is not a top level array, so stitch it back in to the top-level object
  if (batch.jsonpath && batch.jsonpath.length > 1) {
    const topLevelObject = batch.container;
    const streamingPath = new JSONPath(batch.jsonpath);
    streamingPath.setFieldAtPath(topLevelObject, data);
    return topLevelObject;
  }

  // No jsonpath, in this case nothing was streamed.
  return batch.container;
}
