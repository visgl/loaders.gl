// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {LASFormat} from './las-format';
import type {LASMesh} from './lib/las-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Arrow column names that can be selected from LAS point records. */
export type LASColumnName =
  | 'POSITION'
  | 'intensity'
  | 'classification'
  | 'COLOR_0'
  | 'GPS_TIME'
  | 'NIR'
  | 'scanAngle'
  | 'userData'
  | 'pointSourceId'
  | 'returnNumber'
  | 'numberOfReturns'
  | 'scannerChannel'
  | 'scanDirectionFlag'
  | 'edgeOfFlightLine'
  | 'WAVEFORM'
  | 'EXTRA_BYTES';

/** Options accepted by LAS loader implementations. */
export type LASLoaderOptions = LoaderOptions & {
  las?: {
    /** Output representation. */
    shape?: 'mesh' | 'columnar-table' | 'arrow-table';
    /** Store positions in 64-bit floating point arrays. */
    fp64?: boolean;
    /** Output color depth or automatic source-depth detection. */
    colorDepth?: number | string;
    /** Arrow columns to decode. POSITION is always included. */
    columns?: readonly LASColumnName[];
    /** Decode Extra Bytes descriptors into typed attributes instead of raw bytes. */
    extraBytes?: 'raw' | 'typed';
    /** Override the URL to the worker bundle. */
    workerUrl?: string;
  };
  /** Called as point data is decoded on the main thread. */
  onProgress?: Function;
};

/** Parser-independent LAS loader metadata shared by each loader variant. */
export const LAS_LOADER_METADATA = {
  ...LASFormat,

  dataType: null as unknown as LASMesh | MeshArrowTable,
  batchType: null as unknown as LASMesh | MeshArrowTable,

  version: VERSION,
  worker: false,
  options: {
    las: {
      shape: 'mesh',
      fp64: false,
      colorDepth: 8,
      columns: undefined,
      extraBytes: 'raw'
    }
  }
} as const satisfies Loader<LASMesh | MeshArrowTable, LASMesh | MeshArrowTable, LASLoaderOptions>;
