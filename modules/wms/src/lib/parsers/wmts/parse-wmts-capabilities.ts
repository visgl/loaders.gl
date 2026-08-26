// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseXMLTextSync} from '../xml/parse-xml-text';

/** A normalized WMTS capabilities document. */
export type WMTSCapabilities = {
  serviceIdentification?: {title?: string; abstract?: string; serviceTypeVersion?: string};
  operationsMetadata?: Record<string, unknown>;
  contents: {layers: WMTSLayer[]; tileMatrixSets: WMTSTileMatrixSet[]};
};

/** A layer advertised by a WMTS capabilities document. */
export type WMTSLayer = {
  identifier: string;
  title?: string;
  abstract?: string;
  formats: string[];
  styles: WMTSStyle[];
  tileMatrixSetLinks: {tileMatrixSet: string}[];
  resourceURLs: {template: string; format?: string; resourceType?: string}[];
  bounds?: [number, number, number, number];
};

/** A WMTS tile matrix set. */
export type WMTSTileMatrixSet = {
  identifier: string;
  supportedCRS?: string;
  matrices: WMTSTileMatrix[];
};

/** A WMTS tile matrix definition. */
export type WMTSTileMatrix = {
  identifier: string;
  scaleDenominator?: number;
  topLeftCorner?: [number, number];
  tileWidth?: number;
  tileHeight?: number;
  matrixWidth?: number;
  matrixHeight?: number;
};

/** A WMTS layer style. */
export type WMTSStyle = {identifier: string; title?: string; isDefault?: boolean};

/** Parses and normalizes a WMTS GetCapabilities response. */
export function parseWMTSCapabilities(text: string, options?: unknown): WMTSCapabilities {
  const parsedXML = parseXMLTextSync(text, {
    xml: {
      ...((options as any)?.xml || {}),
      _parser: 'internal',
      removeNSPrefix: true,
      uncapitalizeKeys: true
    }
  });
  const capabilities = parsedXML.capabilities || parsedXML.Capabilities || parsedXML;
  const contents = capabilities.contents || {};
  const layers = asArray(contents.layer)
    .map(normalizeLayer)
    .filter(layer => layer.identifier);
  const tileMatrixSets = asArray(contents.tileMatrixSet)
    .map(normalizeTileMatrixSet)
    .filter(tileMatrixSet => tileMatrixSet.identifier);

  return {
    serviceIdentification: normalizeServiceIdentification(capabilities.serviceIdentification),
    operationsMetadata: capabilities.operationsMetadata,
    contents: {layers, tileMatrixSets}
  };
}

function normalizeLayer(layer: any): WMTSLayer {
  const resourceURLs = asArray(layer.resourceURL || layer.resourceUrls).map(resourceURL => ({
    template: resourceURL.template,
    format: resourceURL.format,
    resourceType: resourceURL.resourceType
  }));
  const lowerCorner = parseNumbers(layer.wgs84BoundingBox?.lowerCorner);
  const upperCorner = parseNumbers(layer.wgs84BoundingBox?.upperCorner);
  return {
    identifier: text(layer.identifier),
    title: text(layer.title),
    abstract: text(layer.abstract),
    formats: asArray(layer.format).map(text).filter(Boolean),
    styles: asArray(layer.style).map(style => ({
      identifier: text(style.identifier),
      title: text(style.title),
      isDefault: style.isDefault === true || style.isDefault === 'true'
    })),
    tileMatrixSetLinks: asArray(layer.tileMatrixSetLink).map(link => ({
      tileMatrixSet: text(link.tileMatrixSet)
    })),
    resourceURLs: resourceURLs.filter(resourceURL => resourceURL.template),
    bounds:
      lowerCorner.length >= 2 && upperCorner.length >= 2
        ? [lowerCorner[0], lowerCorner[1], upperCorner[0], upperCorner[1]]
        : undefined
  };
}

function normalizeTileMatrixSet(tileMatrixSet: any): WMTSTileMatrixSet {
  return {
    identifier: text(tileMatrixSet.identifier),
    supportedCRS: text(tileMatrixSet.supportedCRS),
    matrices: asArray(tileMatrixSet.tileMatrix).map(matrix => ({
      identifier: text(matrix.identifier),
      scaleDenominator: number(matrix.scaleDenominator),
      topLeftCorner: parseNumbers(matrix.topLeftCorner) as [number, number],
      tileWidth: number(matrix.tileWidth),
      tileHeight: number(matrix.tileHeight),
      matrixWidth: number(matrix.matrixWidth),
      matrixHeight: number(matrix.matrixHeight)
    }))
  };
}

function normalizeServiceIdentification(serviceIdentification: any) {
  if (!serviceIdentification) return undefined;
  return {
    title: text(serviceIdentification.title),
    abstract: text(serviceIdentification.abstract),
    serviceTypeVersion: text(serviceIdentification.serviceTypeVersion)
  };
}

function asArray(value: any): any[] {
  return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
}

function text(value: any): string {
  return value === undefined || value === null
    ? ''
    : typeof value === 'object'
      ? value['#text'] || ''
      : String(value);
}

function number(value: any): number | undefined {
  const parsedValue = Number(text(value));
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function parseNumbers(value: any): number[] {
  return text(value).trim().split(/\s+/).map(Number).filter(Number.isFinite);
}
