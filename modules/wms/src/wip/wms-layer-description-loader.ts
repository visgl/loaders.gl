// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import {WMSCapabilitiesLoader} from '../wms-capabilities-loader';

import type {WMSLayerDescription} from '../lib/parsers/wms/parse-wms-layer-description';
import {parseWMSLayerDescription} from '../lib/parsers/wms/parse-wms-layer-description';

export {WMSLayerDescription};

/**
 * Loader for the response to the WMS DescribeLayer request
 */
export const WMSLayerDescriptionLoader = {
  ...WMSCapabilitiesLoader,
  dataType: null as unknown as WMSLayerDescription,

  id: 'wms-layer-description',
  name: 'WMS DescribeLayer',

  parse: async (arrayBuffer: ArrayBuffer, options?: XMLLoaderOptions) =>
    parseWMSLayerDescription(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: XMLLoaderOptions) => parseWMSLayerDescription(text, options)
} as const satisfies LoaderWithParser<WMSLayerDescription, never, XMLLoaderOptions>;
