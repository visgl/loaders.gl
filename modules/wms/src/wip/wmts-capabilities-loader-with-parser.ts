// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
// import type {WMTSCapabilities} from './lib/wmts/parse-wmts-capabilities';
import {parseWMTSCapabilities, WMTSCapabilities} from './lib/wmts/parse-wmts-capabilities';
import {WMTSCapabilitiesLoader as WMTSCapabilitiesLoaderMetadata} from './wmts-capabilities-loader';

const {preload: _WMTSCapabilitiesLoaderPreload, ...WMTSCapabilitiesLoaderMetadataWithoutPreload} = WMTSCapabilitiesLoaderMetadata;


// export type {WMTSCapabilities};

export type WMTSLoaderOptions = XMLLoaderOptions & {
  wmts?: {};
};

/**
 * Loader for the response to the WMTS GetCapability request
 */
export const WMTSCapabilitiesLoaderWithParser = {
  ...WMTSCapabilitiesLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: WMTSLoaderOptions) =>
    parseWMTSCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WMTSLoaderOptions) => parseWMTSCapabilities(text, options)
} as const satisfies LoaderWithParser<WMTSCapabilities, never, WMTSLoaderOptions>;

export const _typecheckWMTSCapabilitiesLoader: LoaderWithParser = WMTSCapabilitiesLoaderWithParser;
