// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';

/** Optional browser worker factory for the private Parquet source worker. */
export const PARQUET_SOURCE_WORKER_LOAD_WORKER: Loader['loadWorker'] = undefined;
