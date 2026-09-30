// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseXMLTextSync} from '../xml/parse-xml-text';

/** A normalized WMTS capabilities document. */
export type WMTSCapabilities = {
  serviceIdentification?: {title?: string; abstract?: string; serviceTypeVersion?: string};
  operationsMetadata?: Record<string, unknown>;
  /** Advertised KVP GET endpoint; null means metadata advertises no supported KVP query binding. */
  featureInfoUrl?: string | null;
  contents: {layers: WMTSLayer[]; tileMatrixSets: WMTSTileMatrixSet[]};
};

/** A layer advertised by a WMTS capabilities document. */
export type WMTSLayer = {
  identifier: string;
  title?: string;
  abstract?: string;
  formats: string[];
  /** Advertised feature-info MIME types; omitted for legacy supplied capabilities. */
  infoFormats?: string[];
  styles: WMTSStyle[];
  /** Matrix sets and optional layer-specific tile coverage. */
  tileMatrixSetLinks: WMTSTileMatrixSetLink[];
  /** Advertised dimensions; omitted for legacy supplied capabilities. */
  dimensions?: WMTSDimension[];
  resourceURLs: {template: string; format?: string; resourceType?: string}[];
  bounds?: [number, number, number, number];
};

/** A layer's reference to a tile matrix set and its inclusive coverage limits. */
export type WMTSTileMatrixSetLink = {
  /** Referenced matrix set identifier. */
  tileMatrixSet: string;
  /** Allowed matrices and tile ranges; undefined means the full matrix set. */
  limits?: WMTSTileMatrixLimits[];
};

/** Inclusive row and column bounds for one layer's tile matrix. */
export type WMTSTileMatrixLimits = {
  /** Referenced tile matrix identifier. */
  tileMatrix: string;
  /** Minimum available row, inclusive. */
  minimumTileRow: number;
  /** Maximum available row, inclusive. */
  maximumTileRow: number;
  /** Minimum available column, inclusive. */
  minimumTileColumn: number;
  /** Maximum available column, inclusive. */
  maximumTileColumn: number;
};

/** An advertised WMTS dimension; values and intervals retain their lexical representation. */
export type WMTSDimension = {
  /** Dimension name used in requests and resource templates. */
  identifier: string;
  /** Human-readable dimension title, when provided. */
  title?: string;
  /** Human-readable dimension description, when provided. */
  abstract?: string;
  /** Advertised units of measure. */
  unitsOfMeasure?: string;
  /** Display symbol for the dimension's units. */
  unitSymbol?: string;
  /** Advertised default; no value is guessed when it is absent. */
  default?: string;
  /** Whether the server advertises support for the current keyword. */
  current?: boolean;
  /** Advertised values or intervals, without expanding ranges. */
  values: string[];
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
      textNodeName: '#text',
      _fastXML: {...((options as any)?.xml?._fastXML || {}), parseTagValue: false},
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
    featureInfoUrl: getFeatureInfoUrl(capabilities.operationsMetadata),
    contents: {layers, tileMatrixSets}
  };
}

/** Extracts an advertised KVP GET endpoint, excluding REST-only operation bindings. */
function getFeatureInfoUrl(operationsMetadata: any): string | null | undefined {
  if (!operationsMetadata) return undefined;
  const operation = asArray(operationsMetadata?.operation).find(
    candidate => candidate.name === 'GetFeatureInfo'
  );
  for (const protocol of asArray(operation?.dCP)) {
    for (const endpoint of asArray(protocol.hTTP?.get)) {
      const encoding = [
        ...asArray(endpoint.constraint),
        ...asArray(operation.constraint),
        ...asArray(operationsMetadata.constraint)
      ].find(candidate => candidate.name === 'GetEncoding');
      if (
        !encoding ||
        encoding.anyValue !== undefined ||
        asArray(encoding.allowedValues?.value).some(value => text(value) === 'KVP')
      ) {
        if (endpoint.href) return endpoint.href;
      }
    }
  }
  return null;
}

