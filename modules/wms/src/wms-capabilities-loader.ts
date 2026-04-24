// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import type {WMSCapabilities} from './lib/parsers/wms/parse-wms-capabilities';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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

/** Preloads the parser-bearing WMS capabilities loader implementation. */
async function preload() {
  const {WMSCapabilitiesLoaderWithParser} = await import('./wms-capabilities-loader-with-parser');
  return WMSCapabilitiesLoaderWithParser;
}

/** Metadata-only loader for the response to the WMS GetCapability request. */
export const WMSCapabilitiesLoader = {
  dataType: null as unknown as WMSCapabilities,
  batchType: null as never,

  id: 'wms-capabilities',
  name: 'WMS Capabilities',

  module: 'wms',
  version: VERSION,
  worker: false,
  text: true,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.wms_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    wms: {}
  },
  preload
} as const satisfies Loader<WMSCapabilities, never, WMSCapabilitiesLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
