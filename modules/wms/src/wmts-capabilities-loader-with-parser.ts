// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseWMTSCapabilities, WMTSCapabilities} from './lib/parsers/wmts/parse-wmts-capabilities';
import {WMTSCapabilitiesLoader as WMTSCapabilitiesLoaderMetadata} from './wmts-capabilities-loader';

const {preload: _preload, ...metadata} = WMTSCapabilitiesLoaderMetadata;

/** Parser-bearing WMTS capabilities loader. */
export const WMTSCapabilitiesLoaderWithParser = {
  ...metadata,
  parse: async (arrayBuffer: ArrayBuffer, options?: any) =>
    parseWMTSCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: any) => parseWMTSCapabilities(text, options)
} as const satisfies LoaderWithParser<WMTSCapabilities, never, any>;
