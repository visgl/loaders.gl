// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
  Position
} from '@loaders.gl/schema';
import {parseXMLSync} from '@loaders.gl/xml';

interface XMLValueArray extends Array<XMLValue> {}
interface XMLObject {
  [key: string]: XMLValue;
}
type XMLValue = string | number | boolean | XMLObject | XMLValueArray;

/** A parsed KML style in the normalized loaders.gl representation. */
export type KMLStyle = {
  id: string;
  line?: {color?: string; opacity?: number; width?: number};
  polygon?: {color?: string; opacity?: number; fill?: boolean; outline?: boolean};
  icon?: {href?: string; scale?: number};
  label?: {color?: string; opacity?: number; scale?: number};
};

/** A KML screen or ground overlay retained by the document parser. */
export type KMLOverlay = {
  type: 'ground-overlay' | 'screen-overlay' | 'photo-overlay';
  name?: string;
  description?: string;
  href?: string;
  visibility?: boolean;
  bounds?: {north: number; south: number; east: number; west: number; rotation?: number};
  raw: unknown;
};

/** A KML NetworkLink retained without following external content. */
export type KMLNetworkLink = {
  name?: string;
  href?: string;
  refreshMode?: string;
  refreshInterval?: number;
  viewRefreshMode?: string;
  raw: unknown;
};

/** A KML COLLADA model reference retained by the document parser. */
export type KMLModel = {
  name?: string;
  href?: string;
  location?: [number, number, number?];
  orientation?: {heading?: number; tilt?: number; roll?: number};
  scale?: {x?: number; y?: number; z?: number};
  raw: unknown;
};

/** Rich parsed representation of one KML document. */
export type KMLDocument = {
  type: 'KMLDocument';
  name?: string;
  description?: string;
  features: Feature[];
  folders: KMLFolder[];
  overlays: KMLOverlay[];
  networkLinks: KMLNetworkLink[];
  models: KMLModel[];
  styles: Record<string, KMLStyle>;
  coordinateReferenceSystem: 'OGC:CRS84';
};

/** A KML folder and its child folder hierarchy. */
export type KMLFolder = {
  name?: string;
  description?: string;
  path: string[];
  features: Feature[];
  folders: KMLFolder[];
};

/** Options controlling conversion from the rich KML document to GeoJSON. */
export type KMLFeatureConversionOptions = {
  /** Preserve KML-only metadata such as altitude mode under `kml` properties. */
  includeKMLMetadata?: boolean;
};

/** Parses KML XML into the loaders.gl KML document model. */
export function parseKMLDocument(text: string): KMLDocument {
  const parsed = parseXMLSync(text, {
    removeNSPrefix: true,
    textNodeName: '#text',
    _fastXML: {parseTagValue: false, parseAttributeValue: false}
  }) as XMLObject;
  const root = asObject(parsed.kml);
  if (!root) throw new Error('Invalid KML document: root element must be <kml>');

  const styles: Record<string, KMLStyle> = {};
  for (const definition of findDescendants(root)) {
    if (definition.__type === 'Style') {
      const id = getAttribute(definition, 'id');
      if (id) styles[id] = parseStyle(definition, id);
    } else if (definition.__type === 'StyleMap') {
      parseStyleMap(definition, styles);
    }
  }

  const overlays: KMLOverlay[] = [];
  const networkLinks: KMLNetworkLink[] = [];
  const models: KMLModel[] = [];
  const folders: KMLFolder[] = [];
  const features: Feature[] = [];
  const rootContainer = getFirstObject(root, 'Document') || root;
  parseContainer(
    rootContainer,
    [],
    styles,
    overlays,
    networkLinks,
    models,
    folders,
    features,
    true
  );

  return {
    type: 'KMLDocument',
    name: getChildText(rootContainer, 'name'),
    description: getChildText(rootContainer, 'description'),
    features,
    folders,
    overlays,
    networkLinks,
    models,
    styles,
    coordinateReferenceSystem: 'OGC:CRS84'
  };
}

