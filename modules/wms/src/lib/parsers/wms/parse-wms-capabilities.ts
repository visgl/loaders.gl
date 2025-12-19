// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {XMLLoader} from '@loaders.gl/xml';
import {
  getXMLArray,
  getXMLStringArray,
  getXMLInteger,
  getXMLFloat,
  getXMLBoolean
} from '../xml/parse-xml-helpers';

/** All capabilities of a WMS service - response to a WMS `GetCapabilities` data structure extracted from XML */
export type WMSCapabilities = {
  /** Version of the WMS service */
  version?: string; // '1.3.0' | '1.1.1' | '1.1.0' | '1.0.0'
  /** A short name for the service */
  name: string;
  /** A human readable name for the service */
  title?: string;
  /** A more extensive description of the service */
  abstract?: string;
  /** A set of keywords e.g. for searching services */
  keywords: string[];
  /** A field of unspecified format, if present describes any access constraints required to use the service. */
  accessConstraints?: string;
  /** A field of unspecified format, if present describes any fees associated with the use of the service */
  fees?: string;
  /** If present, the max number of layers that can be rendered by the service */
  layerLimit?: number;
  /** If present, the widest image that can be rendered by the service */
  maxWidth?: number;
  /** If present, the tallest image that can be rendered by the service */
  maxHeight?: number;
  /** Hierarchical list of layers. */
  layers: WMSLayer[];
  /** A map with information about supported WMS requests. If a record is present, the request is supported by the service */
  requests: Record<string, WMSRequest>;
  /** Information about any exceptions that the service will report (HTTP status != 2xx) */
  exceptions?: WMSExceptions;
  /** Only if `options.json`: raw untyped JSON parsed from XML. Can include information not extracted in the typed response. */
  json?: Record<string, unknown>;
  /** Only if `options.xml`, the unparsed XML string can be requested */
  xml?: string;
};

/**
 * Metadata about a layer
 * Layers inherit many properties from their parent layers, see description of individual props for details.
 * @see https://www.ogc.org/standard/wms/ 7.2.4.6
 */
export type WMSLayer = {
  /** The title is a human readable name. It is mandatory on each layer. Not inherited.  */
  title: string;
  /** A layer is renderable if it has a name. A named parent layer will render all its sublayers. Not inherited. */
  name?: string;
  /** A narrative description of the map layer. */
  abstract?: string;
  /** A set of keywords e.g. for searching layers */
  keywords: string[];
  /** layer limits in unspecified CRS:84-like lng/lat, for quick access w/o CRS calculations.  Defined or inherited. */
  geographicBoundingBox?: [min: [x: number, y: number], max: [x: number, y: number]];
  /** Supported CRS. Either defined or inherited. */
  crs?: string[];
  /** Bounding boxes in specific CRS:es */
  boundingBoxes?: WMSBoundingBox[];

  // minScale: number;
  // maxScale: number;
  // dimensions: ?? 7.2.4.6.10
  // MetadataURL
  // Attribution
  // Identifier and AuthorityURL
  // FeatureListURL
  // DataURL

  /** any extra dimension such as time */
  dimensions?: WMSDimension[];

  /** Whether queries can be performed on the layer */
  queryable?: boolean;
  /** `false` if layer has significant no-data areas that the client can display as transparent. */
  opaque?: boolean;
  /** WMS cascading allows server to expose layers coming from other WMS servers as if they were local layers */
  cascaded?: boolean;
  // noSubsets: boolean
  // fixedWith: number
  // fixedHeight: number

  /** A list of styles. @note not yet supported by WMSCapabilitiesLoader */
  styles?: unknown[];

  /** Sublayers - these inherit crs and boundingBox) if not overridden) */
  layers?: WMSLayer[];
};

/**
 * A bounding box specifies the coordinate range for data in the layer.
 * No data is available outside the bounding box.
 */
