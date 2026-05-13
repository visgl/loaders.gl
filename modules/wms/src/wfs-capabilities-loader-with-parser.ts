// loaders.gl, MIT license

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {WFSCapabilities} from './lib/parsers/wfs/parse-wfs-capabilities';
import {parseWFSCapabilities} from './lib/parsers/wfs/parse-wfs-capabilities';
import {WFSCapabilitiesLoader as WFSCapabilitiesLoaderMetadata} from './wfs-capabilities-loader';

const {preload: _WFSCapabilitiesLoaderPreload, ...WFSCapabilitiesLoaderMetadataWithoutPreload} =
  WFSCapabilitiesLoaderMetadata;

export type {WFSCapabilities};

export type WFSLoaderOptions = LoaderOptions & {
  wfs?: {};
};

/**
 * Loader for the response to the WFS GetCapability request
 * @deprecated Warning: this loader is still experimental and incomplete
 */
export const WFSCapabilitiesLoaderWithParser = {
  ...WFSCapabilitiesLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: WFSLoaderOptions) =>
    parseWFSCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WFSLoaderOptions) => parseWFSCapabilities(text, options)
} as const satisfies LoaderWithParser<WFSCapabilities, never, WFSLoaderOptions>;

export const _typecheckWFSCapabilitiesLoader: LoaderWithParser = WFSCapabilitiesLoaderWithParser;
