// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import type {
  Feature,
  FlatFeature,
  FlatIndexedGeometry,
  GeojsonGeometryInfo
} from '@loaders.gl/schema';
import Protobuf from 'pbf';
import {
  classifyRings,
  classifyRingsFlat,
  projectToLngLat,
  projectToLngLatFlat,
  convertToLocalCoordinates,
  convertToLocalCoordinatesFlat
} from '../utils/geometry-utils';

export class VectorTileFeature {
  properties: {[x: string]: string | number | boolean | null};
  extent: any;
  type: number;
  id: number | null;
  _pbf: Protobuf;
  _geometry: number;
  _keys: string[];
  _values: (string | number | boolean | null)[];
  _geometryInfo: GeojsonGeometryInfo;

  static types: Readonly<string[]> = ['Unknown', 'Point', 'LineString', 'Polygon'];

  // eslint-disable-next-line max-params
  constructor(
    pbf: Protobuf,
    end: number,
    extent: any,
    keys: string[],
    values: (string | number | boolean | null)[],
    geometryInfo?: GeojsonGeometryInfo
  ) {
    // Public
    this.properties = {};
    this.extent = extent;
    this.type = 0;
    this.id = null;

    // Private
    this._pbf = pbf;
    this._geometry = -1;
    this._keys = keys;
    this._values = values;

    // Only used by binary tiles
    this._geometryInfo = geometryInfo!;

    pbf.readFields(readFeature, this, end);
  }

  toGeoJSONFeature(
    coordinates: 'wgs84' | 'local',
    tileIndex?: {x: number; y: number; z: number}
  ): Feature {
    const coords = this.loadGeometry();

    switch (coordinates) {
      case 'wgs84':
        return _toGeoJSONFeature(this, coords, (line: number[][]) =>
          projectToLngLat(line, tileIndex!, this.extent)
        );

      default:
        return _toGeoJSONFeature(this, coords, convertToLocalCoordinates);
    }
  }
  /**
   *
   * @param options
   * @returns
   */
  toBinaryFeature(
    coordinates: 'wgs84' | 'local',
    tileIndex?: {x: number; y: number; z: number}
  ): FlatFeature {
    const geom = this.loadFlatGeometry();

    switch (coordinates) {
      case 'wgs84':
        return this._toBinaryCoordinates(geom, (coords: number[]) =>
          projectToLngLatFlat(coords, tileIndex!, this.extent)
        );

      default:
        return this._toBinaryCoordinates(geom, convertToLocalCoordinatesFlat);
    }
  }

  /** Read a bounding box from the feature */
  // eslint-disable-next-line max-statements
  bbox() {
    const pbf = this._pbf;
    pbf.pos = this._geometry;

    const end = pbf.readVarint() + pbf.pos;
    let cmd = 1;
    let length = 0;
    let x = 0;
    let y = 0;
    let x1 = Infinity;
    let x2 = -Infinity;
    let y1 = Infinity;
    let y2 = -Infinity;

    while (pbf.pos < end) {
      if (length <= 0) {
        const cmdLen = pbf.readVarint();
        cmd = cmdLen & 0x7;
        length = cmdLen >> 3;
      }

      length--;

      if (cmd === 1 || cmd === 2) {
        x += pbf.readSVarint();
        y += pbf.readSVarint();
        if (x < x1) x1 = x;
        if (x > x2) x2 = x;
        if (y < y1) y1 = y;
        if (y > y2) y2 = y;
      } else if (cmd !== 7) {
        throw new Error(`unknown command ${cmd}`);
      }
    }

    return [x1, y1, x2, y2];
  }

  // BINARY HELPERS

  /**
   *
   * @param transform
   * @returns result
   */
  _toBinaryCoordinates(
    geom: FlatIndexedGeometry,
    transform: (data: number[], extent: number) => void
  ) {
    let geometry;

    // Apply the supplied transformation to data
    transform(geom.data, this.extent);

    const coordLength = 2;

    // eslint-disable-next-line default-case
    switch (this.type) {
      case 1: // Point
        this._geometryInfo.pointFeaturesCount++;
        this._geometryInfo.pointPositionsCount += geom.indices.length;
        geometry = {type: 'Point', ...geom};
        break;

      case 2: // LineString
        this._geometryInfo.lineFeaturesCount++;
        this._geometryInfo.linePathsCount += geom.indices.length;
        this._geometryInfo.linePositionsCount += geom.data.length / coordLength;
        geometry = {type: 'LineString', ...geom};
        break;

      case 3: // Polygon
        geometry = classifyRingsFlat(geom);

        // Unlike Point & LineString geom.indices is a 2D array, thanks
        // to the classifyRings method
        this._geometryInfo.polygonFeaturesCount++;
        this._geometryInfo.polygonObjectsCount += geometry.indices.length;

        for (const indices of geometry.indices) {
          this._geometryInfo.polygonRingsCount += indices.length;
        }
        this._geometryInfo.polygonPositionsCount += geometry.data.length / coordLength;

        break;
      default:
        throw new Error(`Invalid geometry type: ${this.type}`);
    }

    const result: FlatFeature = {type: 'Feature', geometry, properties: this.properties};

    if (this.id !== null) {
      result.id = this.id;
    }

    return result;
  }

  // GEOJSON HELPER