export type WMSBoundingBox = {
  /** CRS indicates the Layer CRS that applies to this bounding box. */
  crs: string;
  /** `[[w, s], [e, n]]`, indicates the limits of the bounding box using the axis units and order of the specified CRS. */
  boundingBox: [min: [x: number, y: number], max: [x: number, y: number]];
  /** Spatial horizontal resolution of data in same units as bounding box */
  xResolution?: number;
  /** Spatial vertical resolution of data in same units as bounding box */
  yResolution?: number;
};

/**
 * An optional dimension that can be queried using the `name=...` parameter
 * Note that layers that have at least one dimension without `default` value
 * become unrenderable unless the dimension value is supplied to GetMap requests.
 */
export type WMSDimension = {
  /** name of dimension, becomes a valid parameter key for this layer */
  name: string;
  /** Textual units for this dimensional axis */
  units: string;
  /** Unit symbol for this dimensional axis */
  unitSymbol?: string;
  /** Default value if no value is supplied. If dimension lacks defaultValue, requests fail if no value is supplied */
  defaultValue?: string;
  /** Can multiple values of the dimension be requested? */
  multipleValues?: boolean;
  /* Will nearest values will be substituted when out of range, if false exact values are required */
  nearestValue?: boolean;
  /** A special value "current" is supported, typically for time dimension */
  current?: boolean;
  /** Text content indicating available values for dimension */
  extent: string;
};

/** Metadata about a supported WMS request  */
export type WMSRequest = {
  /** MIMEtypes that can be returned by this request. */
  mimeTypes: string[];
};

export type WMSExceptions = {
  /** MIME types for exception response payloads. */
  mimeTypes: string[];
};

export type ParseWMSCapabilitiesOptions = {
  /** Add inherited layer information to sub layers */
  inheritedLayerProps?: boolean;
  /** Include the "raw" JSON (parsed but untyped, unprocessed XML). May contain additional fields */
  includeRawJSON?: boolean;
  /** Include the original XML document text. May contain additional information. */
  includeXMLText?: boolean;
};

/**
 * Parses a typed data structure from raw XML for `GetCapabilities` response
 * @note Error handlings is fairly weak
 */
export function parseWMSCapabilities(
  xmlText: string,
  options?: ParseWMSCapabilitiesOptions
): WMSCapabilities {
  const parsedXML = XMLLoader.parseTextSync?.(xmlText, options);
  const xmlCapabilities: any =
    parsedXML.WMT_MS_Capabilities || parsedXML.WMS_Capabilities || parsedXML;
  const capabilities = extractCapabilities(xmlCapabilities);
  // In case the processed, normalized capabilities do not contain everything,
  // the user can get the parsed XML structure.
  if (options?.inheritedLayerProps) {
    // Traverse layers and inject missing props from parents
    for (const layer of capabilities.layers) {
      addInheritedLayerProps(layer, null);
    }
    // Not yet implemented
  }

  if (options?.includeRawJSON) {
    capabilities.json = xmlCapabilities;
  }

  if (options?.includeXMLText) {
    capabilities.xml = xmlText;
  }

  return capabilities;
}

/** Extract typed capability data from XML */
function extractCapabilities(xml: any): WMSCapabilities {
  const capabilities: WMSCapabilities = {
    version: String(xml.version || ''),
    name: String(xml.Service?.Name || 'unnamed'),
    title: xml.Service?.Title ? String(xml.Service?.Title) : undefined,
    abstract: xml.Service?.Abstract ? String(xml.Service?.Abstract) : undefined,
    keywords: getXMLStringArray(xml.Service?.KeywordList?.Keyword),
    fees: xml.Service?.Fees ? JSON.stringify(xml.Service?.Fees) : undefined,
    accessConstraints: xml.Service?.AccessConstraints
      ? JSON.stringify(xml.Service?.AccessConstraints)
      : undefined,
    layerLimit: getXMLInteger(xml.Service?.LayerLimit),
    maxWidth: getXMLInteger(xml.Service?.maxWidth),
    maxHeight: getXMLInteger(xml.Service?.maxHeight),
    layers: [],
    requests: extractRequests(xml.Capability?.Request),
    exceptions: extractExceptions(xml.Exception)
    // contact field is a mess of largely irrelevant information, put it last
    // contact: xml.Service?.Contact ? JSON.stringify(xml.Service?.Contact) : undefined,
  };

  // LAYERS
  const xmlLayers = getXMLArray(xml.Capability?.Layer);
  for (const xmlSubLayer of xmlLayers) {
    capabilities.layers.push(extractLayer(xmlSubLayer));
  }

  // Clean up object
  for (const [key, value] of Object.entries(capabilities)) {
    if (value === undefined) {
      delete capabilities[key];
    }
  }

  return capabilities;
}