/** Converts a parsed KML document to the public GeoJSON feature collection shape. */
export function convertKMLDocumentToFeatureCollection(
  document: KMLDocument,
  options: KMLFeatureConversionOptions = {}
): FeatureCollection {
  const features = document.features.map(feature => {
    if (options.includeKMLMetadata || !feature.properties?.kml) return feature;
    const properties = {...feature.properties};
    delete properties.kml;
    return {...feature, properties};
  });
  return {type: 'FeatureCollection', features};
}

function parseContainer(
  node: XMLObject,
  parentPath: string[],
  styles: Record<string, KMLStyle>,
  overlays: KMLOverlay[],
  networkLinks: KMLNetworkLink[],
  models: KMLModel[],
  folders: KMLFolder[],
  features: Feature[],
  flattenFolderFeatures: boolean
): void {
  for (const placemark of getChildObjects(node, 'Placemark')) {
    features.push(parsePlacemark(placemark, parentPath, styles));
  }
  for (const folderNode of getChildObjects(node, 'Folder')) {
    const folder = parseFolder(folderNode, parentPath, styles, overlays, networkLinks, models);
    folders.push(folder);
    if (flattenFolderFeatures) features.push(...folderFeatures(folder));
  }
  for (const documentNode of getChildObjects(node, 'Document')) {
    parseContainer(
      documentNode,
      parentPath,
      styles,
      overlays,
      networkLinks,
      models,
      folders,
      features,
      flattenFolderFeatures
    );
  }
  for (const name of ['GroundOverlay', 'ScreenOverlay', 'PhotoOverlay']) {
    for (const overlay of getChildObjects(node, name)) overlays.push(parseOverlay(overlay));
  }
  for (const link of getChildObjects(node, 'NetworkLink'))
    networkLinks.push(parseNetworkLink(link));
  for (const model of getChildObjects(node, 'Model')) models.push(parseModel(model));
}

function parseFolder(
  node: XMLObject,
  parentPath: string[],
  styles: Record<string, KMLStyle>,
  overlays: KMLOverlay[],
  networkLinks: KMLNetworkLink[],
  models: KMLModel[]
): KMLFolder {
  const name = getChildText(node, 'name');
  const path = name ? [...parentPath, name] : parentPath;
  const features: Feature[] = [];
  const folders: KMLFolder[] = [];
  parseContainer(node, path, styles, overlays, networkLinks, models, folders, features, false);
  return {name, description: getChildText(node, 'description'), path, features, folders};
}

function folderFeatures(folder: KMLFolder): Feature[] {
  return [...folder.features, ...folder.folders.flatMap(folderFeatures)];
}

function parsePlacemark(
  node: XMLObject,
  folderPath: string[],
  styles: Record<string, KMLStyle>
): Feature {
  const geometryNode = getGeometryNode(node);
  const geometry = geometryNode ? parseGeometry(geometryNode) : null;
  const properties = parsePlacemarkProperties(node, folderPath, styles, geometryNode);
  return geometry
    ? {type: 'Feature', geometry, properties}
    : ({type: 'Feature', geometry: null, properties} as unknown as Feature);
}

