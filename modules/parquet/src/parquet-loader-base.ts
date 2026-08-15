// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/schema';

import {ParquetFormat} from './parquet-format';
import {PARQUET_LOADER_DEFAULT_OPTIONS} from './parquet-loader-options';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared Parquet loader metadata without parser preloading or worker delivery policy. */
export const PARQUET_LOADER_BASE = {
  ...ParquetFormat,

  dataType: null as unknown as ObjectRowTable | ArrowTable,
  batchType: null as unknown as ObjectRowTableBatch | ArrowTableBatch,

  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  options: {
    parquet: {
      ...PARQUET_LOADER_DEFAULT_OPTIONS
    }
  }
} as const;
