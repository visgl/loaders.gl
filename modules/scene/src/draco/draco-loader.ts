// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderContext} from '@loaders.gl/core/loader-utils';
import {extractLoadLibraryOptions} from '@loaders.gl/core/worker-utils';
import type {ArrowTable} from '@loaders.gl/core/schema';
import type {DracoMesh} from './lib/draco-types';
import {parseDraco} from './lib/parse-draco';
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import {DracoLoader as DracoLoaderMetadata} from './draco-loader-types';
import type {DracoLoaderOptions} from './draco-loader-options';

const {preload: _DracoLoaderPreload, ...DracoLoaderMetadataWithoutPreload} = DracoLoaderMetadata;

export type {DracoLoaderOptions} from './draco-loader-options';

/**
 * Loader for Draco3D compressed geometries
 */
export const DracoLoaderWithParser = {
  ...DracoLoaderMetadataWithoutPreload,
  parse
} as const satisfies LoaderWithParser<DracoMesh | ArrowTable, never, DracoLoaderOptions>;

/** Decodes compressed geometry through the selected Draco runtime. */
async function parse(
  arrayBuffer: ArrayBuffer,
  options?: DracoLoaderOptions,
  context?: LoaderContext
): Promise<DracoMesh | ArrowTable> {
  return await parseDraco(
    arrayBuffer,
    options,
    async () =>
      await loadDracoDecoderModule(
        extractLoadLibraryOptions(options),
        options?.draco?.backend === 'javascript' || options?.draco?.backend === 'js'
          ? 'js'
          : 'wasm',
        options?.draco?.decoderProfile
      ),
    context
  );
}
