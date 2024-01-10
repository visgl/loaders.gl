import { GeometryType } from '../flat-geobuf/geometry-type.js';
import { Geometry } from '../flat-geobuf/geometry.js';

import {
  Geometry as GeoJsonGeometry,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection,
} from 'geojson';

import {
  IParsedGeometry,
  flat,
  pairFlatCoordinates,
  toGeometryType,
} from '../generic/geometry.js';

export interface IGeoJsonGeometry {
    type: string;
    coordinates: number[] | number[][] | number[][][] | number[][][][];
    geometries?: IGeoJsonGeometry[];
}

export function parseGeometry(
  geometry:
        | Point
        | MultiPoint
        | LineString
        | MultiLineString
        | Polygon
        | MultiPolygon,
): IParsedGeometry {
  const cs = geometry.coordinates;
  const xy: number[] = [];
  const z: number[] = [];
  let ends: number[] | undefined;
  let parts: IParsedGeometry[] | undefined;
  const type: GeometryType = toGeometryType(geometry.type);
  let end = 0;
  switch (geometry.type) {
    case 'Point':
      flat(cs, xy, z);
      break;
    case 'MultiPoint':
    case 'LineString':
      flat(cs as number[][], xy, z);
      break;
    case 'MultiLineString':
    case 'Polygon': {
      const css = cs as number[][][];
      flat(css, xy, z);
      if (css.length > 1) ends = css.map((c) => (end += c.length));
      break;
    }
    case 'MultiPolygon': {
      const csss = cs as number[][][][];
      const geometries = csss.map((coordinates) => ({
        type: 'Polygon',
        coordinates,
      })) as Polygon[];
      parts = geometries.map(parseGeometry);
      break;
    }
  }
  return {
    xy,
    z: z.length > 0 ? z : undefined,
    ends,
    type,
    parts,
  } as IParsedGeometry;
}

export function parseGC(geometry: GeometryCollection): IParsedGeometry {
  const type: GeometryType = toGeometryType(geometry.type);
  const parts: IParsedGeometry[] = [];
  for (let i = 0; i < geometry.geometries.length; i++) {
    const g = geometry.geometries[i];
    if (g.type === 'GeometryCollection') parts.push(parseGC(g));
    else parts.push(parseGeometry(g));
  }
  return {
    type,
    parts,
  } as IParsedGeometry;
}

function extractParts(xy: Float64Array, z: Float64Array, ends: Uint32Array) {
  if (!ends || ends.length === 0) return [pairFlatCoordinates(xy, z)];
  let s = 0;
  const xySlices = Array.from(ends).map((e) => xy.slice(s, (s = e << 1)));
  let zSlices: Float64Array[];
  if (z) {
    s = 0;
    zSlices = Array.from(ends).map((e) => z.slice(s, (s = e)));
  }
  return xySlices.map((xy, i) =>
    pairFlatCoordinates(xy, zSlices ? zSlices[i] : undefined),
  );
}

function toGeoJsonCoordinates(geometry: Geometry, type: GeometryType) {
  const xy = geometry.xyArray() as Float64Array;
  const z = geometry.zArray() as Float64Array;
  switch (type) {
    case GeometryType.Point: {
      const a = Array.from(xy);
      if (z) a.push(z[0]);
      return a;
    }
    case GeometryType.MultiPoint:
    case GeometryType.LineString:
      return pairFlatCoordinates(xy, z);
    case GeometryType.MultiLineString:
      return extractParts(xy, z, geometry.endsArray() as Uint32Array);
    case GeometryType.Polygon:
      return extractParts(xy, z, geometry.endsArray() as Uint32Array);
  }
}

export function fromGeometry(
  geometry: Geometry,
  headerType: GeometryType,
): GeoJsonGeometry {
  let type = headerType;
  if (type === GeometryType.Unknown) {
    type = geometry.type();
  }
  if (type === GeometryType.GeometryCollection) {
    const geometries: GeoJsonGeometry[] = [];
    for (let i = 0; i < geometry.partsLength(); i++) {
      const part = geometry.parts(i) as Geometry;
      const partType = part.type() as GeometryType;
      geometries.push(fromGeometry(part, partType));
    }
    return {
      type: GeometryType[type],
      geometries,
    } as GeoJsonGeometry;
  } else if (type === GeometryType.MultiPolygon) {
    const geometries: GeoJsonGeometry[] = [];
    for (let i = 0; i < geometry.partsLength(); i++)
      geometries.push(
        fromGeometry(
                    geometry.parts(i) as Geometry,
                    GeometryType.Polygon,
        ),
      );
    return {
      type: GeometryType[type],
      coordinates: geometries.map((g) => (g as Polygon).coordinates),
    } as GeoJsonGeometry;
  }
  const coordinates = toGeoJsonCoordinates(geometry, type);
  return {
    type: GeometryType[type],
    coordinates,
  } as GeoJsonGeometry;
}
