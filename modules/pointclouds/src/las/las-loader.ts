// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {paceBatchIterator, type LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import {makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import type {MeshArrowTable} from '@loaders.gl/core/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/core/schema-utils';
import {
  formatLASMeshColors,
  getLASShape,
  LAS_LOADER_METADATA,
  type LASLoaderOptions
} from './las-loader-shared';
import {
  serializeArrowWorkerTable,
  deserializeArrowWorkerTable
} from '@loaders.gl/core/arrow-worker-transport';
import type {LASMesh} from './lib/las-types';
import {
  decodeLAZChunkToArrowTable,
  parseLAS,
  parseLASInBatches,
  type LASArrowTable,
  type LAZChunkArrowTableMetadata
} from './lib/typescript/parse-las';

type LASWorkerChunkRequest = {
  metadata: LAZChunkArrowTableMetadata;
};

type LASWorkerOptions = LASLoaderOptions & {
  las?: LASLoaderOptions['las'] & {
    _chunk?: LASWorkerChunkRequest;
  };
};

/** Parser-bearing TypeScript-only LAS loader implementation. */
export const LASColumnLoader = {
  ...LAS_LOADER_METADATA,
  dataType: null as unknown as LASMesh | MeshArrowTable,
  batchType: null as unknown as LASMesh | MeshArrowTable,
  worker: true,
  workerInBatches: true,
  serializeWorkerResult: serializeArrowWorkerTable,
  serializeWorkerBatch: serializeArrowWorkerTable,
  deserializeWorkerResult: deserializeLASWorkerTable,
  deserializeWorkerBatch: deserializeLASWorkerTable,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    convertLASMesh(parseLASTable(arrayBuffer, options), options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    convertLASMesh(parseLASTable(arrayBuffer, options), options),
  parseInBatches: async function* (arrayBufferIterator, options?: LASLoaderOptions) {
    yield* convertLASMeshBatches(parseLASInBatches(arrayBufferIterator, options), options);
  }
} as const satisfies LoaderWithParser<
  LASMesh | MeshArrowTable,
  LASMesh | MeshArrowTable,
  LASLoaderOptions
>;

/** Parse a complete LAS file or an internal standalone worker chunk request. */
function parseLASTable(arrayBuffer: ArrayBuffer, options?: LASLoaderOptions): LASArrowTable {
  const chunkRequest = (options as LASWorkerOptions | undefined)?.las?._chunk;
  return chunkRequest
    ? decodeLAZChunkToArrowTable(arrayBuffer, chunkRequest.metadata, options || {})
    : parseLAS(arrayBuffer, options);
}

function convertLASMesh(
  table: LASArrowTable,
  options?: LASLoaderOptions
): LASMesh | MeshArrowTable {
  const formattedTable =
    options?.las?.colorFormat === undefined || options.las.colorFormat === 'uint8norm'
      ? table
      : {
          ...convertMeshToTable(
            formatLASMeshColors(convertTableToMesh(table) as LASMesh, options.las.colorFormat),
            'arrow-table'
          ),
          loader: table.loader,
          loaderData: table.loaderData,
          progress: table.progress
        };
  if (getLASShape(options) === 'arrow') {
    return formattedTable;
  }
  return {
    ...(convertTableToMesh(formattedTable) as LASMesh),
    loader: formattedTable.loader,
    loaderData: formattedTable.loaderData,
    progress: formattedTable.progress
  } as LASMesh & {progress?: number};
}

async function* convertLASMeshBatches(
  tableBatches: AsyncIterable<LASArrowTable>,
  options?: LASLoaderOptions
): AsyncIterable<LASMesh | MeshArrowTable> {
  for await (const table of paceBatchIterator(tableBatches, {
    batchMaxRowsPerSecond: options?.core?.batchMaxRowsPerSecond,
    getRowCount: batch => batch.data.numRows,
    signal: options?.signal
  })) {
    yield convertLASMesh(table, options);
  }
}

/** Hydrates transferred columns and applies the requested mesh and color representation on the caller. */
function deserializeLASWorkerTable(
  result: unknown,
  options?: LASLoaderOptions
): LASMesh | MeshArrowTable {
  return convertLASMesh(deserializeArrowWorkerTable(result), options);
}

/** Exposes native Arrow while retaining the column worker and mesh compatibility paths. */
export const LASLoaderWithParser = {
  ...LASColumnLoader,
  dataType: LAS_LOADER_METADATA.dataType,
  batchType: LAS_LOADER_METADATA.batchType,
  parse: async (input: ArrayBuffer, options?: LASLoaderOptions) =>
    toPublicLASResult(await LASColumnLoader.parse(input, options)),
  parseSync: (input: ArrayBuffer, options?: LASLoaderOptions) =>
    toPublicLASResult(LASColumnLoader.parseSync(input, options)),
  async *parseInBatches(input, options) {
    for await (const result of LASColumnLoader.parseInBatches(input, options)) {
      if ('shape' in result) yield* getLASRecordBatches(result);
      else yield result;
    }
  },
  deserializeWorkerResult: (result: unknown, options?: LASLoaderOptions) =>
    toPublicLASResult(deserializeLASWorkerTable(result, options)),
  deserializeWorkerBatch(result: unknown, options?: LASLoaderOptions) {
    const decoded = deserializeLASWorkerTable(result, options);
    return 'shape' in decoded ? getLASRecordBatches(decoded)[0] : decoded;
  }
} as const satisfies LoaderWithParser<LASMesh | Table, LASMesh | RecordBatch, LASLoaderOptions>;

/** Unwraps the Arrow table with its complete file header. */
export function toPublicLASResult(result: LASMesh | MeshArrowTable): LASMesh | Table {
  if (!('shape' in result)) return result;
  const header = JSON.stringify((result as LASArrowTable).loaderData, (_key, value) =>
    typeof value === 'bigint'
      ? value.toString()
      : ArrayBuffer.isView(value)
        ? Array.from(value as Uint8Array)
        : value
  );
  if (header) {
    result.data.schema.metadata.set('loaders.gl.las.header', header);
    for (const batch of result.data.batches)
      batch.schema.metadata.set('loaders.gl.las.header', header);
  }
  return result.data;
}

/** Unwraps the record batches, retaining schema on empty LAS results. */
export function getLASRecordBatches(result: MeshArrowTable): RecordBatch[] {
  const table = toPublicLASResult(result) as Table;
  return table.batches.length ? table.batches : [makeArrowMetadataBatch(table.schema)];
}
