// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import {WMSCapabilities, parseWMSCapabilities} from './lib/parsers/wms/parse-wms-capabilities';
import {WMSCapabilitiesLoader as WMSCapabilitiesLoaderMetadata} from './wms-capabilities-loader';

const {preload: _WMSCapabilitiesLoaderPreload, ...WMSCapabilitiesLoaderMetadataWithoutPreload} =
  WMSCapabilitiesLoaderMetadata;

// Parsed data types
export type {
  WMSCapabilities,
  WMSLayer,
  WMSBoundingBox,
  WMSDimension,
  WMSRequest,
  WMSExceptions
} from './lib/parsers/wms/parse-wms-capabilities';

export type WMSCapabilitiesLoaderOptions = XMLLoaderOptions & {
  wms?: {
    /** Add inherited layer information to sub layers */
    inheritedLayerProps?: boolean;
    /** Include the "raw" JSON (parsed but untyped, unprocessed XML). May contain additional fields */
    includeRawJSON?: boolean;
    /** Include the original XML document text. May contain additional information. */
    includeXMLText?: boolean;
  };
};

/**
 * Loader for the response to the WMS GetCapability request
 */
export const WMSCapabilitiesLoaderWithParser = {
  ...WMSCapabilitiesLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: WMSCapabilitiesLoaderOptions) =>
    // TODO pass in XML options
    parseWMSCapabilities(new TextDecoder().decode(arrayBuffer), options?.wms),
  parseTextSync: (text: string, options?: WMSCapabilitiesLoaderOptions) =>
    // TODO pass in XML options
    parseWMSCapabilities(text, options?.wms)
} as const satisfies LoaderWithParser<WMSCapabilities, never, WMSCapabilitiesLoaderOptions>;
