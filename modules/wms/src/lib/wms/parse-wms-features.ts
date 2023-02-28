// loaders.gl, MIT license

import {XMLLoader} from '@loaders.gl/xml';

/** WMS Feature info - response to a WMS `GetFeatureInfo` request */
export type WMSFeatureInfo = {
  features: WMSFeature[];
};

export type WMSFeature = {
  attributes: Record<string, number | string>;
  type: string;
  bounds: {top: number; bottom: number; left: number; right: number};
};

/**
 * Parses a typed data structure from raw XML for `GetFeatureInfo` response
 * @note Error handlings is fairly weak
 */
export function parseWMSFeatureInfo(text: string, options): WMSFeatureInfo {
  const parsedXML = XMLLoader.parseTextSync(text, options);
  const xmlFeatureInfo: any = parsedXML.FeatureInfoResponse?.FIELDS || [];

  const xmlFeatures = Array.isArray(xmlFeatureInfo) ? xmlFeatureInfo : [xmlFeatureInfo];

  return {
    features: xmlFeatures.map((xmlFeature) => extractFeature(xmlFeature))
  };
}

function extractFeature(xmlFeature: any) {
  const xmlFields = xmlFeature || {};
  // TODO - not correct
  return {
    attributes: xmlFields,
    type: '',
    bounds: {bottom: 0, top: 0, left: 0, right: 0}
  };
}
