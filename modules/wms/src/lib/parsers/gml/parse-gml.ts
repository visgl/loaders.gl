// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from https://github.com/derhuerst/parse-gml-polygon/blob/master/index.js
// under ISC license

/* eslint-disable no-continue, default-case */

import type {
  // GeoJSON,
  // Feature,
  // FeatureCollection,
  Geometry,
  Position
  // GeoJsonProperties,
  // Point,
  // MultiPoint,
  // LineString,
  // MultiLineString,
  // Polygon,
  // MultiPolygon,
  // GeometryCollection
} from '@loaders.gl/schema';

import {deepStrictEqual} from './deep-strict-equal';
import {parseXMLTextSync} from '../xml/parse-xml-text';
import rewind from '@turf/rewind';

/** A GeoJSON feature decoded from a GML feature member. */
export type GMLFeature = {
  type: 'Feature';
  id?: string;
  geometry: Geometry | null;
  properties: Record<string, unknown>;
};

/** A collection of features decoded from a GML feature collection. */
export type GMLFeatureCollection = {
  type: 'FeatureCollection';
  features: GMLFeature[];
};

function noTransform(...coords) {
  return coords;
}

export type {Geometry};

export type ParseGMLOptions = {
  /** Coordinate transformation applied to every decoded position. */
  transformCoords?: (...coordinates: number[]) => Position;
  stride?: 2 | 3 | 4;
  /** Optional XML Schema types keyed by the local feature property name. */
  propertyTypes?: Record<string, GMLPropertyType>;
};

/** XML Schema scalar types understood by the GML property decoder. */
export type GMLPropertyType =
  | 'string'
  | 'boolean'
  | 'integer'
  | 'number'
  | 'date'
  | 'date-time';

export type ParseGMLContext = {
  srsDimension?: number;
  [key: string]: any;
};

/**
 * Parses a typed data structure from raw XML for GML features
 * @note Error handlings is fairly weak
 */
export function parseGML(text: string, options): Geometry | GMLFeatureCollection | null {
  // GeoJSON | null {
  const parsedXML = parseXMLTextSync(text, options);

  options = {transformCoords: noTransform, stride: 2, ...options};
  const featureCollection = parseGMLFeatureCollection(parsedXML, options);
  if (featureCollection) {
    return featureCollection;
  }
  const context = createChildContext(parsedXML, options, {});

  return parseGMLToGeometry(parsedXML, options, context);
}

/** Parses a GML feature collection, returning null when the document is a bare geometry. */
export function parseGMLFeatureCollection(
  inputXML: any,
  options: ParseGMLOptions = {}
): GMLFeatureCollection | null {
  const featureMembers = findFeatureMembers(inputXML);
  if (featureMembers.length === 0) {
    return null;
  }
  return {
    type: 'FeatureCollection',
    features: featureMembers.map(featureMember => parseGMLFeature(featureMember, options))
  };
}

/** Parses one GML feature member into a GeoJSON feature. */
export function parseGMLFeature(inputXML: any, options: ParseGMLOptions = {}): GMLFeature {
  const feature = unwrapFeatureMember(inputXML);
  const geometryElement = findGeometryElement(feature);
  const geometry = geometryElement
    ? parseGMLToGeometry(
        {[geometryElement.key]: geometryElement.value},
        options,
        createChildContext(feature, options, {})
      )
    : null;
  const properties: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(feature || {})) {
    if (
      key === 'attributes' ||
      key === geometryElement?.propertyKey ||
      key.startsWith('gml:')
    ) {
      continue;
    }
    const propertyName = stripNamespace(key);
    properties[propertyName] = extractXMLValue(value, options.propertyTypes?.[propertyName]);
  }

  const id = findFeatureId(feature);
  return {type: 'Feature', id: id ? String(id) : undefined, geometry, properties};
}

