// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, RecordBatch} from 'apache-arrow';
import {
  deserializeArrowWorkerTable,
  serializeArrowWorkerTable,
  deserializeNativeArrowWorkerResult,
  serializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import {
  serializeBinaryJSON,
  deserializeBinaryJSON,
  type BinaryJSONResult
} from './json-binary-transport';
import type {LoaderOptions} from '@loaders.gl/core/loader-utils';
import {normalizeJSONArrowSchema, type JSONArrowSchema} from './parsers/convert-row-table-to-arrow';

/** Converts Arrow Schema instances to portable schemas without changing caller-owned options. */
export function serializeJSONWorkerOptions(options: LoaderOptions): LoaderOptions {
  const portableOptions: LoaderOptions = {...options};
  for (const namespace of ['json', 'ndjson'] as const) {
    const parserOptions = options[namespace] as {schema?: JSONArrowSchema} | undefined;
    if (parserOptions?.schema) {
      portableOptions[namespace] = {
        ...parserOptions,
        schema: normalizeJSONArrowSchema(parserOptions.schema)
      };
    }
  }
  return portableOptions;
}

/** Owns all outgoing Arrow buffers so retained parser state cannot be detached by a transfer. */
export function serializeJSONWorkerBatch(batch: unknown): unknown {
  if (batch instanceof Table || batch instanceof RecordBatch) {
    return serializeNativeArrowWorkerResult(batch);
  }
  return (batch as {shape?: string})?.shape === 'arrow-table'
    ? serializeArrowWorkerTable(batch)
    : serializeBinaryJSON(batch);
}

/** Hydrates transferred columns or decodes binary JSON on the caller. */
export function deserializeJSONWorkerResult(result: unknown) {
  if ((result as BinaryJSONResult)?.transport === 'json-utf8') {
    return deserializeBinaryJSON(result as BinaryJSONResult);
  }
  const transport = (result as {transport?: string})?.transport;
  if (transport === 'arrow-record-batch' || transport === 'arrow-table-columns') {
    return deserializeNativeArrowWorkerResult(result);
  }
  return deserializeArrowWorkerTable(result);
}
