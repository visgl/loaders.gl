// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {extractLoadLibraryOptions} from '@loaders.gl/worker-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {DracoMesh} from './lib/draco-types';
import {parseDraco} from './lib/parse-draco';
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import {DracoWorkerLoader as DracoWorkerLoaderMetadata} from './draco-loader';
import {DracoLoader as DracoLoaderMetadata} from './draco-loader';
import type {DracoLoaderOptions} from './draco-loader-options';

const {preload: _DracoWorkerLoaderPreload, ...DracoWorkerLoaderMetadataWithoutPreload} =
  DracoWorkerLoaderMetadata;
const {preload: _DracoLoaderPreload, ...DracoLoaderMetadataWithoutPreload} = DracoLoaderMetadata;

export type {DracoLoaderOptions} from './draco-loader-options';

/**
 * Worker loader for Draco3D compressed geometries
 */
export const DracoWorkerLoaderWithParser = {
  ...DracoWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<DracoMesh | ArrowTable, never, DracoLoaderOptions>;

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
  return await parseDraco(
    arrayBuffer,
    options,
    async () =>
      await loadDracoDecoderModule(
        extractLoadLibraryOptions(options),
        options?.draco?.decoderType || 'wasm',
        options?.draco?.decoderProfile
      )
  );
}