/** Parse a GeoJSON geometry from GML XML */
export function parseGMLToGeometry(
  inputXML: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Geometry | null {
  const childContext = createChildContext(inputXML, options, context);

  let geometry: Geometry | null = null;

  const [name, xml] = getFirstKeyValue(inputXML);

  switch (stripNamespace(name)) {
    case 'Point':
      geometry = {type: 'Point', coordinates: parsePoint(xml, options, childContext)};
      break;

    case 'MultiPoint':
      geometry = {type: 'MultiPoint', coordinates: parseMultiPoint(xml, options, childContext)};
      break;

    case 'LineString':
      geometry = {
        type: 'LineString',
        coordinates: parseLinearRingOrLineString(xml, options, childContext)
      };
      break;

    case 'Curve':
      geometry = {type: 'LineString', coordinates: parseCurve(xml, options, childContext)};
      break;

    case 'MultiLineString':
    case 'MultiCurve':
      geometry = {
        type: 'MultiLineString',
        coordinates: parseMultiLineString(xml, options, childContext)
      };
      break;

    case 'MultiPolygon':
      geometry = {
        type: 'MultiPolygon',
        coordinates: parseMultiPolygon(xml, options, childContext)
      };
      break;

    case 'Polygon':
    case 'Rectangle':
      geometry = {
        type: 'Polygon',
        coordinates: parsePolygonOrRectangle(xml, options, childContext)
      };
      break;
    case 'Surface':
      geometry = {
        type: 'MultiPolygon',
        coordinates: parseSurface(xml, options, childContext)
      };
      break;
    case 'MultiSurface':
      geometry = {
        type: 'MultiPolygon',
        coordinates: parseMultiSurface(xml, options, childContext)
      };
      break;

    default:
      return null;
  }

  // todo
  return rewind(geometry as any, {mutate: true}) as Geometry;
}

/** Parse a list of coordinates from a string */
function parseCoords(s: string, options: ParseGMLOptions, context: ParseGMLContext): Position[] {
  const stride = context.srsDimension || options.stride || 2;

  // Handle white space
  const coords = s.replace(/\s+/g, ' ').trim().split(' ');

  if (coords.length === 0 || coords.length % stride !== 0) {
    throw new Error(`invalid coordinates list (stride ${stride})`);
  }

  const points: Position[] = [];
  for (let i = 0; i < coords.length - 1; i += stride) {
    const point = coords.slice(i, i + stride).map(parseFloat);
    points.push(options.transformCoords?.(...point) || point);
  }

  return points;
}

export function parsePosList(xml: any, options: ParseGMLOptions, context: ParseGMLContext) {
  const childContext = createChildContext(xml, options, context);

  const coords = textOf(xml);
  if (!coords) {
    throw new Error('invalid gml:posList element');
  }

  return parseCoords(coords, options, childContext);
}

export function parsePos(xml: any, options: ParseGMLOptions, context: ParseGMLContext): Position {
  const childContext = createChildContext(xml, options, context);

  const coords = textOf(xml);
  if (!coords) {
    throw new Error('invalid gml:pos element');
  }

  const points = parseCoords(coords, options, childContext);
  if (points.length !== 1) {
    throw new Error('gml:pos must have 1 point');
  }
  return points[0];
}

export function parsePoint(xml: any, options: ParseGMLOptions, context: ParseGMLContext): number[] {
  const childContext = createChildContext(xml, options, context);

  // TODO AV: Parse other gml:Point options
  const pos = findIn(xml, 'gml:pos');
  if (pos) {
    return parsePos(pos, options, childContext);
  }

  const coord = findIn(xml, 'gml:coord');
  if (coord) {
    const x = textOf(findIn(coord, 'gml:X'));
    const y = textOf(findIn(coord, 'gml:Y'));
    const z = findIn(coord, 'gml:Z');
    const point = [x, y, ...(z ? [textOf(z)] : [])].map(Number);
    return options.transformCoords?.(...point) || point;
  }

  const coordinates = findIn(xml, 'gml:coordinates');
  if (coordinates) {
    const points = parseLegacyCoordinates(textOf(coordinates), options, childContext);
    if (points.length === 1) {
      return points[0];
    }
  }
  throw new Error('invalid gml:Point element, expected gml:pos, gml:coord, or gml:coordinates');
}

/** Parses a GML MultiPoint geometry. */
export function parseMultiPoint(xml: any, options: ParseGMLOptions, context: ParseGMLContext): number[][] {
  const points: number[][] = [];
  for (const member of getMembers(xml, ['gml:pointMember', 'gml:pointMembers'])) {
    const point = findIn(member, 'gml:Point');
    if (point) {
      points.push(parsePoint(point, options, context));
    }
  }
  if (points.length === 0) {
    throw new Error(`${xml.name} must have > 0 points`);
  }
  return points;
}

/** Parses a GML Curve geometry as a line string. */
export function parseCurve(xml: any, options: ParseGMLOptions, context: ParseGMLContext): Position[] {
  const segments = findIn(xml, 'gml:segments');
  if (!segments) {
    throw new Error('gml:Curve must contain gml:segments');
  }
  return parseCurveSegments(segments, options, context);
}

/** Parses GML line-string and curve members. */
export function parseMultiLineString(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[][] {
  const lines: Position[][] = [];
  for (const member of getMembers(xml, ['gml:lineStringMember', 'gml:lineStringMembers', 'gml:curveMember', 'gml:curveMembers'])) {
    const lineString = findIn(member, 'gml:LineString');
    const curve = findIn(member, 'gml:Curve');
    if (lineString) {
      lines.push(parseLinearRingOrLineString(lineString, options, context));
    } else if (curve) {
      lines.push(parseCurve(curve, options, context));
    }
  }
  if (lines.length === 0) {
    throw new Error(`${xml.name} must have > 0 line strings`);
  }
  return lines;
}

/** Parses GML polygon members. */
export function parseMultiPolygon(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[][][] {
  const polygons: Position[][][] = [];
  for (const member of getMembers(xml, ['gml:polygonMember', 'gml:polygonMembers'])) {
    const polygon = findIn(member, 'gml:Polygon');
    if (polygon) {
      polygons.push(parsePolygonOrRectangle(polygon, options, context));
    }
  }
  if (polygons.length === 0) {
    throw new Error(`${xml.name} must have > 0 polygons`);
  }
  return polygons;
}

export function parseLinearRingOrLineString(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[] {
  // or a LineStringSegment
  const childContext = createChildContext(xml, options, context);

  let points: Position[] = [];

  const posList = findIn(xml, 'gml:posList');
  if (posList) {
    points = parsePosList(posList, options, childContext);
  } else {
    for (const [childName, childXML] of Object.entries(xml)) {
      switch (stripNamespace(childName)) {
        case 'Point':
          points.push(parsePoint(childXML, options, childContext));
          break;
        case 'pos':
          points.push(parsePos(childXML, options, childContext));
          break;
        case 'coord':
          for (const coord of Array.isArray(childXML) ? childXML : [childXML]) {
            points.push(parseLegacyCoord(coord, options));
          }
          break;
        case 'coordinates':
          points.push(...parseLegacyCoordinates(textOf(childXML), options, childContext));
          break;
        default:
          continue;
      }
    }
  }

  if (points.length === 0) {
    throw new Error(`${xml.name} must have > 0 points`);
  }
  return points;
}

export function parseCurveSegments(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[] {
  const points: Position[] = [];

  for (const [childName, childXML] of Object.entries(xml)) {
    switch (stripNamespace(childName)) {
      case 'LineStringSegment':
        const points2 = parseLinearRingOrLineString(childXML, options, context);

        // remove overlapping
        const end = points[points.length - 1];
        const start = points2[0];
        if (end && start && deepStrictEqual(end, start)) {
          points2.shift();
        }

        points.push(...points2);
        break;
      default:
        continue;
    }
  }

  if (points.length === 0) {
    throw new Error('gml:Curve > gml:segments must have > 0 points');
  }
  return points;
}

export function parseRing(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[] {
  const childContext = createChildContext(xml, options, context);

  const points: Position[] = [];

  for (const [childName, childXML] of Object.entries(xml)) {
    switch (stripNamespace(childName)) {
      case 'curveMember':
        let points2;

        const lineString = findIn(childXML, 'gml:LineString');
        if (lineString) {
          points2 = parseLinearRingOrLineString(lineString, options, childContext);
        } else {
          const segments = findIn(childXML, 'gml:Curve', 'gml:segments');
          if (!segments) {
            throw new Error(`invalid ${childName} element`);
          }

          points2 = parseCurveSegments(segments, options, childContext);
        }

        // remove overlapping
        const end = points[points.length - 1];
        const start = points2[0];
        if (end && start && deepStrictEqual(end, start)) {
          points2.shift();
        }

        points.push(...points2);

        break;
    }
  }

  if (points.length < 4) {
    throw new Error(`${xml.name} must have >= 4 points`);
  }
  return points;
}

export function parseExteriorOrInterior(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[] {
  const linearRing = findIn(xml, 'gml:LinearRing');
  if (linearRing) {
    return parseLinearRingOrLineString(linearRing, options, context);
  }

  const ring = findIn(xml, 'gml:Ring');
  if (!ring) {
    throw new Error(`invalid ${xml.name} element`);
  }

  return parseRing(ring, options, context);
}

export function parsePolygonOrRectangle(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[][] {
  // or PolygonPatch
  const childContext = createChildContext(xml, options, context);

  const exterior = findIn(xml, 'gml:exterior');
  if (!exterior) {
    throw new Error(`invalid ${xml.name} element`);
  }

  const pointLists: Position[][] = [parseExteriorOrInterior(exterior, options, childContext)];

  const interiors = xml['gml:interior'];
  for (const interior of Array.isArray(interiors) ? interiors : interiors ? [interiors] : []) {
    pointLists.push(parseExteriorOrInterior(interior, options, childContext));
  }

  return pointLists;
}

export function parseSurface(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[][][] {
  const childContext = createChildContext(xml, options, context);

  const patches = findIn(xml, 'gml:patches');
  if (!patches) {
    throw new Error(`invalid ${xml.name} element`);
  }

  const polygons: Position[][][] = [];
  for (const [childName, childXML] of Object.entries(patches)) {
    switch (stripNamespace(childName)) {
      case 'PolygonPatch':
      case 'Rectangle':
        polygons.push(parsePolygonOrRectangle(childXML, options, childContext));
        break;

      default:
        continue;
    }
  }

  if (polygons.length === 0) {
    throw new Error(`${xml.name} must have > 0 polygons`);
  }

  return polygons;
}

export function parseCompositeSurface(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[][][] {
  const childContext = createChildContext(xml, options, context);

  const polygons: Position[][][] = [];
  for (const [childName, childXML] of Object.entries(xml)) {
    switch (stripNamespace(childName)) {
      case 'surfaceMember':
      case 'surfaceMembers':
        const [c2Name, c2Xml] = getFirstKeyValue(childXML);
        switch (stripNamespace(c2Name)) {
          case 'Surface':
            polygons.push(...parseSurface(c2Xml, options, childContext));
            break;
          case 'Polygon':
            polygons.push(parsePolygonOrRectangle(c2Xml, options, childContext));
            break;
        }
        break;
    }
  }

  if (polygons.length === 0) {
    throw new Error(`${xml.name} must have > 0 polygons`);
  }
  return polygons;
}

export function parseMultiSurface(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[][][] {
  const polygons: Position[][][] = [];
  for (const member of getMembers(xml, ['gml:surfaceMember', 'gml:surfaceMembers'])) {
    const polygon = findIn(member, 'gml:Polygon');
    const surface = findIn(member, 'gml:Surface');
    const compositeSurface = findIn(member, 'gml:CompositeSurface');
    if (polygon) {
      polygons.push(parsePolygonOrRectangle(polygon, options, context));
    } else if (surface) {
      polygons.push(...parseSurface(surface, options, context));
    } else if (compositeSurface) {
      polygons.push(...parseCompositeSurface(compositeSurface, options, context));
    }
  }

  if (polygons.length === 0) {
    throw new Error(`${xml.name} must have > 0 polygons`);
  }

  return polygons;
}

// Helpers

/** Finds feature members in either a GML feature collection or a parsed member fragment. */
function findFeatureMembers(root: any): any[] {
  if (!root || typeof root !== 'object') return [];
  for (const [key, value] of Object.entries(root)) {
    if (stripNamespace(key) === 'featureMember') {
      return Array.isArray(value) ? value : [value];
    }
    if (stripNamespace(key) === 'featureMembers') {
      const members: any[] = [];
      for (const member of Array.isArray(value) ? value : [value]) {
        for (const [featureKey, featureValue] of Object.entries(member || {})) {
          if (featureKey !== 'attributes') {
            for (const item of Array.isArray(featureValue) ? featureValue : [featureValue]) {
              members.push({[featureKey]: item});
            }
          }
        }
      }
      return members;
    }
    if (key !== 'attributes' && value && typeof value === 'object') {
      const nested = findFeatureMembers(Array.isArray(value) ? value[0] : value);
      if (nested.length) return nested;
    }
  }
  return [];
}

/** Removes the wrapper around a parsed GML feature member. */
function unwrapFeatureMember(member: any): any {
  if (!member || typeof member !== 'object') return {};
  const entries = Object.entries(member).filter(([key]) => key !== 'attributes');
  return entries.length === 1 && !stripNamespace(entries[0][0]).startsWith('gml:')
    ? entries[0][1]
    : member;
}

/** Locates the first GML geometry child of a feature. */
function findGeometryElement(
  feature: any,
  propertyKey?: string
): {key: string; value: any; propertyKey: string} | null {
  if (!feature || typeof feature !== 'object') return null;
  for (const [key, value] of Object.entries(feature)) {
    if (GEOMETRY_NAMES.has(stripNamespace(key))) {
      return {
        key,
        value: Array.isArray(value) ? value[0] : value,
        propertyKey: propertyKey || key
      };
    }
    if (key !== 'attributes' && value && typeof value === 'object') {
      const nested = findGeometryElement(Array.isArray(value) ? value[0] : value, propertyKey || key);
      if (nested) return nested;
    }
  }
  return null;
}

const GEOMETRY_NAMES = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'Curve',
  'MultiLineString',
  'MultiCurve',
  'Polygon',
  'Rectangle',
  'Surface',
  'MultiPolygon',
  'MultiSurface'
]);

function stripNamespace(key: string): string {
  return key.includes(':') ? key.slice(key.indexOf(':') + 1) : key;
}

function extractXMLValue(value: any, propertyType?: GMLPropertyType): unknown {
  if (Array.isArray(value)) return value.map(item => extractXMLValue(item, propertyType));
  if (value && typeof value === 'object') {
    if ('value' in value) return extractXMLValue(value.value, propertyType);
    if ('#text' in value) return extractXMLValue(value['#text'], propertyType);
  }
  if (propertyType === 'boolean') return value === true || value === 'true' || value === '1';
  if (propertyType === 'integer') return Number.parseInt(String(value), 10);
  if (propertyType === 'number') return Number(value);
  if (propertyType === 'date' || propertyType === 'date-time') return String(value);
  return value;
}

function findFeatureId(value: any): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const directId =
    value.id ||
    value['gml:id'] ||
    value.fid ||
    Object.entries(value).find(([key]) => stripNamespace(key) === 'id')?.[1];
  if (directId !== undefined && typeof directId !== 'object') return String(directId);
  const attributes = value.attributes;
  if (attributes) {
    const id =
      attributes.id ||
      attributes['gml:id'] ||
      attributes.fid ||
      Object.entries(attributes).find(([key]) => stripNamespace(key) === 'id')?.[1];
    if (id !== undefined) return String(id);
  }
  return undefined;
}

function textOf(el: any): string {
  if (typeof el === 'number') {
    return String(el);
  }
  if (el && typeof el === 'object' && 'value' in el) {
    return textOf(el.value);
  }
  if (typeof el !== 'string') {
    throw new Error('expected string');
  }
  return el;
}

function findIn(root: any, ...tags: string[]): any {
  let el = root;
  for (const tag of tags) {
    const child = Object.entries(el || {}).find(
      ([key]) => key === tag || stripNamespace(key) === stripNamespace(tag)
    )?.[1];
    if (!child) {
      return null;
    }
    el = child;
  }
  return el;
}

/** @returns the first [key, value] pair in an object, or ['', null] if empty object */
function getFirstKeyValue(object: any): [string, any] {
  if (object && typeof object === 'object') {
    for (const [key, value] of Object.entries(object)) {
      return [key, value];
    }
  }
  return ['', null];
}

/** Normalizes singular and plural XML member containers into an iterable list. */
function getMembers(root: any, names: string[]): any[] {
  const members: any[] = [];
  for (const name of names) {
    const value = Object.entries(root || {}).find(
      ([key]) => key === name || stripNamespace(key) === stripNamespace(name)
    )?.[1];
    if (!value) {
      continue;
    }
    if (name.endsWith('Members')) {
      if (Array.isArray(value)) {
        members.push(...value);
        continue;
      }
      for (const [memberName, memberValue] of Object.entries(value)) {
        if (memberName !== 'attributes') {
          for (const item of Array.isArray(memberValue) ? memberValue : [memberValue]) {
            members.push({[memberName]: item});
          }
        }
      }
    } else if (Array.isArray(value)) {
      members.push(...value);
    } else if (value) {
      members.push(value);
    }
  }
  return members;
}

/** Parses one GML 2 `coord` element. */
function parseLegacyCoord(xml: any, options: ParseGMLOptions): Position {
  const x = Number(textOf(findIn(xml, 'gml:X')));
  const y = Number(textOf(findIn(xml, 'gml:Y')));
  const z = findIn(xml, 'gml:Z');
  const point = [x, y, ...(z ? [Number(textOf(z))] : [])];
  return options.transformCoords?.(...point) || point;
}

/** Parses a GML 2 `coordinates` element using comma-separated ordinates. */
function parseLegacyCoordinates(
  text: string,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[] {
  const coordinatePairs = text.trim().split(/\s+/).filter(Boolean);
  return coordinatePairs.map(coordinatePair => {
    const point = coordinatePair.split(',').map(Number);
    const stride = context.srsDimension || options.stride || 2;
    if (point.length !== stride || point.some(Number.isNaN)) {
      throw new Error(`invalid GML 2 coordinates list (stride ${stride})`);
    }
    return options.transformCoords?.(...point) || point;
  });
}

/** A bit heavyweight for just tracking dimension? */
function createChildContext(xml, options, context): ParseGMLContext {
  const attributes = xml?.attributes || xml || {};
  const srsDimensionAttribute =
    attributes.srsDimension ||
    attributes['@_srsDimension'] ||
    Object.entries(attributes).find(([key]) => stripNamespace(key).toLowerCase() === 'srsdimension')?.[1];

  if (srsDimensionAttribute) {
    const srsDimension = parseInt(srsDimensionAttribute);
    if (Number.isNaN(srsDimension) || srsDimension <= 0) {
      throw new Error(
        `invalid srsDimension attribute value "${srsDimensionAttribute}", expected a positive integer`
      );
    }

    const childContext = Object.create(context);
    childContext.srsDimension = srsDimension;
    return childContext;
  }

  return context;
}
