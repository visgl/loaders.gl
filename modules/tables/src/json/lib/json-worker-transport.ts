// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/core/loader-utils';
import {serializeArrowWorkerResult} from '@loaders.gl/core/schema-utils/arrow-transport';
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
  return serializeArrowWorkerResult(batch, {core: {workerTransferBufferCopy: 'all'}});
}