  // eslint-disable-next-line complexity, max-statements
  loadGeometry(): number[][][] {
    const pbf = this._pbf;
    pbf.pos = this._geometry;

    const end = pbf.readVarint() + pbf.pos;
    let cmd = 1;
    let length = 0;
    let x = 0;
    let y = 0;
    const lines: number[][][] = [];
    let line: number[][] | undefined;

    while (pbf.pos < end) {
      if (length <= 0) {
        const cmdLen = pbf.readVarint();
        cmd = cmdLen & 0x7;
        length = cmdLen >> 3;
      }

      length--;

      switch (cmd) {
        case 1:
        case 2:
          x += pbf.readSVarint();
          y += pbf.readSVarint();

          if (cmd === 1) {
            // moveTo
            if (line) lines.push(line);
            line = [];
          }
          if (line) line.push([x, y]);
          break;
        case 7:
          // Workaround for https://github.com/mapbox/mapnik-vector-tile/issues/90
          if (line) {
            line.push(line[0].slice()); // closePolygon
          }
          break;
        default:
          throw new Error(`unknown command ${cmd}`);
      }
    }

    if (line) lines.push(line);

    return lines;
  }

  /**
   * Expands the protobuf data to an intermediate Flat GeoJSON
   * data format, which maps closely to the binary data buffers.
   * It is similar to GeoJSON, but rather than storing the coordinates
   * in multidimensional arrays, we have a 1D `data` with all the
   * coordinates, and then index into this using the `indices`
   * parameter, e.g.
   *
   * geometry: {
   *   type: 'Point', data: [1,2], indices: [0]
   * }
   * geometry: {
   *   type: 'LineString', data: [1,2,3,4,...], indices: [0]
   * }
   * geometry: {
   *   type: 'Polygon', data: [1,2,3,4,...], indices: [[0, 2]]
   * }
   * Thus the indices member lets us look up the relevant range
   * from the data array.
   * The Multi* versions of the above types share the same data
   * structure, just with multiple elements in the indices array
   */
  // eslint-disable-next-line complexity, max-statements
  loadFlatGeometry(): FlatIndexedGeometry {
    const pbf = this._pbf;
    pbf.pos = this._geometry;

    const endPos = pbf.readVarint() + pbf.pos;
    let cmd = 1;
    let cmdLen: number;
    let length = 0;
    let x = 0;
    let y = 0;
    let i = 0;

    // Note: I attempted to replace the `data` array with a
    // Float32Array, but performance was worse, both using
    // `set()` and direct index access. Also, we cannot
    // know how large the buffer should be, so it would
    // increase memory usage
    const indices: number[] = []; // Indices where geometries start
    const data: number[] = []; // Flat array of coordinate data

    while (pbf.pos < endPos) {
      if (length <= 0) {
        cmdLen = pbf.readVarint();
        cmd = cmdLen & 0x7;
        length = cmdLen >> 3;
      }

      length--;

      if (cmd === 1 || cmd === 2) {
        x += pbf.readSVarint();
        y += pbf.readSVarint();

        if (cmd === 1) {
          // New line
          indices.push(i);
        }
        data.push(x, y);
        i += 2;
      } else if (cmd === 7) {
        // Workaround for https://github.com/mapbox/mapnik-vector-tile/issues/90
        if (i > 0) {
          const start = indices[indices.length - 1]; // start index of polygon
          data.push(data[start], data[start + 1]); // closePolygon
          i += 2;
        }
      } else {
        throw new Error(`unknown command ${cmd}`);
      }
    }

    return {data, indices};
  }
}

function _toGeoJSONFeature(
  vtFeature: VectorTileFeature,
  coords: number[][][],
  transform: (data: number[][], extent: number) => void
): Feature {
  let type = VectorTileFeature.types[vtFeature.type];
  let i: number;
  let j: number;

  let coordinates: number[][] | number[][][] | number[][][][];
  switch (vtFeature.type) {
    case 1:
      const points: number[][] = [];
      for (i = 0; i < coords.length; i++) {
        points[i] = coords[i][0];
      }
      coordinates = points;
      transform(coordinates, vtFeature.extent);
      break;

    case 2:
      coordinates = coords;
      for (i = 0; i < coordinates.length; i++) {
        transform(coordinates[i], vtFeature.extent);
      }
      break;

    case 3:
      coordinates = classifyRings(coords);
      for (i = 0; i < coordinates.length; i++) {
        for (j = 0; j < coordinates[i].length; j++) {
          transform(coordinates[i][j], vtFeature.extent);
        }
      }
      break;

    default:
      throw new Error('illegal vector tile type');
  }

  if (coordinates.length === 1) {
    // @ts-expect-error
    coordinates = coordinates[0];
  } else {
    type = `Multi${type}`;
  }

  const result: Feature = {
    type: 'Feature',
    geometry: {
      type: type as any,
      coordinates: coordinates as any
    },
    properties: vtFeature.properties
  };

  if (vtFeature.id !== null) {
    result.properties ||= {};
    result.properties.id = vtFeature.id;
  }

  return result;
}

// PBF READER UTILS

/**
 *
 * @param tag
 * @param feature
 * @param pbf
 */
function readFeature(tag: number, feature?: VectorTileFeature, pbf?: Protobuf): void {
  if (feature && pbf) {
    if (tag === 1) feature.id = pbf.readVarint();
    else if (tag === 2) readTag(pbf, feature);
    else if (tag === 3) feature.type = pbf.readVarint();
    else if (tag === 4) feature._geometry = pbf.pos;
  }
}

/**
 *
 * @param pbf
 * @param feature
 */
function readTag(pbf: Protobuf, feature: VectorTileFeature): void {
  const end = pbf.readVarint() + pbf.pos;

  while (pbf.pos < end) {
    const key = feature._keys[pbf.readVarint()];
    const value = feature._values[pbf.readVarint()];
    feature.properties[key] = value;
  }
}
