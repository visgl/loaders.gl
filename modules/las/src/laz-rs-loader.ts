// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {LASLoaderOptions} from './las-loader';
import {LASWorkerLoader} from './las-loader';
import type {LASMesh} from './lib/las-types';
import {parseLAS} from './lib/laz-rs-wasm/parse-las';
import initLazRsWasm from './libs/laz-rs-wasm/laz_rs_wasm';

/**
 * Loader for the LAS (LASer) point cloud format
 */
export const LAZRsLoader = {
  ...LASWorkerLoader,
  // The bundled LAS worker imports the laz-perf implementation. Keep the
  // laz-rs variant on the main thread until it has a dedicated worker bundle.
  worker: false,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) => {
    await initLazRsWasm();
    return parseLAS(arrayBuffer, {...options});
  }
} as const satisfies LoaderWithParser<LASMesh, never, LASLoaderOptions>;