function normalizeLayer(layer: any): WMTSLayer {
  const resourceURLs = asArray(layer.resourceURL || layer.resourceUrls).map(resourceURL => ({
    template: resourceURL.template,
    format: resourceURL.format,
    resourceType: resourceURL.resourceType
  }));
  const lowerCorner = parseNumbers((layer.wGS84BoundingBox || layer.wgs84BoundingBox)?.lowerCorner);
  const upperCorner = parseNumbers((layer.wGS84BoundingBox || layer.wgs84BoundingBox)?.upperCorner);
  return {
    identifier: text(layer.identifier),
    title: text(layer.title),
    abstract: text(layer.abstract),
    formats: asArray(layer.format).map(text).filter(Boolean),
    infoFormats: asArray(layer.infoFormat).map(text).filter(Boolean),
    styles: asArray(layer.style).map(style => ({
      identifier: text(style.identifier),
      title: text(style.title),
      isDefault: style.isDefault === true || style.isDefault === 'true'
    })),
    tileMatrixSetLinks: asArray(layer.tileMatrixSetLink).map(normalizeTileMatrixSetLink),
    dimensions: asArray(layer.dimension).map(normalizeDimension),
    resourceURLs: resourceURLs.filter(resourceURL => resourceURL.template),
    bounds:
      lowerCorner.length >= 2 && upperCorner.length >= 2
        ? [lowerCorner[0], lowerCorner[1], upperCorner[0], upperCorner[1]]
        : undefined
  };
}

/** Normalizes a link, distinguishing omitted limits from an explicitly empty limits list. */
function normalizeTileMatrixSetLink(link: any): WMTSTileMatrixSetLink {
  const limits =
    link.tileMatrixSetLimits === undefined
      ? undefined
      : (asArray(link.tileMatrixSetLimits?.tileMatrixLimits).map(limit => ({
          tileMatrix: text(limit.tileMatrix),
          minimumTileRow: number(limit.minTileRow),
          maximumTileRow: number(limit.maxTileRow),
          minimumTileColumn: number(limit.minTileCol),
          maximumTileColumn: number(limit.maxTileCol)
        })) as WMTSTileMatrixLimits[]);
  if (limits) validateTileMatrixLimits(limits);
  return {tileMatrixSet: text(link.tileMatrixSet), limits};
}

/** Rejects malformed or ambiguous bounds for parsed and application-supplied capabilities. */
export function validateTileMatrixLimits(limits: WMTSTileMatrixLimits[]): void {
  const identifiers = new Set<string>();
  for (const limit of limits) {
    if (!limit.tileMatrix || identifiers.has(limit.tileMatrix))
      throw new Error('WMTS tile matrix limits require unique matrix identifiers');
    identifiers.add(limit.tileMatrix);
    for (const value of [
      limit.minimumTileRow,
      limit.maximumTileRow,
      limit.minimumTileColumn,
      limit.maximumTileColumn
    ]) {
      if (!Number.isSafeInteger(value) || value < 0)
        throw new Error('WMTS tile matrix limits require nonnegative safe integers');
    }
    if (
      limit.minimumTileRow > limit.maximumTileRow ||
      limit.minimumTileColumn > limit.maximumTileColumn
    )
      throw new Error('WMTS tile matrix limits have reversed bounds');
  }
}

/** Preserves dimension strings, including zero, leading zeros, intervals and reserved keywords. */
function normalizeDimension(dimension: any): WMTSDimension {
  return {
    identifier: text(dimension.identifier),
    title: text(dimension.title) || undefined,
    abstract: text(dimension.abstract) || undefined,
    unitsOfMeasure: text(dimension.uOM || dimension.uom) || undefined,
    unitSymbol: text(dimension.unitSymbol) || undefined,
    default: dimension.default === undefined ? undefined : text(dimension.default),
    current:
      dimension.current === undefined ? undefined : ['true', '1'].includes(text(dimension.current)),
    values: asArray(dimension.value).map(text)
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
  if (!text(value).trim()) return undefined;
  const parsedValue = Number(text(value));
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function parseNumbers(value: any): number[] {
  return text(value).trim()
    ? text(value).trim().split(/\s+/).map(Number).filter(Number.isFinite)
    : [];
}
