// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from './lib/parsers/gml/parse-gml';
import {parseGML} from './lib/parsers/gml/parse-gml';
import {GMLLoader as GMLLoaderMetadata} from './gml-loader';

const {preload: _GMLLoaderPreload, ...GMLLoaderMetadataWithoutPreload} = GMLLoaderMetadata;

export type GMLLoaderOptions = LoaderOptions & {
  gml?: {};
};

/**
 * Loader for the response to the GML GetCapability request
 */
export const GMLLoaderWithParser = {
  ...GMLLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: GMLLoaderOptions) =>
    parseGML(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: GMLLoaderOptions) => parseGML(text, options)
} as const satisfies LoaderWithParser<Geometry | null, never, GMLLoaderOptions>;
