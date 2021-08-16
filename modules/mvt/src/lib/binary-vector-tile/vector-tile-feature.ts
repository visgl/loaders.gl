// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.

import Protobuf from 'pbf';
import {MvtBinaryCoordinates, MvtBinaryGeometry, MvtFirstPassedData} from '../types';
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
  _firstPassData: MvtFirstPassedData;
  static get types() {
    return ['Unknown', 'Point', 'LineString', 'Polygon'];
  }

  // eslint-disable-next-line max-params
  constructor(
    pbf: Protobuf,
    end: number,
    extent: any,
    keys: string[],
    values: (string | number | boolean | null)[],
    firstPassData: MvtFirstPassedData
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
    this._firstPassData = firstPassData;

    pbf.readFields(readFeature, this, end);
  }

  // eslint-disable-next-line complexity, max-statements
  loadGeometry(): MvtBinaryGeometry {
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
    const lines: number[] = []; // Indices where lines start
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
          lines.push(i);
        }
        data.push(x, y);
        i += 2;
      } else if (cmd === 7) {
        // Workaround for https://github.com/mapbox/mapnik-vector-tile/issues/90
        if (i > 0) {
          const start = lines[lines.length - 1]; // start index of polygon
          data.push(data[start], data[start + 1]); // closePolygon
          i += 2;
        }
      } else {
        throw new Error(`unknown command ${cmd}`);
      }
    }

    return {data, lines};
  }

  /**
   *
   * @param transform
   * @returns result
   */
  _toBinaryCoordinates(transform) {
    // Expands the protobuf data to an intermediate `lines`
    // data format, which maps closely to the binary data buffers.
    // It is similar to GeoJSON, but rather than storing the coordinates
    // in multidimensional arrays, we have a 1D `data` with all the
    // coordinates, and then index into this using the `lines`
    // parameter, e.g.
    //
    // geometry: {
    //   type: 'Point', data: [1,2], lines: [0]
    // }
    // geometry: {
    //   type: 'LineString', data: [1,2,3,4,...], lines: [0]
    // }
    // geometry: {
    //   type: 'Polygon', data: [1,2,3,4,...], lines: [[0, 2]]
    // }
    // Thus the lines member lets us look up the relevant range
    // from the data array.
    // The Multi* versions of the above types share the same data
    // structure, just with multiple elements in the lines array
    let geom = this.loadGeometry();

    // Apply the supplied transformation to data
    transform(geom.data, this);

    const coordLength = 2;

    // eslint-disable-next-line default-case
    switch (this.type) {
      case 1: // Point
        this._firstPassData.pointFeaturesCount++;
        this._firstPassData.pointPositionsCount += geom.lines.length;
        break;

      case 2: // LineString
        this._firstPassData.lineFeaturesCount++;
        this._firstPassData.linePathsCount += geom.lines.length;
        this._firstPassData.linePositionsCount += geom.data.length / coordLength;
        break;

      case 3: // Polygon
        const classified = classifyRings(geom);

        // Unlike Point & LineString geom.lines is a 2D array, thanks
        // to the classifyRings method
        this._firstPassData.polygonFeaturesCount++;
        this._firstPassData.polygonObjectsCount += classified.lines.length;

        for (const lines of classified.lines) {
          this._firstPassData.polygonRingsCount += lines.length;
        }
        this._firstPassData.polygonPositionsCount += classified.data.length / coordLength;

        geom = classified;
        break;
    }

    geom.type = VectorTileFeature.types[this.type];
    if (geom.lines.length > 1) {
      geom.type = `Multi${geom.type}`;
    }

    const result: MvtBinaryCoordinates = {
      type: 'Feature',
      geometry: geom,
      properties: this.properties
    };

    if (this.id !== null) {
      result.id = this.id;
    }

    return result;
  }

  toBinaryCoordinates(
    options: {x: number; y: number; z: number} | ((data: number[], feature: {extent: any}) => void)
  ): MvtBinaryCoordinates {
    if (typeof options === 'function') {
      return this._toBinaryCoordinates(options);
    }
    return this._toBinaryCoordinates(project);
  }
}
