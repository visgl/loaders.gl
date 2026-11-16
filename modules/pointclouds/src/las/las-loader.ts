// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  paceBatchIterator,
  type CoreAPI,
  type LoaderWithParser
} from '@loaders.gl/core/loader-utils';
import {LASSource, type LASSourceOptions} from './las-source';
import type {Table, RecordBatch} from 'apache-arrow';
import {
  convertMeshToArrowTable,
  convertTableToMesh,
  isNativeArrowTable,
  makeArrowMetadataBatch
} from '@loaders.gl/core/schema-utils';
import {
  formatLASMeshColors,
  getLASShape,
  LAS_LOADER_METADATA,
  LAS_SOURCE_METADATA,
  type LASLoaderOptions
} from './las-loader-shared';
import {
  serializeNativeArrowWorkerResult,
  deserializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import type {LASMesh} from './lib/las-types';
import {
  decodeLAZChunkToArrowTable,
  parseLAS,
  parseLASHeader,
  makeEmptyLASBatch,
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
  dataType: null as unknown as LASMesh | LASArrowTable,
  batchType: null as unknown as LASMesh | LASArrowTable,
  worker: true,
  workerInBatches: true,
  serializeWorkerResult: serializeLASWorkerTable,
  serializeWorkerBatch: serializeLASWorkerTable,
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
  LASMesh | LASArrowTable,
  LASMesh | LASArrowTable,
  LASLoaderOptions
>;

/** Parse a complete LAS file or an internal standalone worker chunk request. */
function parseLASTable(arrayBuffer: ArrayBuffer, options?: LASLoaderOptions): LASArrowTable {
  const chunkRequest = (options as LASWorkerOptions | undefined)?.las?._chunk;
  return chunkRequest
    ? decodeLAZChunkToArrowTable(arrayBuffer, chunkRequest.metadata, options || {})
    : parseLAS(arrayBuffer, options);
}

function convertLASMesh(table: LASArrowTable, options?: LASLoaderOptions): LASMesh | LASArrowTable {
  const formattedTable =
    options?.las?.colorFormat === undefined || options.las.colorFormat === 'uint8norm'
      ? table
      : {
          data: convertMeshToArrowTable(
            formatLASMeshColors(convertTableToMesh(table.data) as LASMesh, options.las.colorFormat)
          ),
          loader: table.loader,
          loaderData: table.loaderData,
          progress: table.progress
        };
  if (getLASShape(options) === 'arrow') {
    return formattedTable;
  }
  return {
    ...(convertTableToMesh(formattedTable.data) as LASMesh),
    loader: formattedTable.loader,
    loaderData: formattedTable.loaderData,
    progress: formattedTable.progress
  } as LASMesh & {progress?: number};
}

async function* convertLASMeshBatches(
  tableBatches: AsyncIterable<LASArrowTable>,
  options?: LASLoaderOptions
): AsyncIterable<LASMesh | LASArrowTable> {
  for await (const table of paceBatchIterator(tableBatches, {
    batchMaxRowsPerSecond: options?.core?.batchMaxRowsPerSecond,
    getRowCount: batch => batch.data.numRows,
    signal: options?.signal
  })) {
    yield convertLASMesh(table, options);
  }
}

/** Transfers native columns and clones the typed header needed for legacy mesh output. */
function serializeLASWorkerTable(result: LASMesh | LASArrowTable): unknown {
  if ('attributes' in result) throw new Error('LAS workers require Arrow columns');
  return {
    columns: serializeNativeArrowWorkerResult(result.data),
    loaderData: structuredClone(result.loaderData),
    progress: result.progress
  };
}

/** Hydrates transferred columns and applies the requested mesh and color representation on the caller. */
function deserializeLASWorkerTable(
  result: unknown,
  options?: LASLoaderOptions
): LASMesh | LASArrowTable {
  const payload = result as {
    columns: unknown;
    loaderData: LASArrowTable['loaderData'];
    progress?: number;
  };
  const table = deserializeNativeArrowWorkerResult(payload.columns);
  if (!isNativeArrowTable(table)) throw new Error('LAS workers require an Arrow table');
  return convertLASMesh(
    {data: table, loader: 'las', loaderData: payload.loaderData, progress: payload.progress},
    options
  );
}

const {
  serializeWorkerResult: _serializeLASWorkerResult,
  serializeWorkerBatch: _serializeLASWorkerBatch,
  ...LASColumnLoaderForCaller
} = LASColumnLoader;

/** Exposes native Arrow while retaining the column worker and mesh compatibility paths. */
export const LASLoaderWithParser = {
  ...LASColumnLoaderForCaller,
  ...LAS_SOURCE_METADATA,
  /** Creates a sequential query source using the same LAS decoder. */
  createDataSourceSync: (data: string | Blob, options: LASSourceOptions, coreApi?: CoreAPI) =>
    new LASSource(data, options, coreApi),
  dataType: LAS_LOADER_METADATA.dataType,
  batchType: LAS_LOADER_METADATA.batchType,
  parse: async (input: ArrayBuffer, options?: LASLoaderOptions) =>
    toPublicLASResult(await LASColumnLoader.parse(input, options)),
  parseSync: (input: ArrayBuffer, options?: LASLoaderOptions) =>
    toPublicLASResult(LASColumnLoader.parseSync(input, options)),
  async *parseInBatches(input, options) {
    for await (const result of LASColumnLoader.parseInBatches(input, options)) {
      if (!('attributes' in result)) yield* getLASRecordBatches(toPublicLASResult(result));
      else yield result;
    }
  },
  deserializeWorkerResult: (result: unknown, options?: LASLoaderOptions) =>
    toPublicLASResult(deserializeLASWorkerTable(result, options)),
  deserializeWorkerBatch(result: unknown, options?: LASLoaderOptions) {
    const decoded = deserializeLASWorkerTable(result, options);
    return 'attributes' in decoded ? decoded : getLASRecordBatches(toPublicLASResult(decoded))[0];
  }
} as const satisfies LoaderWithParser<
  LASMesh | Table,
  LASMesh | RecordBatch,
  LASLoaderOptions,
  LASSource
>;

/** Unwraps the Arrow table with its complete file header. */
export function toPublicLASResult(result: LASArrowTable): Table;
export function toPublicLASResult(result: LASMesh | LASArrowTable): LASMesh | Table;
export function toPublicLASResult(result: LASMesh | LASArrowTable): LASMesh | Table {
  if ('attributes' in result) return result;
  const header = JSON.stringify(result.loaderData, (_key, value) =>
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
export function getLASRecordBatches(table: Table): RecordBatch[] {
  return table.batches.length ? table.batches : [makeArrowMetadataBatch(table.schema)];
}

/** Builds a schema-only table from complete header bytes without decoding any points. */
export function parseLASMetadata(bytes: ArrayBuffer, options: LASLoaderOptions): Table {
  const header = parseLASHeader(bytes);
  const empty = makeEmptyLASBatch(header, options);
  return toPublicLASResult(
    convertLASMesh(empty, {...options, las: {...options.las, shape: 'arrow'}})
  ) as Table;
}
