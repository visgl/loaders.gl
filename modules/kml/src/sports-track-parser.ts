// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Feature, FeatureCollection, Position} from '@loaders.gl/schema';
import {parseXMLSync} from '@loaders.gl/xml';

interface XMLValueArray extends Array<XMLValue> {}
interface XMLObject {
  [key: string]: XMLValue;
}
type XMLValue = string | number | boolean | XMLObject | XMLValueArray;

type ParsedPoint = {
  coordinates: Position;
  time?: string;
  heartRate?: number;
  extendedValues: Array<[string, string | number]>;
};

type ParsedLine = {
  line: Position[];
  times: string[];
  heartRates: number[];
  extendedProperties: Record<string, Array<string | number | null>>;
};

/** Parses GPX XML text into a GeoJSON feature collection. */
export function parseGPXTextToFeatureCollection(text: string): FeatureCollection {
  const root = parseSportsXML(text, 'gpx');
  const features: Feature[] = [];

  for (const track of getDescendants(root, 'trk')) {
    const feature = parseGPXTrack(track);
    if (feature) features.push(feature);
  }
  for (const route of getDescendants(root, 'rte')) {
    const feature = parseGPXRoute(route);
    if (feature) features.push(feature);
  }
  for (const waypoint of getDescendants(root, 'wpt')) {
    features.push(parseGPXWaypoint(waypoint));
  }

  return {type: 'FeatureCollection', features};
}

/** Parses TCX XML text into a GeoJSON feature collection. */
export function parseTCXTextToFeatureCollection(text: string): FeatureCollection {
  const root = parseSportsXML(text, 'TrainingCenterDatabase');
  const features: Feature[] = [];

  for (const lap of getDescendants(root, 'Lap')) {
    const feature = parseTCXLap(lap);
    if (feature) features.push(feature);
  }
  for (const courses of getDescendants(root, 'Courses')) {
    const feature = parseTCXTrackContainer(courses);
    if (feature) features.push(feature);
  }

  return {type: 'FeatureCollection', features};
}

function parseSportsXML(text: string, rootName: string): XMLObject {
  const parsed = parseXMLSync(text, {
    removeNSPrefix: true,
    textNodeName: '#text',
    _fastXML: {parseTagValue: false, parseAttributeValue: false}
  }) as XMLObject;
  const root = asObject(parsed[rootName]);
  if (!root) throw new Error(`Invalid ${rootName} document`);
  return root;
}

function parseGPXTrack(node: XMLObject): Feature | undefined {
  const lines: ParsedLine[] = [];
  for (const segment of getDescendants(node, 'trkseg')) {
    const line = parseGPXPoints(segment, 'trkpt');
    if (line) lines.push(line);
  }
  if (!lines.length) return undefined;

  const multi = lines.length > 1;
  const coordinateProperties: Record<string, unknown> = {};
  const times = lines.filter(line => line.times.length).map(line => line.times);
  if (times.length) coordinateProperties.times = multi ? times : times[0];

  const properties: Record<string, unknown> = {
    ...parseGPXProperties(node),
    ...parseGPXLineStyle(node),
    _gpxType: 'trk'
  };
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    for (const [name, values] of Object.entries(lines[lineIndex].extendedProperties)) {
      if (multi) {
        if (!coordinateProperties[name]) {
          coordinateProperties[name] = lines.map(line => new Array(line.line.length).fill(null));
        }
        (coordinateProperties[name] as Array<Array<string | number | null>>)[lineIndex] = values;
      } else {
        coordinateProperties[name] = values;
      }
    }
  }
  if (Object.keys(coordinateProperties).length)
    properties.coordinateProperties = coordinateProperties;

  const coordinates = lines.map(line => line.line);
  return {
    type: 'Feature',
    properties,
    geometry: multi
      ? {type: 'MultiLineString', coordinates}
      : {type: 'LineString', coordinates: coordinates[0]}
  } as Feature;
}

function parseGPXRoute(node: XMLObject): Feature | undefined {
  const line = parseGPXPoints(node, 'rtept');
  if (!line) return undefined;
  return {
    type: 'Feature',
    properties: {...parseGPXProperties(node), ...parseGPXLineStyle(node), _gpxType: 'rte'},
    geometry: {type: 'LineString', coordinates: line.line}
  } as Feature;
}

function parseGPXWaypoint(node: XMLObject): Feature {
  const point = parseGPXPoint(node);
  return {
    type: 'Feature',
    properties: {...parseGPXProperties(node), ...getSingleProperty(node, 'sym')},
    geometry: {type: 'Point', coordinates: point.coordinates}
  } as Feature;
}

