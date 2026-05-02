// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {extractLoadLibraryOptions} from '@loaders.gl/worker-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import type {DracoMesh} from './lib/draco-types';
import type {DracoParseOptions} from './lib/draco-parser';
import DracoParser from './lib/draco-parser';
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import {DracoWorkerLoader as DracoWorkerLoaderMetadata} from './draco-loader';
import {DracoLoader as DracoLoaderMetadata} from './draco-loader';

const {preload: _DracoWorkerLoaderPreload, ...DracoWorkerLoaderMetadataWithoutPreload} =
  DracoWorkerLoaderMetadata;
const {preload: _DracoLoaderPreload, ...DracoLoaderMetadataWithoutPreload} = DracoLoaderMetadata;

export type DracoLoaderOptions = StrictLoaderOptions & {
  draco?: DracoParseOptions & {
    /** Selects mesh output or Apache Arrow output. */
    shape?: 'mesh' | 'arrow-table';
    /** @deprecated WASM decoding is faster but JS is more backwards compatible */
    decoderType?: 'wasm' | 'js';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for Draco3D compressed geometries
 */
export const DracoWorkerLoaderWithParser = {
  ...DracoWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<DracoMesh, never, DracoLoaderOptions>;

/**
 * Loader for Draco3D compressed geometries
 */
export const DracoLoaderWithParser = {
  ...DracoLoaderMetadataWithoutPreload,
  parse
} as const satisfies LoaderWithParser<DracoMesh | ArrowTable, never, DracoLoaderOptions>;

async function parse(
  arrayBuffer: ArrayBuffer,
  options?: DracoLoaderOptions
): Promise<DracoMesh | ArrowTable> {
  const {draco} = await loadDracoDecoderModule(
    extractLoadLibraryOptions(options),
    options?.draco?.decoderType || 'wasm'
  );
  const dracoParser = new DracoParser(draco);
  try {
    const mesh = dracoParser.parseSync(arrayBuffer, options?.draco);
    return options?.draco?.shape === 'arrow-table' ? convertMeshToTable(mesh, 'arrow-table') : mesh;
  } finally {
    dracoParser.destroy();
  }
}
