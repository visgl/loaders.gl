// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import Protobuf from 'pbf';
import {FlatFeature, FlatIndexedGeometry, GeojsonGeometryInfo} from '@loaders.gl/schema';
import {classifyRings, project, readFeature} from '../../helpers/binary-util-functions';

// Reduce GC by reusing variables
let endPos: number;
let cmd: number;
let cmdLen: number;
let length: number;
let x: number;
let y: number;
let i: number;

export const TEST_EXPORTS = {
  classifyRings
};

export default class VectorTileFeature {
  properties: {[x: string]: string | number | boolean | null};
  extent: any;
  type: number;
  id: number | null;
  _pbf: Protobuf;
  _geometry: number;
  _keys: string[];
  _values: (string | number | boolean | null)[];
  _geometryInfo: GeojsonGeometryInfo;

  // eslint-disable-next-line max-params
  constructor(
    pbf: Protobuf,
    end: number,
    extent: any,
    keys: string[],
    values: (string | number | boolean | null)[],
    geometryInfo: GeojsonGeometryInfo
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
    this._geometryInfo = geometryInfo;

    pbf.readFields(readFeature, this, end);
  }

  // eslint-disable-next-line complexity, max-statements
  loadGeometry(): FlatIndexedGeometry {
    const pbf = this._pbf;
    pbf.pos = this._geometry;

    endPos = pbf.readVarint() + pbf.pos;
    cmd = 1;
    length = 0;
    x = 0;
    y = 0;
    i = 0;

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

  /**
   *
   * @param transform
   * @returns result
   */
  _toBinaryCoordinates(transform) {
    // Expands the protobuf data to an intermediate Flat GeoJSON
    // data format, which maps closely to the binary data buffers.
    // It is similar to GeoJSON, but rather than storing the coordinates
    // in multidimensional arrays, we have a 1D `data` with all the
    // coordinates, and then index into this using the `indices`
    // parameter, e.g.
    //
    // geometry: {
    //   type: 'Point', data: [1,2], indices: [0]
    // }
    // geometry: {
    //   type: 'LineString', data: [1,2,3,4,...], indices: [0]
    // }
    // geometry: {
    //   type: 'Polygon', data: [1,2,3,4,...], indices: [[0, 2]]
    // }
    // Thus the indices member lets us look up the relevant range
    // from the data array.
    // The Multi* versions of the above types share the same data
    // structure, just with multiple elements in the indices array
    const geom = this.loadGeometry();
    let geometry;

    // Apply the supplied transformation to data
    transform(geom.data, this);

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
        geometry = classifyRings(geom);

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

  toBinaryCoordinates(
    options: {x: number; y: number; z: number} | ((data: number[], feature: {extent: any}) => void)
  ): FlatFeature {
    if (typeof options === 'function') {
      return this._toBinaryCoordinates(options);
    }
    const {x, y, z} = options;
    const size = this.extent * Math.pow(2, z);
    const x0 = this.extent * x;
    const y0 = this.extent * y;

    return this._toBinaryCoordinates((data: number[]) => project(data, x0, y0, size));
  }
}