function parseGPXPoints(node: XMLObject, pointName: string): ParsedLine | undefined {
  const points = getDescendants(node, pointName);
  if (points.length < 2) return undefined;

  const line: Position[] = [];
  const times: string[] = [];
  const extendedProperties: Record<string, Array<string | number | null>> = {};
  for (let index = 0; index < points.length; index++) {
    const point = parseGPXPoint(points[index]);
    line.push(point.coordinates);
    if (point.time) times.push(point.time);
    for (const [name, value] of point.extendedValues) {
      const propertyName = name === 'heart' ? name : `${name.replace(/^gpxtpx:/, '')}s`;
      extendedProperties[propertyName] ||= new Array(points.length).fill(null);
      extendedProperties[propertyName][index] = value;
    }
  }
  return {line, times, heartRates: [], extendedProperties};
}

function parseGPXPoint(node: XMLObject): ParsedPoint {
  const longitude = parseNumber(getAttribute(node, 'lon')) ?? Number.NaN;
  const latitude = parseNumber(getAttribute(node, 'lat')) ?? Number.NaN;
  const coordinates: Position = [longitude, latitude];
  const elevation = parseNumber(getText(node, 'ele'));
  if (elevation !== undefined) coordinates.push(elevation);
  const time = getText(node, 'time');
  return {coordinates, time, extendedValues: parseGPXExtensions(node)};
}

function parseGPXProperties(node: XMLObject): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const name of ['name', 'cmt', 'desc', 'type', 'time', 'keywords']) {
    const value = getText(node, name);
    if (value !== undefined) properties[name] = value;
  }
  for (const [name, value] of getDirectExtensionProperties(node)) properties[name] = value;
  const links = getDescendants(node, 'link');
  if (links.length) {
    properties.links = links.map(link => ({
      href: getAttribute(link, 'href'),
      ...getSingleProperty(link, 'text'),
      ...getSingleProperty(link, 'type')
    }));
  }
  return properties;
}

function parseGPXLineStyle(node: XMLObject): Record<string, unknown> {
  const line = getFirstObject(getFirstObject(node, 'extensions'), 'line');
  if (!line) return {};
  const style: Record<string, unknown> = {};
  const color = getText(line, 'color');
  const opacity = parseNumber(getText(line, 'opacity'));
  const width = parseNumber(getText(line, 'width'));
  if (color) style.stroke = color;
  if (opacity !== undefined) style['stroke-opacity'] = opacity;
  if (width !== undefined) style['stroke-width'] = (width * 96) / 25.4;
  return style;
}

function parseGPXExtensions(node: XMLObject): Array<[string, string | number]> {
  const extensions = getFirstObject(node, 'extensions');
  return extensions ? parseExtensionEntries(extensions) : [];
}

function parseExtensionEntries(node: XMLObject): Array<[string, string | number]> {
  const values: Array<[string, string | number]> = [];
  for (const [name, value] of Object.entries(node)) {
    if (name === '#text') continue;
    const objects = asObjects(value);
    if (name === 'TrackPointExtension' || name === 'gpxtpx:TrackPointExtension') {
      for (const object of objects) values.push(...parseExtensionEntries(object));
    } else if (objects.length) {
      for (const object of objects) {
        const text = getNodeText(object);
        if (text !== undefined) values.push([name, parseStringValue(text)]);
      }
    } else {
      const text = getNodeText(value);
      if (text !== undefined) values.push([name, parseStringValue(text)]);
    }
  }
  return values;
}

function getDirectExtensionProperties(node: XMLObject): Array<[string, string]> {
  const extensions = getFirstObject(node, 'extensions');
  if (!extensions) return [];
  return Object.entries(extensions)
    .filter(([name]) => name !== '#text' && name !== 'TrackPointExtension')
    .flatMap(([name, value]) => {
      const text = getNodeText(value);
      return text === undefined ? [] : [[name.replace(':', '_'), text]];
    });
}

function parseTCXLap(node: XMLObject): Feature | undefined {
  return parseTCXTrackContainer(node, parseTCXLapProperties(node));
}

function parseTCXTrackContainer(
  node: XMLObject,
  properties: Record<string, unknown> = {}
): Feature | undefined {
  const tracks = getDescendants(node, 'Track');
  const lines: ParsedLine[] = [];
  const allExtendedProperties: Array<Record<string, Array<string | number | null>>> = [];
  const times: string[][] = [];
  const heartRates: number[][] = [];

  for (const track of tracks) {
    const line = parseTCXPoints(track);
    if (!line) continue;
    lines.push(line);
    allExtendedProperties.push(line.extendedProperties);
    if (line.times.length) times.push(line.times);
    if (line.heartRates.length) heartRates.push(line.heartRates);
  }
  if (!lines.length) return undefined;

  const multi = lines.length > 1;
  for (let index = 0; index < allExtendedProperties.length; index++) {
    for (const [name, values] of Object.entries(allExtendedProperties[index])) {
      if (!multi) {
        properties[name] = values;
      } else {
        if (!properties[name]) {
          properties[name] = lines.map(line => new Array(line.line.length).fill(null));
        }
        (properties[name] as Array<Array<string | number | null>>)[index] = values;
      }
    }
  }
  if (times.length || heartRates.length) {
    properties.coordinateProperties = {
      ...(times.length ? {times: multi ? times : times[0]} : {}),
      ...(heartRates.length ? {heart: multi ? heartRates : heartRates[0]} : {})
    };
  }

  const coordinates = lines.map(line => line.line);
  return {
    type: 'Feature',
    properties,
    geometry: {
      type: multi ? 'MultiLineString' : 'LineString',
      coordinates: multi ? coordinates : coordinates[0]
    }
  } as Feature;
}