/** Extract typed request metadata from XML requests field */
function extractRequests(xmlRequests: any): Record<string, WMSRequest> {
  const requests: Record<string, WMSRequest> = {};
  for (const [name, xmlRequest] of Object.entries(xmlRequests || {}) as any) {
    const mimeTypes = getXMLStringArray(xmlRequest?.Format);
    requests[name] = {mimeTypes};
  }
  return requests;
}

function extractExceptions(xmlException: any): WMSExceptions | undefined {
  const xmlExceptionFormats = getXMLArray(xmlException?.Format);
  if (xmlExceptionFormats.length > 0) {
    return {
      mimeTypes: getXMLStringArray(xmlException)
    };
  }
  return undefined;
}

/** Extract request data */
// eslint-disable-next-line complexity, max-statements
function extractLayer(xmlLayer: any): WMSLayer {
  const layer: WMSLayer = {
    // All layers must have a title
    title: String(xmlLayer?.Title || ''),
    // Name is required only if renderable
    name: xmlLayer?.Name && String(xmlLayer?.Name),
    abstract: xmlLayer?.Name && String(xmlLayer?.Abstract),
    keywords: getXMLStringArray(xmlLayer.KeywordList?.Keyword)
  };

  // WMS 1.3.0 changes SRS to CRS
  const crs = xmlLayer?.CRS || xmlLayer?.SRS;
  if (crs && Array.isArray(crs) && crs.every((_) => typeof _ === 'string')) {
    layer.crs = crs;
  }

  // v1.3.0 extract simple geographic bounding box
  let geographicBoundingBox =
    xmlLayer?.EX_GeographicBoundingBox && extractEXBoundingBox(xmlLayer?.EX_GeographicBoundingBox);
  if (geographicBoundingBox) {
    layer.geographicBoundingBox = geographicBoundingBox;
  }

  // v1.1.1 extract simple geographic bounding box
  geographicBoundingBox =
    xmlLayer?.LatLonBoundingBox && extractLatLonBoundingBox(xmlLayer?.LatLonBoundingBox);
  if (geographicBoundingBox) {
    layer.geographicBoundingBox = geographicBoundingBox;
  }

  // Extract per-CRS bounding boxes
  const boundingBoxes = xmlLayer?.BoundingBox && extractWMSBoundingBoxes(xmlLayer?.BoundingBox);
  if (boundingBoxes && boundingBoxes.length > 0) {
    layer.boundingBoxes = boundingBoxes;
  }

  // Extract dimensions
  const xmlDimensions = getXMLArray(xmlLayer?.Dimension);
  const dimensions = xmlDimensions.map((xml) => extractDimension(xml));
  if (dimensions.length) {
    layer.dimensions = dimensions;
  }

  if (xmlLayer?.opaque) {
    layer.opaque = getXMLBoolean(xmlLayer?.opaque);
  }
  if (xmlLayer?.cascaded) {
    layer.cascaded = getXMLBoolean(xmlLayer?.cascaded);
  }
  if (xmlLayer?.queryable) {
    layer.queryable = getXMLBoolean(xmlLayer?.queryable);
  }

  // Single layer is not represented as array in XML
  const xmlLayers = getXMLArray(xmlLayer?.Layer);
  const layers: WMSLayer[] = [];

  for (const xmlSubLayer of xmlLayers) {
    layers.push(extractLayer(xmlSubLayer));
  }

  if (layers.length > 0) {
    layer.layers = layers;
  }

  // Clean up object
  for (const [key, value] of Object.entries(layer)) {
    if (value === undefined) {
      delete layer[key];
    }
  }

  return layer;
}

