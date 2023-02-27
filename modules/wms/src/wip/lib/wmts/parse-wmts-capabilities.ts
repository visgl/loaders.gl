// loaders.gl, MIT license

import {XMLLoader} from '@loaders.gl/xml';


/** All capabilities of a WMTS service - response to a WMTS `GetCapabilities` data structure extracted from XML */
export type WMTSCapabilities = {
  serviceIdentification: {
    title: string;
    serviceTypeVersion: string;
    serviceType: string;
  };

  serviceProvider: {
    providerName: string;
    providerSite: string;
    serviceContact: {
      individualName: string;
      positionName: string;
      contactInfo: {
        address: {
          administrativeArea: string;
          city: string;
          country: string;
          deliveryPoint: string;
          electronicMailAddress: string;
          postalCode: string;
        };
        phone: {
          voice: string;
        };
      };
    };
  };

  operationsMetadata: {
    GetCapabilities: any;
    GetFeatureInfo: any;
    GetTile: any;
  };

  contents: {
    layers: WMTSLayer[];
  };
};

/** A layer in WMTS */
export type WMTSLayer = {
  abstract: string;
  identifier: string;
  title: string;
  formats: string[];
  styles: {
    identifier: string;
    isDefault: string;
    title: string;
    abstract?: string;
  }[];
  bounds: {
    left: number;
    right: number;
    bottom: number;
    top: number;
  };
  tileMatrixSetLinks: {
    tileMatrixSet: string;
  }[];
  tileMatrixSets: WMTSTileMatrixSet[];
};

/** A zoom level in WMTS */
export type WMTSTileMatrixSet = {
  identifier: string;
  matrixIds: {
    identifier: string;
    matrixHeight: number;
    matrixWidth: number;
    scaleDenominator: number;
    tileWidth: number;
    tileHeight: number;
    topLeftCorner: {
      lon: number;
      lat: number;
    };
  };
}

/**
 * Parses a typed data structure from raw XML for `GetCapabilities` response
 * @note Error handlings is fairly weak
 */
export function parseWMTSCapabilities(text: string, options): WMTSCapabilities {
  const parsedXML = XMLLoader.parseTextSync(text, {...options, xml: {
    ...options?.xml, 
    removeNSPrefix: true,
    uncapitalizeKeys: true
  }});

  const xmlCapabilities: any = parsedXML.Capabilities || parsedXML;
  return xmlCapabilities;
}

/**
 * Parses a typed data structure from raw XML for `GetCapabilities` response
 * @note Error handlings is fairly weak
 */
// export function parseWMTSCapabilities(text: string, options): WMTSCapabilities {
//   const parsedXML = XMLLoader.parseTextSync(text, options);
//   const xmlCapabilities: any =
//     parsedXML.WMT_MS_Capabilities || parsedXML.WMS_Capabilities || parsedXML;
//   return extractCapabilities(xmlCapabilities);
// }

/** Extract typed capability data from XML */
// function extractCapabilities(xml: any): WMTSCapabilities {
//   const capabilities: WMTSCapabilities = {
//     name: xml.Service?.Name || 'unnamed',
//     title: xml.Service?.Title,
//     keywords: [],
//     requests: {},
//     layer: extractLayer(xml.Capability?.Layer),
//     raw: xml
//   };

//   for (const keyword of xml.Service?.KeywordList?.Keyword || []) {
//     capabilities.keywords.push(keyword);
//   }

//   for (const [name, xmlRequest] of Object.entries(xml.Capability?.Request || {})) {
//     capabilities.requests[name] = extractRequest(name, xmlRequest);
//   }

//   return capabilities;
// }

// /** Extract typed request data from XML */
// function extractRequest(name: string, xmlRequest: any): WMSRequest {
//   const format: string | string[] = xmlRequest?.Format;
//   const mimeTypes: string[] = Array.isArray(format) ? format : [format];
//   return {name, mimeTypes};
// }

// /** Extract request data */
// function extractLayer(xmlLayer: any): WMSLayer {
//   const layer: WMSLayer = {
//     name: xmlLayer?.Name,
//     title: xmlLayer?.Title,
//     srs: xmlLayer?.SRS || [],
//     layers: []
//   };

//   // Single layer is not represented as array in XML
//   const xmlLayers = getXMLArray(xmlLayer?.Layer);

//   for (const xmlSubLayer of xmlLayers) {
//     layer.layers?.push(extractLayer(xmlSubLayer));
//   }

//   return layer;
// }

// function getXMLArray(xmlValue: any) {
//   if (Array.isArray(xmlValue)) {
//     return xmlValue;
//   }
//   if (xmlValue) {
//     return [xmlValue];
//   }
//   return [];
// }
