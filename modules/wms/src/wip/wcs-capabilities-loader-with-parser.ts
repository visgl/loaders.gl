// loaders.gl, MIT license

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {WCSCapabilities} from './lib/wcs/parse-wcs-capabilities';
import {parseWCSCapabilities} from './lib/wcs/parse-wcs-capabilities';
import {WCSCapabilitiesLoader as WCSCapabilitiesLoaderMetadata} from './wcs-capabilities-loader';

const {preload: _WCSCapabilitiesLoaderPreload, ...WCSCapabilitiesLoaderMetadataWithoutPreload} = WCSCapabilitiesLoaderMetadata;


export {WCSCapabilities};

export type WCSLoaderOptions = LoaderOptions & {
  wcs?: {};
};

/**
 * Loader for the response to the WCS GetCapability request
 */
export const WCSCapabilitiesLoaderWithParser = {
  ...WCSCapabilitiesLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: WCSLoaderOptions) =>
    parseWCSCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WCSLoaderOptions) => parseWCSCapabilities(text, options)
} as const satisfies LoaderWithParser<WCSCapabilities, never, WCSLoaderOptions>;

export const _typecheckWFSCapabilitiesLoader: LoaderWithParser = WCSCapabilitiesLoaderWithParser;
