// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';

import type {WMSFeatureInfo} from '../lib/parsers/wms/parse-wms-features';
import {parseWMSFeatureInfo} from '../lib/parsers/wms/parse-wms-features';
import {WMSFeatureInfoLoader as WMSFeatureInfoLoaderMetadata} from './wms-feature-info-loader';

const {preload: _WMSFeatureInfoLoaderPreload, ...WMSFeatureInfoLoaderMetadataWithoutPreload} = WMSFeatureInfoLoaderMetadata;


export {WMSFeatureInfo};

/**
 * Loader for the response to the WMS GetFeatureInfo request
 */
export const WMSFeatureInfoLoaderWithParser = {
  ...WMSFeatureInfoLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: XMLLoaderOptions) =>
    parseWMSFeatureInfo(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: XMLLoaderOptions) => parseWMSFeatureInfo(text, options)
} as const satisfies LoaderWithParser<WMSFeatureInfo, never, XMLLoaderOptions>;
