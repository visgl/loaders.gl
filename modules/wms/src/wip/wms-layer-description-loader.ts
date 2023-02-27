// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type{WMSLoaderOptions} from '../wms-capabilities-loader';
import {WMSCapabilitiesLoader} from '../wms-capabilities-loader';

import type {WMSLayerDescription} from '../lib/wms/parse-wms-layer-description';
import {parseWMSLayerDescription} from '../lib/wms/parse-wms-layer-description';

export {WMSLayerDescription};

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
