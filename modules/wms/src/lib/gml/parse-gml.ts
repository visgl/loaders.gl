// loaders.gl, MIT license

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

import {XMLLoader} from '@loaders.gl/xml';
import {deepStrictEqual} from './deep-strict-equal';
import rewind from '@turf/rewind';

function noTransform(...coords) {
  return coords;
}

export type ParseGMLOptions = {
  transformCoords?: Function;
  stride?: 2 | 3 | 4;
};

export type ParseGMLContext = {
  srsDimension?: number;
  [key: string]: any;
};

/**
 * Parses a typed data structure from raw XML for GML features
 * @note Error handlings is fairly weak
 */
export function parseGML(text: string, options) {
  // GeoJSON | null {
  const parsedXML = XMLLoader.parseTextSync(text, options);

  options = {transformCoords: noTransform, stride: 2, ...options};
  const context = createChildContext(parsedXML, options, {});

  return parseGMLToGeometry(parsedXML, options, context);
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

  switch (name) {
    // case 'gml:MultiPoint':
    //   geometry = {
    //     type: 'MultiPoint',
    //     coordinates: parseMultiPoint(xml, options, childContext)
    //   };
    //   break;

    case 'gml:LineString':
      geometry = {
        type: 'LineString',
        coordinates: parseLinearRingOrLineString(xml, options, childContext)
      };
      break;

      // case 'gml:MultiLineString':
      //   geometry = {
      //     type: 'MultiLineString',
      //     coordinates: parseMultiLineString(xml, options, childContext)
      //   };
      //   break;

    case 'gml:Polygon':
    case 'gml:Rectangle':
      geometry = {
        type: 'Polygon',
        coordinates: parsePolygonOrRectangle(xml, options, childContext)
      };
      break;
    case 'gml:Surface':
      geometry = {
        type: 'MultiPolygon',
        coordinates: parseSurface(xml, options, childContext)
      };
      break;
    case 'gml:MultiSurface':
      geometry = {
        type: 'MultiPolygon',
        coordinates: parseMultiSurface(xml, options, childContext)
      };
      break;

    default:
      return null;
  }

  // todo
  return rewind(geometry, {mutate: true});
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
  if (!pos) {
    throw new Error('invalid gml:Point element, expected a gml:pos subelement');
  }
  return parsePos(pos, options, childContext);
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
      switch (childName) {
        case 'gml:Point':
          points.push(parsePoint(childXML, options, childContext));
          break;
        case 'gml:pos':
          points.push(parsePos(childXML, options, childContext));
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
    switch (childName) {
      case 'gml:LineStringSegment':
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
    switch (childName) {
      case 'gml:curveMember':
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

  for (const [childName, childXML] of Object.entries(xml)) {
    switch (childName) {
      case 'gml:interior':
        pointLists.push(parseExteriorOrInterior(childXML, options, childContext));
        break;
    }
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
  for (const [childName, childXML] of Object.entries(xml)) {
    switch (childName) {
      case 'gml:PolygonPatch':
      case 'gml:Rectangle':
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
    switch (childName) {
      case 'gml:surfaceMember':
      case 'gml:surfaceMembers':
        const [c2Name, c2Xml] = getFirstKeyValue(childXML);
        switch (c2Name) {
          case 'gml:Surface':
            polygons.push(...parseSurface(c2Xml, options, childContext));
            break;
          case 'gml:Polygon':
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
  let el = xml;

  const surfaceMembers = findIn(xml, 'gml:LinearRing');
  if (surfaceMembers) {
    el = surfaceMembers;
  }

  const polygons: Position[][][] = [];
  for (const [childName, childXML] of Object.entries(el)) {
    switch (childName) {
      case 'gml:Surface':
        const polygons2 = parseSurface(childXML, options, context);
        polygons.push(...polygons2);
        break;
      case 'gml:surfaceMember':
        const polygons3 = parseSurfaceMember(childXML, options, context);
        polygons.push(...polygons3);
        break;

      case 'gml:surfaceMembers':
        const polygonXML = findIn(childXML, 'gml:Polygon');
        for (const surfaceMemberXML of polygonXML as []) {
          const polygons3 = parseSurfaceMember(surfaceMemberXML, options, context);
          polygons.push(...polygons3);
        }
        break;
    }
  }

  if (polygons.length === 0) {
    throw new Error(`${xml.name} must have > 0 polygons`);
  }

  return polygons;
}

function parseSurfaceMember(
  xml: any,
  options: ParseGMLOptions,
  context: ParseGMLContext
): Position[][][] {
  const [childName, childXml] = getFirstKeyValue(xml);
  switch (childName) {
    case 'gml:CompositeSurface':
      return parseCompositeSurface(childXml, options, context);
    case 'gml:Surface':
      return parseSurface(childXml, options, context);
    case 'gml:Polygon':
      return [parsePolygonOrRectangle(childXml, options, context)];
  }
  throw new Error(`${childName} must have polygons`);
}

// Helpers

function textOf(el: any): string {
  if (typeof el !== 'string') {
    throw new Error('expected string');
  }
  return el;
}

function findIn(root: any, ...tags: string[]): any {
  let el = root;
  for (const tag of tags) {
    const child = el[tag];
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

/** A bit heavyweight for just tracking dimension? */
function createChildContext(xml, options, context): ParseGMLContext {
  const srsDimensionAttribute = xml.attributes && xml.attributes.srsDimension;

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
