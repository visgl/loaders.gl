// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {WMSCapabilitiesLoader, WMSLoaderOptions} from './wms-capabilities-loader';
import {parseWMSFeatureInfo} from './lib/wms/parse-wms';

/**
 * Loader for the response to the WMS GetFeatureInfo request
 */
export const WMSLayerDescriptionLoader = {
  ...WMSCapabilitiesLoader,

  name: 'WMS DescribeLayer',
  id: 'wms-layer-description',

  parse: async (arrayBuffer: ArrayBuffer, options?: WMSLoaderOptions) =>
    parseWMSFeatureInfo(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WMSLoaderOptions) => parseWMSFeatureInfo(text, options)
};

export const _typecheckWMSFeatureInfoLoader: LoaderWithParser = WMSLayerDescriptionLoader;
