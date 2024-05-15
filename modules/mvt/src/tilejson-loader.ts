// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {TileJSON} from './lib/parse-tilejson';
import {parseTileJSON} from './lib/parse-tilejson';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TileJSONLoaderOptions = LoaderOptions & {
  /** Options for the TileJSONLoader */
  tilejson?: {
    /** Max number of unique values */
    maxValues?: number;
  };
};

/**
 * Loader for TileJSON metadata
 */
export const TileJSONLoader = {
  dataType: null as unknown as TileJSON,
  batchType: null as never,

  name: 'TileJSON',
  id: 'tilejson',
  module: 'pmtiles',
  version: VERSION,
  worker: true,
  extensions: ['json'],
  mimeTypes: ['application/json'],
  text: true,
  options: {
    tilejson: {
      maxValues: undefined
    }
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: TileJSONLoaderOptions) => {
    const jsonString = new TextDecoder().decode(arrayBuffer);
    const json = JSON.parse(jsonString);
    const tilejsonOptions = {...TileJSONLoader.options.tilejson, ...options?.tilejson};
    return parseTileJSON(json, tilejsonOptions) as TileJSON;
  },
  parseTextSync: (text: string, options?: TileJSONLoaderOptions) => {
    const json = JSON.parse(text);
    const tilejsonOptions = {...TileJSONLoader.options.tilejson, ...options?.tilejson};
    return parseTileJSON(json, tilejsonOptions) as TileJSON;
  }
} as const satisfies LoaderWithParser<TileJSON, never, TileJSONLoaderOptions>;
