// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {TileJSON} from './lib/parse-tilejson';
import {parseTileJSON} from './lib/parse-tilejson';
import {TileJSONLoader as TileJSONLoaderMetadata} from './tilejson-loader';

const {preload: _TileJSONLoaderPreload, ...TileJSONLoaderMetadataWithoutPreload} =
  TileJSONLoaderMetadata;

export type TileJSONLoaderOptions = LoaderOptions & {
  /** Options for the TileJSONLoaderWithParser */
  tilejson?: {
    /** Max number of unique values */
    maxValues?: number;
  };
};

/**
 * Loader for TileJSON metadata
 */
export const TileJSONLoaderWithParser = {
  ...TileJSONLoaderMetadataWithoutPreload,
  worker: false,
  parse: async (arrayBuffer: ArrayBuffer, options?: TileJSONLoaderOptions) => {
    const jsonString = new TextDecoder().decode(arrayBuffer);
    const json = JSON.parse(jsonString);
    const tilejsonOptions = {...TileJSONLoaderWithParser.options.tilejson, ...options?.tilejson};
    return parseTileJSON(json, tilejsonOptions) as TileJSON;
  },
  parseTextSync: (text: string, options?: TileJSONLoaderOptions) => {
    const json = JSON.parse(text);
    const tilejsonOptions = {...TileJSONLoaderWithParser.options.tilejson, ...options?.tilejson};
    return parseTileJSON(json, tilejsonOptions) as TileJSON;
  }
} as const satisfies LoaderWithParser<TileJSON, never, TileJSONLoaderOptions>;
