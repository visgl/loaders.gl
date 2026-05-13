// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, LoaderContext} from '@loaders.gl/loader-utils';
import type {I3SLoaderOptions} from './i3s-loader';
import {parseI3STileContent} from './lib/parsers/parse-i3s-tile-content';
import {I3STileContent, I3STileOptions, I3STilesetOptions} from './types';
import {I3SContentLoader as I3SContentLoaderMetadata} from './i3s-content-loader';

const {preload: _I3SContentLoaderPreload, ...I3SContentLoaderMetadataWithoutPreload} =
  I3SContentLoaderMetadata;

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.

/**
 * Loader for I3S - Indexed 3D Scene Layer
 */
export const I3SContentLoaderWithParser = {
  ...I3SContentLoaderMetadataWithoutPreload,
  parse
} as const satisfies LoaderWithParser<I3STileContent | null, never, I3SLoaderOptions>;

async function parse(data, options?: I3SLoaderOptions, context?: LoaderContext) {
  const {tile, _tileOptions, tileset, _tilesetOptions} = options?.i3s || {};
  const tileOptions = _tileOptions || tile;
  const tilesetOptions = _tilesetOptions || tileset;
  if (!tileOptions || !tilesetOptions) {
    return null;
  }
  return await parseI3STileContent(
    data,
    tileOptions as I3STileOptions,
    tilesetOptions as I3STilesetOptions,
    options,
    context
  );
}
