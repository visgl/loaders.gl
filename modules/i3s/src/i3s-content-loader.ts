import {isBrowser} from '@loaders.gl/worker-utils';
import type {LoaderWithParser, LoaderContext} from '@loaders.gl/loader-utils';
import type {I3SLoaderOptions} from './i3s-loader';
import {parseI3STileContent} from './lib/parsers/parse-i3s-tile-content';
import {I3STileOptions, I3STilesetOptions} from './types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
/**
 * Loader for I3S - Indexed 3D Scene Layer
 */
export const I3SContentLoader: LoaderWithParser = {
  name: 'I3S Content (Indexed Scene Layers)',
  id: isBrowser ? 'i3s-content' : 'i3s-content-nodejs',
  module: 'i3s',
  worker: true,
  version: VERSION,
  mimeTypes: ['application/octet-stream'],
  parse,
  extensions: ['bin'],
  options: {
    'i3s-content': {}
  }
};

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
