// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {ParquetWorkerLoaderWithParser} from '../parquet-worker-loader';

createLoaderWorker(ParquetWorkerLoaderWithParser);

/** Retains worker initialization in source builds that tree-shake side-effect imports. */
export const PARQUET_WORKER_LOADED = true;
