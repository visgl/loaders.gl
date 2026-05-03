// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';

import type {WMSLayerDescription} from '../lib/parsers/wms/parse-wms-layer-description';
import {parseWMSLayerDescription} from '../lib/parsers/wms/parse-wms-layer-description';
import {WMSLayerDescriptionLoader as WMSLayerDescriptionLoaderMetadata} from './wms-layer-description-loader';

const {preload: _WMSLayerDescriptionLoaderPreload, ...WMSLayerDescriptionLoaderMetadataWithoutPreload} = WMSLayerDescriptionLoaderMetadata;


export {WMSLayerDescription};

/**
 * Loader for the response to the WMS DescribeLayer request
 */
export const WMSLayerDescriptionLoaderWithParser = {
  ...WMSLayerDescriptionLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: XMLLoaderOptions) =>
    parseWMSLayerDescription(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: XMLLoaderOptions) => parseWMSLayerDescription(text, options)
} as const satisfies LoaderWithParser<WMSLayerDescription, never, XMLLoaderOptions>;
