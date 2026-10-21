// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseXMLTextSync} from '../xml/parse-xml-text';

/** One WFS feature type advertised for GetFeature queries. */
export type WFSFeatureType = {
  /** Qualified feature type name. */
  name: string;
  /** Human-readable title. */
  title?: string;
  /** Description of the feature type. */
  abstract?: string;
  /** Default and alternate coordinate reference systems. */
  crs: string[];
  /** Advertised output MIME types. */
  formats: string[];
  /** WGS84 extent in XY order. */
  boundingBox?: [[number, number], [number, number]];
};

/** All capabilities of a WFS service - response to a WFS `GetCapabilities` data structure extracted from XML */
export type WFSCapabilities = {
  /** Normalized WFS 1.1/2.0 feature types. */
  featureTypes?: WFSFeatureType[];
  serviceIdentification: {
    title: string;
    serviceTypeVersion: string;
    serviceType: string;
    /** Optional service description. */
    abstract?: string;
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
export function parseWFSCapabilities(text: string, options): WFSCapabilities {
  const parsedXML = parseXMLTextSync(text, {
    ...options,
    xml: {
      ...options?.xml,
      _parser: 'internal',
      removeNSPrefix: true,
      uncapitalizeKeys: true
    }
  });

  const capabilities =
    parsedXML.wFS_Capabilities ||
    parsedXML.WFS_Capabilities ||
    parsedXML.capabilities ||
    parsedXML.Capabilities ||
    parsedXML;
  const featureTypes = asArray(capabilities.featureTypeList?.featureType).map(featureType => {
    const lower = parseCorner(
      (featureType.wGS84BoundingBox || featureType.wgs84BoundingBox)?.lowerCorner
    );
    const upper = parseCorner(
      (featureType.wGS84BoundingBox || featureType.wgs84BoundingBox)?.upperCorner
    );
    return {
      name: String(featureType.name || ''),
      title: featureType.title,
      abstract: featureType.abstract,
      crs: [
        featureType.defaultCRS || featureType.defaultSRS,
        ...asArray(featureType.otherCRS || featureType.otherSRS)
      ].filter(Boolean),
      formats: asArray(featureType.outputFormats?.format),
      boundingBox: lower && upper ? [lower, upper] : undefined
    };
  });
  const operations = capabilities.operationsMetadata?.operation;
  return {
    ...capabilities,
    featureTypes,
    operationsMetadata: operations
      ? Object.fromEntries(asArray(operations).map(operation => [operation.name, operation]))
      : capabilities.operationsMetadata
  };
}

/** Normalizes singleton or repeated XML elements. */
function asArray(value: any): any[] {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

/** Reads a finite XY coordinate from an OWS bounding-box corner. */
function parseCorner(value: unknown): [number, number] | undefined {
  const values = String(value || '')
    .trim()
    .split(/\s+/)
    .map(Number);
  return values.length === 2 && values.every(Number.isFinite) ? [values[0], values[1]] : undefined;
}
