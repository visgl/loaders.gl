// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// This code is inspired by https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import type {
  // Feature,
  // FlatFeature,
  // FlatGeometry,
  FlatIndexedGeometry
  // GeojsonGeometryInfo
} from '@loaders.gl/schema';

import Protobuf from 'pbf';

import * as MVT from './mvt-constants';

// import {
//   classifyRings,
//   classifyRingsFlat,
//   projectToLngLat,
//   projectToLngLatFlat,
//   convertToLocalCoordinates,
//   convertToLocalCoordinatesFlat
// } from '../utils/geometry-utils';

type GeometryCommand = {type: 'moveto' | 'lineto' | 'closepath'; x: number; y: number};

export function* makeMVTGeometryCommandIterator(pbf: Protobuf): IterableIterator<GeometryCommand> {
  const endPos = pbf.readVarint() + pbf.pos;
  let cmd = 1;
  let cmdLen: number;
  let length = 0;

  // Note: We reuse and return the same command object to avoid creating new objects
  const command: GeometryCommand = {type: 'closepath', x: 0, y: 0};

  while (pbf.pos < endPos) {
    if (length <= 0) {
      cmdLen = pbf.readVarint();
      cmd = cmdLen & 0x7;
      length = cmdLen >> 3;
    }

    length--;

    switch (cmd as MVT.Command) {
      case MVT.Command.MoveTo:
        command.type = 'moveto';
        command.x += pbf.readSVarint();
        command.y += pbf.readSVarint();
        yield command;
        break;

      case MVT.Command.LineTo:
        command.type = 'lineto';
        command.x += pbf.readSVarint();
        command.y += pbf.readSVarint();
        yield command;
        break;

      case MVT.Command.ClosePath:
        command.type = 'moveto';
        yield command;
        break;

      default:
        throw new Error(`unknown command ${cmd}`);
    }
  }
}

/**
 * Creates a bounding box from the feature geometry at the current position
 * @todo - Reparses the entire PBF geometry - replace with a generic bounding box calculation on parsed data?
 */
export function readBoundingBoxFromPBF(pbf: Protobuf): [number, number, number, number] {
  let x1 = Infinity;
  let x2 = -Infinity;
  let y1 = Infinity;
  let y2 = -Infinity;

  for (const command of makeMVTGeometryCommandIterator(pbf)) {
    switch (command.type) {
      case 'moveto':
      case 'lineto':
        if (command.x < x1) x1 = command.x;
        if (command.x > x2) x2 = command.x;
        if (command.y < y1) y1 = command.y;
        if (command.y > y2) y2 = command.y;
        break;

      case 'closepath':
      default:
      // ignore
    }
  }

  return [x1, y1, x2, y2];
}

/**
 * Extract intermediate Flat GeoJSON
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
export function loadFlatGeometryFromPBF(pbf: Protobuf): FlatIndexedGeometry {
  // Note: I attempted to replace the `data` array with a
  // Float32Array, but performance was worse, both using
  // `set()` and direct index access. Also, we cannot
  // know how large the buffer should be, so it would
  // increase memory usage
  const indices: number[] = []; // Indices where geometries start
  const data: number[] = []; // Flat array of coordinate data
  let i = 0;

  for (const command of makeMVTGeometryCommandIterator(pbf)) {
    switch (command.type) {
      case 'moveto':
        // New line
        indices.push(i);
        data.push(command.x, command.y);
        i += 2;
        break;

      case 'lineto':
        data.push(command.x, command.y);
        i += 2;
        break;

      case 'closepath':
        // Workaround for https://github.com/mapbox/mapnik-vector-tile/issues/90
        if (i > 0) {
          const start = indices[indices.length - 1]; // start index of polygon
          data.push(data[start], data[start + 1]); // closePolygon
          i += 2;
        }
        break;

      default:
      // just for eslint
    }
  }

  return {data, indices};
}

/**
 * Load a GeoJSON style Geometry from the raw PBF
 *
function readGeoJSONGeometryFromPBF(pbf): number[][][] {
  const lines: number[][][] = [];
  let line: number[][] | undefined;

  for (const command of makeMVTGeometryCommandIterator(pbf)) {
    switch (command.type) {
      case 'moveto':
        // moveTo
        if (line) lines.push(line);
        line = [];
        if (line) line.push([command.x, command.y]);
        break;

      case 'lineto':
        if (line) line.push([command.x, command.y]);
        break;

      case 'closepath':
        // Workaround for https://github.com/mapbox/mapnik-vector-tile/issues/90
        if (line) {
          line.push(line[0].slice()); // closePolygon
        }
        break;

      default:
      // just for eslint
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}
*/

// export class VectorTileFeature implements MVTFeature {
//   properties: Record<string, string | number | boolean | null>;
//   extent: any;
//   type: number;
//   id: number | null;
//   _pbf: Protobuf;
//   _geometryPos: number;
//   _keys: string[];
//   _values: (string | number | boolean | null)[];
//   _geometryInfo: GeojsonGeometryInfo;

//   static types = MVT_GEOMETRY_TYPES;

//   // eslint-disable-next-line max-params
//   constructor(
//     pbf: Protobuf,
//     end: number,
//     extent: any,
//     keys: string[],
//     values: (string | number | boolean | null)[],
//     geometryInfo?: GeojsonGeometryInfo
//   ) {
//     // Public
//     this.properties = {};
//     this.extent = extent;
//     this.type = 0;
//     this.id = null;

//     // Private
//     this._pbf = pbf;
//     this._geometryPos = -1;
//     this._keys = keys;
//     this._values = values;

//     // Only used by binary tiles
//     this._geometryInfo = geometryInfo!;

//     pbf.readFields(readFeatureFromPBF, this, end);
//   }

//   toGeoJSONFeature(
//     coordinates: 'wgs84' | 'local',
//     tileIndex?: {x: number; y: number; z: number}
//   ): Feature {
//     return readGeoJSONFeatureFromPBF(this, coordinates, this.extent, tileIndex);
//   }

//   /**
//    *
//    * @param options
//    * @returns
//    */
//   toBinaryFeature(
//     coordinates: 'wgs84' | 'local',
//     tileIndex?: {x: number; y: number; z: number}
//   ): FlatFeature {
//     return readFlatFeatureFromPBF(this, coordinates, this.extent, tileIndex);
//   }

//   /** Read a bounding box from the feature */
//   bbox() {
//     this._pbf.pos = this._geometryPos;
//     return readBoundingBoxFromPBF(this._pbf);
//   }

//   // Geometry helpers

//   /** Parses protobuf data to nested "GeoJSON like" coordinates array */
//   loadGeometry(): number[][][] {
//     this._pbf.pos = this._geometryPos;
//     return readGeoJSONGeometryFromPBF(this._pbf);
//   }

//   /** Parses protobuf data to an intermediate "Flat GeoJSON" data format */
//   loadFlatGeometry(): FlatIndexedGeometry {
//     this._pbf.pos = this._geometryPos;
//     return loadFlatGeometryFromPBF(this._pbf);
//   }
// }
