// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseWMSError} from './lib/parsers/wms/parse-wms-error';
import {WMSErrorLoader as WMSErrorLoaderMetadata} from './wms-error-loader';

const {preload: _WMSErrorLoaderPreload, ...WMSErrorLoaderMetadataWithoutPreload} =
  WMSErrorLoaderMetadata;

export type WMSLoaderOptions = LoaderOptions & {
  wms?: {
    /** By default the error loader will throw an error with the parsed error message */
    throwOnError?: boolean;
    /** Do not add any text to errors */
    minimalErrors?: boolean;
  };
};

/**
 * Loader for the response to the WMS GetCapability request
 */
export const WMSErrorLoaderWithParser = {
  ...WMSErrorLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: WMSLoaderOptions): Promise<string> =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: WMSLoaderOptions): string =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WMSLoaderOptions): string => parseTextSync(text, options)
} as const satisfies LoaderWithParser<string, never, WMSLoaderOptions>;

function parseTextSync(text: string, options?: WMSLoaderOptions): string {
  const wmsOptions: WMSLoaderOptions['wms'] = {
    ...WMSErrorLoaderWithParser.options.wms,
    ...options?.wms
  };
  const error = parseWMSError(text, wmsOptions);
  const message = wmsOptions.minimalErrors ? error : `WMS Service error: ${error}`;
  if (wmsOptions.throwOnError) {
    throw new Error(message);
  }
  return message;
}
