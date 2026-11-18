// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/documents';
// import type {WMTSCapabilities} from './lib/wmts/parse-wmts-capabilities';
import {parseWMTSCapabilities, WMTSCapabilities} from './lib/wmts/parse-wmts-capabilities';
import {WMTSCapabilitiesLoader as WMTSCapabilitiesLoaderMetadata} from './wmts-capabilities-loader';

const {preload: _WMTSCapabilitiesLoaderPreload, ...WMTSCapabilitiesLoaderMetadataWithoutPreload} = WMTSCapabilitiesLoaderMetadata;


// export type {WMTSCapabilities};

export type WMTSCapabilitiesLoaderOptions = XMLLoaderOptions & {
  wmts?: {};
};

/**
 * Loader for the response to the WMTS GetCapability request
 */
export const WMTSCapabilitiesLoaderWithParser = {
  ...WMTSCapabilitiesLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: WMTSCapabilitiesLoaderOptions) =>
    parseWMTSCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WMTSCapabilitiesLoaderOptions) => parseWMTSCapabilities(text, options)
} as const satisfies LoaderWithParser<WMTSCapabilities, never, WMTSCapabilitiesLoaderOptions>;

export const _typecheckWMTSCapabilitiesLoader: LoaderWithParser = WMTSCapabilitiesLoaderWithParser;
