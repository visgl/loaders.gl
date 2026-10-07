// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';

/** Optional bundler-provided worker factory; published builds use the versioned CDN worker. */
export const I3S_CONTENT_WORKER_LOAD_WORKER: Loader['loadWorker'] = undefined;
