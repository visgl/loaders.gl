// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {WMTSCapabilities} from './lib/parsers/wmts/parse-wmts-capabilities';
import {WMTSCapabilitiesFormat} from './wms-format';

export type WMTSLoaderOptions = LoaderOptions & {wmts?: Record<string, unknown>};

/** Metadata-only loader for WMTS GetCapabilities responses. */
export const WMTSCapabilitiesLoader = {
  ...WMTSCapabilitiesFormat,
  dataType: null as unknown as WMTSCapabilities,
  batchType: null as never,
  name: 'WMTS Capabilities',
  id: 'wmts-capabilities',
  module: 'wms',
  version: '0.0.0',
  worker: false,
  encoding: 'xml',
  format: 'wmts-capabilities',
  text: true,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.wmts_xml', 'application/xml', 'text/xml'],
  options: {wmts: {}},
  preload: async () =>
    (await import('./wmts-capabilities-loader-with-parser')).WMTSCapabilitiesLoaderWithParser
} as const satisfies Loader<WMTSCapabilities, never, WMTSLoaderOptions>;
