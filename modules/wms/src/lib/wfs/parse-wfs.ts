// loaders.gl, MIT license

import type {
  WFSCapabilities,
  WFSLayer,
  WFSRequest,
  WFSFeatureInfo
  // WFSFeature,
  // WFSLayerDescription
} from './wfs-types';

import {XMLLoader} from '@loaders.gl/xml';

// GetCapabilities

/**
 * Parses a typed data structure from raw XML for `GetCapabilities` response
 * @note Error handlings is fairly weak
 */
export function parseWFSCapabilities(text: string, options): WFSCapabilities {
  const parsedXML = XMLLoader.parseTextSync(text, options);
  const xmlCapabilities: any =
    parsedXML.WMT_MS_Capabilities || parsedXML.WFS_Capabilities || parsedXML;
  return extractCapabilities(xmlCapabilities);
}

/** Extract typed capability data from XML */
function extractCapabilities(xml: any): WFSCapabilities {
  const capabilities: WFSCapabilities = {
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
function extractRequest(name: string, xmlRequest: any): WFSRequest {
  const format: string | string[] = xmlRequest?.Format;
  const mimeTypes: string[] = Array.isArray(format) ? format : [format];
  return {name, mimeTypes};
}

/** Extract request data */
function extractLayer(xmlLayer: any): WFSLayer {
  const layer: WFSLayer = {
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
export function parseWFSFeatureInfo(text: string, options): WFSFeatureInfo {
  const parsedXML = XMLLoader.parseTextSync(text, options);
  const xmlFeatureInfo: any = parsedXML.FeatureInfoResponse?.FIELDS || [];

  const xmlFeatures = Array.isArray(xmlFeatureInfo) ? xmlFeatureInfo : [xmlFeatureInfo];

  return {
    features: xmlFeatures.map((xmlFeature) => extractFeature(xmlFeature))
  };
}

function extractFeature(xmlFeature: any) {
  const xmlFields = xmlFeature || {};
  return {attributes: xmlFields};
}
