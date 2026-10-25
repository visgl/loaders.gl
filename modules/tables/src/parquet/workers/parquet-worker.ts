// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {ParquetWorkerLoaderWithParser} from '../parquet-worker-loader';

createLoaderWorker(ParquetWorkerLoaderWithParser);
