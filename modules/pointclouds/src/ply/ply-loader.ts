// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, type RecordBatch} from 'apache-arrow';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {isNativeArrowTable, makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import {
  deserializeNativeArrowWorkerResult,
  serializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import type {PLYMesh} from './lib/ply-types';
import {convertPLYTableToMesh, parsePLYTable, parsePLYNativeBatches} from './lib/parse-ply-output';
import {PLYLoader as PLYLoaderMetadata, type PLYLoaderOptions} from './ply-loader-types';

const {preload: _PLYLoaderPreload, ...PLYLoaderMetadataWithoutPreload} = PLYLoaderMetadata;

/** Loader for PLY polygon meshes and point clouds. */
export const PLYLoaderWithParser = {
  ...PLYLoaderMetadataWithoutPreload,
  parse: async (input, options) => parsePLYOutput(input, options),
  parseTextSync: parsePLYOutput,
  parseSync: parsePLYOutput,
  async *parseInBatches(input, options) {
    for await (const batch of parsePLYNativeBatches(input, options)) {
      yield options?.ply?.shape === 'arrow'
        ? batch
        : convertPLYTableToMesh(new Table(batch.schema, [batch]));
    }
  },
  serializeWorkerResult: result => serializeNativeArrowWorkerResult(result as Table),
  serializeWorkerBatch: result => serializeNativeArrowWorkerResult(result as RecordBatch),
  deserializeWorkerResult(result: unknown, options?: PLYLoaderOptions) {
    const table = deserializeNativeArrowWorkerResult(result);
    if (!isNativeArrowTable(table)) throw new Error('PLY worker requires an Arrow table');
    return options?.ply?.shape === 'mesh' ? convertPLYTableToMesh(table) : table;
  },
  deserializeWorkerBatch(result: unknown, options?: PLYLoaderOptions) {
    const value = deserializeNativeArrowWorkerResult(result);
    const batch = isNativeArrowTable(value)
      ? (value.batches[0] ?? makeArrowMetadataBatch(value.schema))
      : value;
    return options?.ply?.shape === 'mesh'
      ? convertPLYTableToMesh(new Table(batch.schema, [batch]))
      : batch;
  }
} as const satisfies LoaderWithParser<PLYMesh | Table, PLYMesh | RecordBatch, PLYLoaderOptions>;

/** Decodes the requested PLY table or mesh layout. */
function parsePLYOutput(input: ArrayBuffer | string, options?: PLYLoaderOptions): PLYMesh | Table {
  const table = parsePLYTable(input, options);
  return options?.ply?.shape === 'arrow' ? table : convertPLYTableToMesh(table);
}
