// loaders.gl, MIT license

import type {XMLLoaderOptions} from '@loaders.gl/xml';
import {XMLLoader} from '@loaders.gl/xml';

/** Layer description - response to a WMS `DescribeLayer` request  */
export type WMSLayerDescription = {
  layers: {}[];
};

/**
 * Parses a typed data structure from raw XML for `GetFeatureInfo` response
 * @note Error handlings is fairly weak
 */
export function parseWMSLayerDescription(
  text: string,
  options?: XMLLoaderOptions
): WMSLayerDescription {
  const parsedXML = XMLLoader.parseTextSync?.(text, options);
  // TODO - implement parser
  return parsedXML as unknown as WMSLayerDescription;
}
