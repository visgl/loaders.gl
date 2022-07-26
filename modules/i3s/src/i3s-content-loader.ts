import type {LoaderWithParser, LoaderContext} from '@loaders.gl/loader-utils';
import {I3SLoaderOptions} from './i3s-loader';
import {parseI3STileContent} from './lib/parsers/parse-i3s-tile-content';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'beta';
/**
 * Loader for I3S - Indexed 3D Scene Layer
 */
export const I3SContentLoader: LoaderWithParser = {
  name: 'I3S Content (Indexed Scene Layers)',
  id: 'i3s-content',
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
  const {tileOptions, tilesetOptions} = options?.i3s || {};
  if (!tileOptions || !tilesetOptions) {
    return null;
  }
  return await parseI3STileContent(data, tileOptions, tilesetOptions, options, context);
}
