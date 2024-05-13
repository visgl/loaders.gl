// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, TableBatch} from '@loaders.gl/schema';
import type {JSONLoaderOptions, MetadataBatch, JSONBatch} from '../../json-loader';
import {TableBatchBuilder} from '@loaders.gl/schema';
import {assert, makeTextDecoderIterator} from '@loaders.gl/loader-utils';
import StreamingJSONParser from '../json-parser/streaming-json-parser';
import JSONPath from '../jsonpath/jsonpath';

// TODO - support batch size 0 = no batching/single batch?
// eslint-disable-next-line max-statements, complexity
export async function* parseJSONInBatches(
  binaryAsyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options: JSONLoaderOptions
): AsyncIterable<TableBatch | MetadataBatch | JSONBatch> {
  const asyncIterator = makeTextDecoderIterator(binaryAsyncIterator);

  const {metadata} = options;
  const {jsonpaths} = options.json || {};

  let isFirstChunk: boolean = true;

  // @ts-expect-error TODO fix Schema deduction
  const schema: Schema = null;
  const tableBatchBuilder = new TableBatchBuilder(schema, options);

  const parser = new StreamingJSONParser({jsonpaths});

  for await (const chunk of asyncIterator) {
    const rows = parser.write(chunk);

    const jsonpath = rows.length > 0 && parser.getStreamingJsonPathAsString();

    if (rows.length > 0 && isFirstChunk) {
      if (metadata) {
        const initialBatch: TableBatch = {
          // Common fields
          shape: options?.json?.shape || 'array-row-table',
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
    const finalBatch: JSONBatch = {
      shape: 'json',
      batchType: 'final-result',
      container: parser.getPartialResult(),
      jsonpath: parser.getStreamingJsonPathAsString(),
      /** Data Just to avoid crashing? */
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
