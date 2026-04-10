// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {XMLLoaderOptions} from '@loaders.gl/xml';
import {XMLLoader} from '@loaders.gl/xml';
import {parseExceptionReport} from './parse-exception-report';

// CSW:GetCapabilitiesResponse

/** All capabilities of a CSW service - response to a CSW `GetCapabilities` data structure extracted from XML */
export type CSWCapabilities = {
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
export function parseCSWCapabilities(text: string, options?: XMLLoaderOptions): CSWCapabilities {
  const parsedXML = XMLLoader.parseTextSync?.(text, {
    ...options,
    xml: {
      ...options?.xml,
      removeNSPrefix: true,
      uncapitalizeKeys: true
    }
  });

  parseExceptionReport(parsedXML);

  const xmlCapabilities: any = parsedXML.capabilities || parsedXML;
  return xmlCapabilities;
}
