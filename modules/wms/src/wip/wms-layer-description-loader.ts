// loaders.gl, MIT license

import type {Loader} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import {WMSCapabilitiesLoader} from '../wms-capabilities-loader';

import type {WMSLayerDescription} from '../lib/parsers/wms/parse-wms-layer-description';

export {WMSLayerDescription};

/**
 * Loader for the response to the WMS DescribeLayer request
 */
export const WMSLayerDescriptionLoader = {
  ...WMSCapabilitiesLoader,
  dataType: null as unknown as WMSLayerDescription,

  id: 'wms-layer-description',
  name: 'WMS DescribeLayer',

  /** Loads the parser-bearing WMS DescribeLayer loader implementation. */
  preload: async () => (await import('./wms-layer-description-loader-with-parser')).WMSLayerDescriptionLoaderWithParser
} as const satisfies Loader<WMSLayerDescription, never, XMLLoaderOptions>;