/** WMS 1.3.0 Loosely defined geospatial bounding box in unspecified CRS for quick content searches */
function extractEXBoundingBox(xmlBoundingBox: any): [[number, number], [number, number]] {
  const {
    westBoundLongitude: w,
    northBoundLatitude: n,
    eastBoundLongitude: e,
    southBoundLatitude: s
  } = xmlBoundingBox;
  return [
    [w, s],
    [e, n]
  ];
}

/** WMS 1.1.1 Loosely defined geospatial bounding box in unspecified CRS for quick content searches */
function extractLatLonBoundingBox(xmlBoundingBox: any): [[number, number], [number, number]] {
  const {minx, miny, maxx, maxy} = xmlBoundingBox;
  return [
    [minx, miny],
    [maxx, maxy]
  ];
}

/** Loosely defined geospatial bounding box in unspecified CRS for quick content searches */
function extractWMSBoundingBoxes(xmlBoundingBoxes: any): WMSBoundingBox[] {
  const xmlBoxes = getXMLArray(xmlBoundingBoxes);
  return xmlBoxes.map((xmlBox) => extractWMSBoundingBox(xmlBox));
}

/** Loosely defined geospatial bounding box in unspecified CRS for quick content searches */
function extractWMSBoundingBox(xmlBoundingBox: any): WMSBoundingBox {
  const {CRS, SRS, minx, miny, maxx, maxy, resx, resy} = xmlBoundingBox;
  const boundingBox: WMSBoundingBox = {
    // CRS in 1.3.0, SRS in 1.1.1
    crs: CRS || SRS,
    boundingBox: [
      [getXMLFloat(minx) as number, getXMLFloat(miny) as number],
      [getXMLFloat(maxx) as number, getXMLFloat(maxy) as number]
    ]
  };
  if (resx) {
    boundingBox.xResolution = resx;
  }
  if (resy) {
    boundingBox.yResolution = resy;
  }
  return boundingBox;
}

/**
 * Extracts optional WMS Dimension layer field
 * @param xmlDimension
 * @example <Dimension name="time" units="ISO8601" default="2018-01-01" nearestValue="0">2001-01-01/2018-01-01/P1Y</Dimension>
 * @see https://mapserver.org/ogc/wms_dimension.html
 */
function extractDimension(xmlDimension: any): WMSDimension {
  const {name, units, value: extent} = xmlDimension;

  const dimension: WMSDimension = {name, units, extent};

  if (xmlDimension.unitSymbol) {
    dimension.unitSymbol = xmlDimension.unitSymbol;
  }
  if (xmlDimension.default) {
    dimension.defaultValue = xmlDimension.default;
  }
  if (xmlDimension.multipleValues) {
    dimension.multipleValues = getXMLBoolean(xmlDimension.multipleValues);
  }
  if (xmlDimension.nearestValue) {
    dimension.nearestValue = getXMLBoolean(xmlDimension.nearestValue);
  }
  if (xmlDimension.current) {
    dimension.current = getXMLBoolean(xmlDimension.current);
  }

  return dimension;
}

/** Traverse layers and inject missing props from parents */
// eslint-disable-next-line complexity
function addInheritedLayerProps(layer: WMSLayer, parent: WMSLayer | null): void {
  if (parent?.geographicBoundingBox && !layer.geographicBoundingBox) {
    layer.geographicBoundingBox = [...parent.geographicBoundingBox];
  }

  if (parent?.crs && !layer.crs) {
    layer.crs = [...parent.crs];
  }

  if (parent?.boundingBoxes && !layer.boundingBoxes) {
    layer.boundingBoxes = [...parent.boundingBoxes];
  }

  if (parent?.dimensions && !layer.dimensions) {
    layer.dimensions = [...parent.dimensions];
  }

  for (const subLayer of layer.layers || []) {
    addInheritedLayerProps(subLayer, layer);
  }
}
