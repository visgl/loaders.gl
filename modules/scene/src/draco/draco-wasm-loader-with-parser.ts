// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderContext} from '@loaders.gl/core/loader-utils';
import {extractLoadLibraryOptions} from '@loaders.gl/core/worker-utils';
import type {ArrowTable} from '@loaders.gl/core/schema';
import type {DracoMesh} from './lib/draco-types';
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import {parseDraco} from './lib/parse-draco';
import {DracoLoader as DracoLoaderMetadata} from './draco-loader-types';
import type {DracoLoaderOptions} from './draco-loader-options';

const {preload: _DracoLoaderPreload, ...DracoLoaderMetadataWithoutPreload} = DracoLoaderMetadata;

/** Parser-bearing Draco loader backed by the WASM decoder. */
export const DracoWASMLoaderWithParser = {
  ...DracoLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: DracoLoaderOptions, context?: LoaderContext) =>
    await parseDraco(
      arrayBuffer,
      options,
      async () =>
        await loadDracoDecoderModule(
          extractLoadLibraryOptions(options),
          'wasm',
          options?.draco?.decoderProfile
        ),
      context
    )
} as const satisfies LoaderWithParser<DracoMesh | ArrowTable, never, DracoLoaderOptions>;
