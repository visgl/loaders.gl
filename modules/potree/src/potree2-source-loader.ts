// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {Potree2Source} from '@loaders.gl/potree/potree2-source';
import {Potree2SourceLoader, type Potree2SourceOptions} from './potree2-source-loader-types';

const {preload: _preload, createDataSource: _createDataSource, ...metadata} = Potree2SourceLoader;

/** Runtime factory for PotreeConverter 2.x output. */
export const Potree2SourceLoaderWithParser = {
  ...metadata,
  /** Creates a source from metadata.json or a directory URL. */
  createDataSource(
    input: string | Blob,
    options: Potree2SourceOptions = {},
    coreApi?: CoreAPI
  ): Potree2Source {
    if (typeof input !== 'string') throw new Error('Potree 2.0 requires a dataset URL');
    return new Potree2Source(input, options, coreApi);
  }
} as const satisfies SourceLoader<Potree2Source>;
