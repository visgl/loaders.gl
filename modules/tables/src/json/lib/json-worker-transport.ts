// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  serializeBinaryJSON,
  deserializeBinaryJSON,
  type BinaryJSONResult
} from './json-binary-transport';
import type {LoaderOptions} from '@loaders.gl/core/loader-utils';
import {
  serializeArrowTableResult,
  deserializeArrowTableBatch
} from '../../arrow/lib/arrow-worker-transport';
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
  return (batch as {shape?: string})?.shape === 'arrow-table'
    ? serializeArrowTableResult(batch)
    : serializeBinaryJSON(batch);
}

/** Hydrates transferred columns or decodes binary JSON on the caller. */
export function deserializeJSONWorkerResult(result: unknown) {
  if ((result as BinaryJSONResult)?.transport === 'json-utf8') {
    return deserializeBinaryJSON(result as BinaryJSONResult);
  }
  return deserializeArrowTableBatch(result);
}
