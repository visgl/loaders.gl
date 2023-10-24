// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {TileJSON} from './lib/parse-tilejson';
import {parseTileJSON} from './lib/parse-tilejson';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TileJSONLoaderOptions = LoaderOptions & {
  tilejson?: {};
};

/**
 * Loader for TileJSON metadata
 */
export const TileJSONLoader: LoaderWithParser<TileJSON, never, TileJSONLoaderOptions> = {
  name: 'TileJSON',
  id: 'tilejson',
  module: 'pmtiles',
  version: VERSION,
  worker: true,
  extensions: ['json'],
  mimeTypes: ['application/json'],
  text: true,
  options: {
    tilejson: {}
  },
  parse: async (arrayBuffer, options) => {
    const jsonString = new TextDecoder().decode(arrayBuffer);
    const json = JSON.parse(jsonString);
    return parseTileJSON(json) as TileJSON;
  },
  parseTextSync: (text, options) => {
    const json = JSON.parse(text);
    return parseTileJSON(json) as TileJSON;
  }
};
