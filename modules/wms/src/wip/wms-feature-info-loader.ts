// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import {WMSCapabilitiesLoader} from '../wms-capabilities-loader';

import type {WMSFeatureInfo} from '../lib/parsers/wms/parse-wms-features';

export {WMSFeatureInfo};

/**
 * Loader for the response to the WMS GetFeatureInfo request
 */
export const WMSFeatureInfoLoader = {
  ...WMSCapabilitiesLoader,
  dataType: null as unknown as WMSFeatureInfo,

  id: 'wms-feature-info',
  name: 'WMS FeatureInfo',

  /** Loads the parser-bearing WMS FeatureInfo loader implementation. */
  preload: async () => (await import('./wms-feature-info-loader-with-parser')).WMSFeatureInfoLoaderWithParser
} as const satisfies Loader<WMSFeatureInfo, never, XMLLoaderOptions>;
