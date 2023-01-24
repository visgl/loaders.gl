// loaders.gl, MIT license

import type {
  WMSCapabilities,
  WMSLayer,
  WMSRequest,
  WMSFeatureInfo,
  WMSLayerDescription
  // WMSFeature,
  // WMSLayerDescription
} from './wms-types';

import {XMLLoader} from '@loaders.gl/xml';

// GetCapabilities

/**
 * Parses a typed data structure from raw XML for `GetCapabilities` response
 * @note Error handlings is fairly weak
 */
export function parseWMSCapabilities(text: string, options): WMSCapabilities {
  const parsedXML = XMLLoader.parseTextSync?.(text, options);
  const xmlCapabilities: any =
    parsedXML.WMT_MS_Capabilities || parsedXML.WMS_Capabilities || parsedXML;
  return extractCapabilities(xmlCapabilities);
}

/** Extract typed capability data from XML */
function extractCapabilities(xml: any): WMSCapabilities {
  const capabilities: WMSCapabilities = {
    name: xml.Service?.Name || 'unnamed',
    title: xml.Service?.Title,
    keywords: [],
    requests: {},
    layer: extractLayer(xml.Capability?.Layer),
    raw: xml
  };

  for (const keyword of xml.Service?.KeywordList?.Keyword || []) {
    capabilities.keywords.push(keyword);
  }

  for (const [name, xmlRequest] of Object.entries(xml.Capability?.Request || {})) {
    capabilities.requests[name] = extractRequest(name, xmlRequest);
  }

  return capabilities;
}

/** Extract typed request data from XML */
function extractRequest(name: string, xmlRequest: any): WMSRequest {
  const format: string | string[] = xmlRequest?.Format;
  const mimeTypes: string[] = Array.isArray(format) ? format : [format];
  return {name, mimeTypes};
}

/** Extract request data */
function extractLayer(xmlLayer: any): WMSLayer {
  const layer: WMSLayer = {
    name: xmlLayer?.Name,
    title: xmlLayer?.Title,
    srs: xmlLayer?.SRS || [],
    layers: []
  };

  for (const xmlSubLayer of xmlLayer?.Layer || []) {
    layer.layers?.push(extractLayer(xmlSubLayer));
  }

  return layer;
}

// GetFeatureInfo

/**
 * Parses a typed data structure from raw XML for `GetFeatureInfo` response
 * @note Error handlings is fairly weak
 */
export function parseWMSFeatureInfo(text: string, options): WMSFeatureInfo {
  const parsedXML = XMLLoader.parseTextSync?.(text, options);
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

// GetFeatureInfo

/**
 * Parses a typed data structure from raw XML for `GetFeatureInfo` response
 * @note Error handlings is fairly weak
 */
export function parseWMSLayerDescription(text: string, options): WMSLayerDescription {
  const parsedXML = XMLLoader.parseTextSync?.(text, options);
  // TODO - implement parser
  return parsedXML as unknown as WMSLayerDescription;
}
