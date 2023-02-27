// loaders.gl, MIT license

import {XMLLoader} from '@loaders.gl/xml';

/** All capabilities of a WCS service - response to a WCS `GetCapabilities` data structure extracted from XML */
export type WCSCapabilities = {
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
    layers: {
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
      tileMatrixSets: {
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
        }[];
      };
    }[];
  };
};

/**
 * Parses a typed data structure from raw XML for `GetCapabilities` response
 * @note Error handlings is fairly weak
 */
export function parseWCSCapabilities(text: string, options): WCSCapabilities {
  const parsedXML = XMLLoader.parseTextSync(text, {...options, xml: {...options?.xml, removeNSPrefix: true}});
  const xmlCapabilities: any = parsedXML.Capabilities || parsedXML;
  return xmlCapabilities;
}
