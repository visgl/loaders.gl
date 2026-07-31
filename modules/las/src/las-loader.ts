// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {LASMesh} from './lib/las-types';
import {LASFormat} from './las-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type LASLoaderOptions = LoaderOptions & {
  las?: {
    /** Decoder backend. Defaults to the current vendored laz-perf implementation. */
    backend?: 'laz-perf' | 'copc' | 'laz-rs' | 'typescript';
    shape?: 'mesh' | 'columnar-table' | 'arrow-table';
    fp64?: boolean;
    colorDepth?: number | string;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
  onProgress?: Function;
};

/** Preloads the parser-bearing LAS loader implementation selected by `las.backend`. */
async function preload(
  _url: string,
  options?: LoaderOptions
): Promise<LoaderWithParser<LASMesh | MeshArrowTable, LASMesh | MeshArrowTable, LASLoaderOptions>> {
  const lasOptions = options as LASLoaderOptions | undefined;
  switch (getLASBackend(lasOptions)) {
    case 'laz-perf': {
      const {LAZPerfLoaderWithParser} = await import('./lazperf-loader-with-parser');
      return LAZPerfLoaderWithParser;
    }

    case 'copc': {
      const {LASCOPCLoaderWithParser} = await import('./las-copc-loader-with-parser');
      return LASCOPCLoaderWithParser;
    }

    case 'laz-rs': {
      const {LAZRsLoaderWithParser} = await import('./laz-rs-loader-with-parser');
      return LAZRsLoaderWithParser;
    }

    case 'typescript': {
      const {LASLoaderWithParser} = await import('./las-loader-with-parser');
      return LASLoaderWithParser;
    }

    default:
      throw new Error(`LASLoader: unsupported backend "${lasOptions?.las?.backend}"`);
  }
}

/** Metadata-only loader for the LAS (LASer) point cloud format. */
export const LASLoader = {
  ...LASFormat,

  dataType: null as unknown as LASMesh | MeshArrowTable,
  batchType: null as unknown as LASMesh | MeshArrowTable,

  version: VERSION,
  worker: true,
  options: {
    las: {
      backend: 'laz-perf',
      shape: 'mesh',
      fp64: false,
      colorDepth: 8
    }
  },
  preload
} as const satisfies Loader<LASMesh | MeshArrowTable, LASMesh | MeshArrowTable, LASLoaderOptions>;

/** @deprecated Use LASLoader. */
export const LASWorkerLoader = LASLoader;

function getLASBackend(options?: LASLoaderOptions): 'laz-perf' | 'copc' | 'laz-rs' | 'typescript' {
  return options?.las?.backend || LASLoader.options.las.backend;
}
