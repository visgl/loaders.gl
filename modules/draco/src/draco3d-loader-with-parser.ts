// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {DracoMesh} from './lib/draco-types';
import {loadDracoDecoderModuleFromDraco3D} from './lib/draco-module-loader';
import {parseDraco} from './lib/parse-draco';
import {DracoLoader as DracoLoaderMetadata} from './draco-loader';
import type {DracoLoaderOptions} from './draco-loader-options';

const {preload: _DracoLoaderPreload, ...DracoLoaderMetadataWithoutPreload} = DracoLoaderMetadata;

/** Parser-bearing Draco loader backed by an injected `draco3d` package. */
export const Draco3DLoaderWithParser = {
  ...DracoLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: DracoLoaderOptions) =>
    await parseDraco(
      arrayBuffer,
      options,
      async () => await loadDracoDecoderModuleFromDraco3D(getDraco3DModule(options))
    )
} as const satisfies LoaderWithParser<DracoMesh | ArrowTable, never, DracoLoaderOptions>;

/** Extracts the injected `draco3d` package from loader options. */
function getDraco3DModule(options?: DracoLoaderOptions): unknown {
  const draco3DModule = options?.modules?.draco3d;
  if (!draco3DModule) {
    throw new Error('DracoLoader: backend "draco3d" requires options.modules.draco3d');
  }
  return draco3DModule;
}
