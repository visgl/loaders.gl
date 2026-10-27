// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {TarLoader} from './tar-loader-types';
import type {TarFileMap, TarLoaderOptions} from './tar-loader-types';
import {readTarArchive} from './tar-archive';

const {preload: _preload, ...metadata} = TarLoader;

/** Parser-bearing TAR loader. */
export const TarLoaderWithParser = {
  ...metadata,
  parse: async (input: ArrayBuffer, options?: TarLoaderOptions): Promise<TarFileMap> =>
    readTarArchive(input, options)
} as const satisfies LoaderWithParser<TarFileMap, never, TarLoaderOptions>;
