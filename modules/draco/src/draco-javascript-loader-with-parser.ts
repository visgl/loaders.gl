// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {extractLoadLibraryOptions} from '@loaders.gl/worker-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {DracoMesh} from './lib/draco-types';
import {loadDracoDecoderModule} from './lib/draco-module-loader';
import {parseDraco} from './lib/parse-draco';
import {DracoLoader as DracoLoaderMetadata} from './draco-loader';
import type {DracoLoaderOptions} from './draco-loader-options';

const {preload: _DracoLoaderPreload, ...DracoLoaderMetadataWithoutPreload} = DracoLoaderMetadata;

/** Parser-bearing Draco loader backed by the JavaScript fallback decoder. */
export const DracoJavaScriptLoaderWithParser = {
  ...DracoLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: DracoLoaderOptions) =>
    await parseDraco(
      arrayBuffer,
      options,
      async () => await loadDracoDecoderModule(extractLoadLibraryOptions(options), 'js')
    )
} as const satisfies LoaderWithParser<DracoMesh | ArrowTable, never, DracoLoaderOptions>;
