// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParseWKTCRSOptions, WKTCRS} from '@loaders.gl/gis';
import {parseWKTCRS} from '@loaders.gl/gis';
import {WKTCRSLoader as WKTCRSLoaderMetadata} from './wkt-crs-loader';

const {preload: _WKTCRSLoaderPreload, ...WKTCRSLoaderMetadataWithoutPreload} = WKTCRSLoaderMetadata;

export type WKTCRSLoaderOptions = LoaderOptions & {
  'wkt-crs'?: ParseWKTCRSOptions;
};

/**
 * Well-Known text CRS loader
 * @see OGC Standard: https://www.ogc.org/standards/wkt-crs
 * @see Wikipedia Page: https://en.wikipedia.org/wiki/Well-known_text_representation_of_coordinate_reference_systems
 */
export const WKTCRSLoaderWithParser = {
  ...WKTCRSLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) =>
    parseWKTCRS(new TextDecoder().decode(arrayBuffer), options?.['wkt-crs']),
  parseTextSync: (string, options) => parseWKTCRS(string, options?.['wkt-crs'])
} as const satisfies LoaderWithParser<WKTCRS, never, WKTCRSLoaderOptions>;