function parseTCXPoints(node: XMLObject): ParsedLine | undefined {
  const points = getDescendants(node, 'Trackpoint');
  if (points.length < 2) return undefined;
  const line: Position[] = [];
  const times: string[] = [];
  const heartRates: number[] = [];
  const extendedProperties: Record<string, Array<string | number | null>> = {};

  for (let index = 0; index < points.length; index++) {
    const point = parseTCXPoint(points[index]);
    if (!point) continue;
    line.push(point.coordinates);
    if (point.time) times.push(point.time);
    if (point.heartRate !== undefined) heartRates.push(point.heartRate);
    for (const [name, value] of point.extendedValues) {
      extendedProperties[name] ||= new Array(points.length).fill(null);
      extendedProperties[name][index] = value;
    }
  }
  return {line, times, heartRates, extendedProperties};
}

function parseTCXPoint(node: XMLObject): ParsedPoint | undefined {
  const longitude = parseNumber(getText(node, 'LongitudeDegrees'));
  const latitude = parseNumber(getText(node, 'LatitudeDegrees'));
  if (longitude === undefined || latitude === undefined) return undefined;
  const coordinates: Position = [longitude, latitude];
  const elevation = parseNumber(getText(node, 'AltitudeMeters'));
  if (elevation !== undefined) coordinates.push(elevation);
  const heartRate = parseNumber(getText(node, 'HeartRateBpm'));
  const extendedValues = parseTCXExtensions(node);
  return {coordinates, time: getText(node, 'Time'), heartRate, extendedValues};
}

function parseTCXExtensions(node: XMLObject): Array<[string, string | number]> {
  const values: Array<[string, string | number]> = [];
  for (const [tag, name] of [
    ['heartRate', 'heartRates'],
    ['Cadence', 'cadences'],
    ['Speed', 'speeds'],
    ['Watts', 'watts']
  ]) {
    const value = parseNumber(getText(node, tag));
    if (value !== undefined) values.push([name, value]);
  }
  return values;
}

function parseTCXLapProperties(node: XMLObject): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const [tag, name] of [
    ['TotalTimeSeconds', 'totalTimeSeconds'],
    ['DistanceMeters', 'distanceMeters'],
    ['MaximumSpeed', 'maxSpeed'],
    ['AverageHeartRateBpm', 'avgHeartRate'],
    ['MaximumHeartRateBpm', 'maxHeartRate'],
    ['AvgSpeed', 'avgSpeed'],
    ['AvgWatts', 'avgWatts'],
    ['MaxWatts', 'maxWatts']
  ]) {
    const value = parseNumber(getText(node, tag));
    if (value !== undefined) properties[name] = value;
  }
  const name = getText(node, 'Name');
  if (name) properties.name = name;
  return properties;
}

function getSingleProperty(node: XMLObject, name: string): Record<string, string> {
  const value = getText(node, name);
  return value === undefined ? {} : {[name]: value};
}

function getDescendants(node: XMLObject, name: string): XMLObject[] {
  const result: XMLObject[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === '#text') continue;
    for (const child of asObjects(value)) {
      if (key === name) result.push(child);
      result.push(...getDescendants(child, name));
    }
  }
  return result;
}

function getFirstObject(node: XMLObject | undefined, name: string): XMLObject | undefined {
  return node ? asObjects(node[name])[0] : undefined;
}

function asObjects(value: XMLValue | undefined): XMLObject[] {
  if (value === undefined || value === null) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.filter(
    (item): item is XMLObject => typeof item === 'object' && !Array.isArray(item)
  );
}

function asObject(value: XMLValue | undefined): XMLObject | undefined {
  return typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

function getText(node: XMLObject | undefined, name: string): string | undefined {
  if (!node) return undefined;
  const directValue = getNodeText(node[name]);
  if (directValue !== undefined) return directValue;
  for (const [key, value] of Object.entries(node)) {
    if (key === '#text') continue;
    if (key === name) return getNodeText(value);
    for (const child of asObjects(value)) {
      const descendantValue = getText(child, name);
      if (descendantValue !== undefined) return descendantValue;
    }
  }
  return undefined;
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

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function parseStringValue(value: string): string | number {
  const number = parseNumber(value);
  return number === undefined ? value : number;
}
