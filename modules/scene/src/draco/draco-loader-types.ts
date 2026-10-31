// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {ArrowTable} from '@loaders.gl/core/schema';
import type {DracoMesh} from './lib/draco-types';
import {
  deserializeArrowWorkerResult,
  serializeArrowWorkerResult
} from '@loaders.gl/core/schema-utils/arrow-transport';
import {VERSION} from './lib/utils/version';
import {DracoFormat} from './draco-format';
import {
  DRACO_LOADER_DEFAULT_OPTIONS,
  type DracoDecoderBackend,
  type DracoLoaderOptions
} from './draco-loader-options';

export type {DracoLoaderOptions} from './draco-loader-options';

/** Preloads the parser-bearing Draco loader implementation. */
async function preload(
  _url: string,
  options?: Record<string, unknown>
): Promise<LoaderWithParser<DracoMesh | ArrowTable, never, DracoLoaderOptions>> {
  const dracoLoaderOptions = options as DracoLoaderOptions | undefined;
  switch (getDracoBackend(dracoLoaderOptions)) {
    case 'wasm': {
      const {DracoWASMLoaderWithParser} = await import('@loaders.gl/scene/draco-wasm-loader');
      return DracoWASMLoaderWithParser;
    }

    case 'javascript': {
      const {DracoJavaScriptLoaderWithParser} = await import(
        '@loaders.gl/scene/draco-javascript-loader'
      );
      return DracoJavaScriptLoaderWithParser;
    }

    case 'draco3d': {
      const {Draco3DLoaderWithParser} = await import('@loaders.gl/scene/draco3d-loader');
      return Draco3DLoaderWithParser;
    }

    default:
      throw new Error(`DracoLoader: unsupported backend "${dracoLoaderOptions?.draco?.backend}"`);
  }
}

/** Metadata-only worker loader for Draco3D compressed geometries. */
export const DracoLoader = {
  dataType: null as unknown as DracoMesh | ArrowTable,
  batchType: null as never,
  ...DracoFormat,
  // shapes: ['mesh'],
  version: VERSION,
  worker: true,
  /** Node test workers live with the Draco implementation. */
  workerSourceNode: 'draco/workers/draco-worker-node.ts',
  serializeWorkerResult: serializeArrowWorkerResult,
  deserializeWorkerResult: deserializeArrowWorkerResult,
  options: {
    draco: DRACO_LOADER_DEFAULT_OPTIONS
  },
  preload
} as const satisfies Loader<DracoMesh | ArrowTable, never, DracoLoaderOptions>;

/** @deprecated Use DracoLoader. */
export const DracoWorkerLoader = DracoLoader;

/** Resolves the Draco decoder backend from loader options. */
function getDracoBackend(options?: DracoLoaderOptions): DracoDecoderBackend {
  if (options?.draco?.backend) {
    return options.draco.backend === 'js' ? 'javascript' : options.draco.backend;
  }
  return DracoLoader.options.draco.backend;
}
