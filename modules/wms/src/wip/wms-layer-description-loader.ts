// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {WMSCapabilitiesLoader, WMSLoaderOptions} from '../wms-capabilities-loader';
import {parseWMSLayerDescription} from '../lib/wms/parse-wms';

/**
 * Loader for the response to the WMS DescribeLayer request
 */
export const WMSLayerDescriptionLoader = {
  ...WMSCapabilitiesLoader,

  id: 'wms-layer-description',
  name: 'WMS DescribeLayer',

  parse: async (arrayBuffer: ArrayBuffer, options?: WMSLoaderOptions) =>
    parseWMSLayerDescription(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WMSLoaderOptions) => parseWMSLayerDescription(text, options)
};

export const _typecheckWMSFeatureInfoLoader: LoaderWithParser = WMSLayerDescriptionLoader;