function parsePlacemarkProperties(
  node: XMLObject,
  folderPath: string[],
  styles: Record<string, KMLStyle>,
  geometryNode: XMLObject | undefined
): GeoJsonProperties {
  const properties: Record<string, unknown> = {};
  for (const name of ['name', 'description', 'visibility', 'open', 'address', 'phoneNumber']) {
    const value = getChildText(node, name);
    if (value !== undefined) properties[name] = value;
  }

  const styleUrl = getChildText(node, 'styleUrl');
  if (styleUrl) {
    properties.styleUrl = styleUrl;
    const style = styles[styleUrl.replace(/^#/, '')];
    if (style) Object.assign(properties, styleToProperties(style));
  }
  Object.assign(properties, parseExtendedData(getFirstObject(node, 'ExtendedData')));

  const kmlMetadata: Record<string, unknown> = {};
  if (geometryNode) {
    const altitudeMode =
      getChildText(geometryNode, 'altitudeMode') || getChildText(geometryNode, 'gx:altitudeMode');
    const extrude = getChildText(geometryNode, 'extrude');
    const tessellate = getChildText(geometryNode, 'tessellate');
    if (altitudeMode !== undefined) kmlMetadata.altitudeMode = altitudeMode;
    if (extrude !== undefined) kmlMetadata.extrude = extrude === '1' || extrude === 'true';
    if (tessellate !== undefined)
      kmlMetadata.tessellate = tessellate === '1' || tessellate === 'true';
  }
  const timeStamp = getFirstObject(node, 'TimeStamp');
  const timeSpan = getFirstObject(node, 'TimeSpan');
  if (timeStamp) kmlMetadata.timeStamp = getChildText(timeStamp, 'when');
  if (timeSpan) {
    kmlMetadata.timeSpan = {
      begin: getChildText(timeSpan, 'begin'),
      end: getChildText(timeSpan, 'end')
    };
  }
  if (folderPath.length) kmlMetadata.folderPath = folderPath;
  if (Object.keys(kmlMetadata).length) properties.kml = kmlMetadata;
  return properties;
}

function getGeometryNode(node: XMLObject): XMLObject | undefined {
  for (const name of [
    'Point',
    'LineString',
    'LinearRing',
    'Polygon',
    'MultiGeometry',
    'Track',
    'MultiTrack'
  ]) {
    const geometry = getFirstObject(node, name);
    if (geometry) return withType(geometry, name);
  }
  return undefined;
}

function parseGeometry(node: XMLObject): Geometry | null {
  switch (node.__type) {
    case 'Point': {
      const coordinates = parseCoordinates(getChildText(node, 'coordinates'));
      return coordinates.length ? {type: 'Point', coordinates: coordinates[0]} : null;
    }
    case 'LineString':
    case 'LinearRing': {
      const coordinates = parseCoordinates(getChildText(node, 'coordinates'));
      return coordinates.length ? {type: 'LineString', coordinates} : null;
    }
    case 'Polygon':
      return parsePolygon(node);
    case 'MultiGeometry': {
      const geometries = getGeometryObjects(node)
        .map(parseGeometry)
        .filter((geometry): geometry is Geometry => Boolean(geometry));
      return geometries.length ? {type: 'GeometryCollection', geometries} : null;
    }
    case 'Track':
    case 'MultiTrack':
      return parseTrack(node);
    default:
      return null;
  }
}

function parsePolygon(node: XMLObject): Geometry | null {
  const outerBoundary = getFirstObject(node, 'outerBoundaryIs');
  const outerRing = outerBoundary && getFirstObject(outerBoundary, 'LinearRing');
  const outerCoordinates = outerRing && parseCoordinates(getChildText(outerRing, 'coordinates'));
  if (!outerCoordinates?.length) return null;

  const holes = getChildObjects(node, 'innerBoundaryIs')
    .map(boundary => getFirstObject(boundary, 'LinearRing'))
    .map(ring => ring && parseCoordinates(getChildText(ring, 'coordinates')))
    .filter((coordinates): coordinates is Position[] => Boolean(coordinates?.length));
  return {type: 'Polygon', coordinates: [outerCoordinates, ...holes]};
}

function parseTrack(node: XMLObject): Geometry | null {
  const coordinateNodes = findDescendants(node, 'coord');
  if (!coordinateNodes.length) coordinateNodes.push(...findDescendants(node, 'coordinates'));
  const coordinates = coordinateNodes.flatMap(coordinateNode => {
    const value = getNodeText(coordinateNode);
    if (coordinateNode.__type === 'coord') {
      const values = (value || '').split(/\s+/).map(Number);
      return values.length >= 2 && values.every(Number.isFinite) ? [values as Position] : [];
    }
    return parseCoordinates(value);
  });
  return coordinates.length ? {type: 'LineString', coordinates} : null;
}

function parseCoordinates(value?: string): Position[] {
  if (!value) return [];
  const coordinates: Position[] = [];
  for (const tuple of value.trim().split(/\s+/)) {
    const values = tuple.split(',').map(Number);
    if (values.length < 2 || values.length > 3 || values.some(value => !Number.isFinite(value)))
      continue;
    coordinates.push(values as Position);
  }
  return coordinates;
}

function parseExtendedData(node: XMLObject | undefined): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  if (!node) return properties;
  for (const data of getChildObjects(node, 'Data')) {
    const name = getAttribute(data, 'name');
    const value = getChildText(data, 'value');
    if (name && value !== undefined) properties[name] = value;
  }
  for (const data of findDescendants(node, 'SimpleData')) {
    const name = getAttribute(data, 'name');
    if (name) properties[name] = getNodeText(data);
  }
  return properties;
}

function parseStyle(node: XMLObject, id: string): KMLStyle {
  const lineStyle = getFirstObject(node, 'LineStyle');
  const polyStyle = getFirstObject(node, 'PolyStyle');
  const iconStyle = getFirstObject(node, 'IconStyle');
  const labelStyle = getFirstObject(node, 'LabelStyle');
  const icon = iconStyle && getFirstObject(iconStyle, 'Icon');
  return {
    id,
    line: lineStyle
      ? {...parseColorStyle(lineStyle), width: parseNumber(getChildText(lineStyle, 'width'))}
      : undefined,
    polygon: polyStyle
      ? {
          ...parseColorStyle(polyStyle),
          fill: parseBoolean(getChildText(polyStyle, 'fill')),
          outline: parseBoolean(getChildText(polyStyle, 'outline'))
        }
      : undefined,
    icon: iconStyle
      ? {
          href: icon && getChildText(icon, 'href'),
          scale: parseNumber(getChildText(iconStyle, 'scale'))
        }
      : undefined,
    label: labelStyle
      ? {...parseColorStyle(labelStyle), scale: parseNumber(getChildText(labelStyle, 'scale'))}
      : undefined
  };
}

function parseStyleMap(node: XMLObject, styles: Record<string, KMLStyle>): void {
  const id = getAttribute(node, 'id');
  if (!id) return;
  for (const pair of getChildObjects(node, 'Pair')) {
    const key = getChildText(pair, 'key');
    const styleUrl = getChildText(pair, 'styleUrl');
    const style = styleUrl && styles[styleUrl.replace(/^#/, '')];
    if (key && style) styles[id] = style;
  }
}

function parseColorStyle(node: XMLObject): {color?: string; opacity?: number} {
  const value = getChildText(node, 'color');
  if (!value || !/^[0-9a-f]{8}$/i.test(value)) return {};
  return {
    color: `#${value.slice(6, 8)}${value.slice(4, 6)}${value.slice(2, 4)}`,
    opacity: parseInt(value.slice(0, 2), 16) / 255
  };
}

function styleToProperties(style: KMLStyle): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  if (style.line?.color) properties.stroke = style.line.color;
  if (style.line?.opacity !== undefined) properties['stroke-opacity'] = style.line.opacity;
  if (style.line?.width !== undefined) properties['stroke-width'] = style.line.width;
  if (style.polygon?.color) properties.fill = style.polygon.color;
  if (style.polygon?.opacity !== undefined) properties['fill-opacity'] = style.polygon.opacity;
  if (style.icon?.href) properties.icon = style.icon.href;
  return properties;
}

function parseOverlay(node: XMLObject): KMLOverlay {
  const box = getFirstObject(node, 'LatLonBox');
  const type = node.__type;
  return {
    type:
      type === 'GroundOverlay'
        ? 'ground-overlay'
        : type === 'PhotoOverlay'
          ? 'photo-overlay'
          : 'screen-overlay',
    name: getChildText(node, 'name'),
    description: getChildText(node, 'description'),
    href: getChildText(getFirstObject(node, 'Icon'), 'href'),
    visibility: parseBoolean(getChildText(node, 'visibility')),
    bounds: box ? parseOverlayBounds(box) : undefined,
    raw: node
  };
}

function parseOverlayBounds(node: XMLObject): KMLOverlay['bounds'] | undefined {
  const north = parseNumber(getChildText(node, 'north'));
  const south = parseNumber(getChildText(node, 'south'));
  const east = parseNumber(getChildText(node, 'east'));
  const west = parseNumber(getChildText(node, 'west'));
  if ([north, south, east, west].some(value => value === undefined)) return undefined;
  return {
    north: north as number,
    south: south as number,
    east: east as number,
    west: west as number,
    rotation: parseNumber(getChildText(node, 'rotation'))
  };
}

function parseNetworkLink(node: XMLObject): KMLNetworkLink {
  const link = getFirstObject(node, 'Link') || getFirstObject(node, 'Url');
  return {
    name: getChildText(node, 'name'),
    href: getChildText(link, 'href'),
    refreshMode: getChildText(link, 'refreshMode'),
    refreshInterval: parseNumber(getChildText(link, 'refreshInterval')),
    viewRefreshMode: getChildText(link, 'viewRefreshMode'),
    raw: node
  };
}

function parseModel(node: XMLObject): KMLModel {
  const location = getFirstObject(node, 'Location');
  const orientation = getFirstObject(node, 'Orientation');
  const scale = getFirstObject(node, 'Scale');
  const locationValues = [
    parseNumber(getChildText(location, 'longitude')),
    parseNumber(getChildText(location, 'latitude')),
    parseNumber(getChildText(location, 'altitude'))
  ];
  return {
    name: getChildText(node, 'name'),
    href: getChildText(getFirstObject(node, 'Link'), 'href'),
    location: locationValues.every(value => value !== undefined)
      ? (locationValues as [number, number, number])
      : undefined,
    orientation: orientation
      ? {
          heading: parseNumber(getChildText(orientation, 'heading')),
          tilt: parseNumber(getChildText(orientation, 'tilt')),
          roll: parseNumber(getChildText(orientation, 'roll'))
        }
      : undefined,
    scale: scale
      ? {
          x: parseNumber(getChildText(scale, 'x')),
          y: parseNumber(getChildText(scale, 'y')),
          z: parseNumber(getChildText(scale, 'z'))
        }
      : undefined,
    raw: node
  };
}

function getGeometryObjects(node: XMLObject): XMLObject[] {
  return [
    'Point',
    'LineString',
    'LinearRing',
    'Polygon',
    'MultiGeometry',
    'Track',
    'MultiTrack'
  ].flatMap(name => getChildObjects(node, name).map(child => withType(child, name)));
}

function withType(node: XMLObject, type: string): XMLObject {
  return {...node, __type: type};
}

function findDescendants(node: XMLObject, name?: string): XMLObject[] {
  const result: XMLObject[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === '__type') continue;
    for (const child of asObjects(value)) {
      if (!name || key === name) result.push(withType(child, key));
      result.push(...findDescendants(child, name));
    }
  }
  return result;
}

function getFirstObject(node: XMLObject | undefined, name: string): XMLObject | undefined {
  return node ? asObjects(node[name])[0] : undefined;
}

function getChildObjects(node: XMLObject, name: string): XMLObject[] {
  return asObjects(node[name]);
}

function asObjects(value: XMLValue | undefined): XMLObject[] {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.filter(
    (item): item is XMLObject => typeof item === 'object' && !Array.isArray(item)
  );
}

function asObject(value: XMLValue | undefined): XMLObject | undefined {
  return typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

function getChildText(node: XMLObject | undefined, name: string): string | undefined {
  return node ? getNodeText(node[name]) : undefined;
}

function getNodeText(value: XMLValue | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return getNodeText(value[0]);
  return getNodeText(value['#text']);
}

function getAttribute(node: XMLObject | undefined, name: string): string | undefined {
  return node ? getNodeText(node[name]) : undefined;
}

function parseNumber(value?: string): number | undefined {
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function parseBoolean(value?: string): boolean | undefined {
  if (value === undefined) return undefined;
  return value === '1' || value.toLowerCase() === 'true';
}
