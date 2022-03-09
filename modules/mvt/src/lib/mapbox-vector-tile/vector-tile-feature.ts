// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.
import Protobuf from 'pbf';
import {MVTMapboxCoordinates, MVTMapboxGeometry} from '../types';
import {readFeature, classifyRings} from '../../helpers/mapbox-util-functions';

export default class VectorTileFeature {
  properties: {[x: string]: string | number | boolean | null};
  extent: any;
  type: number;
  id: number | null;
  _pbf: Protobuf;
  _geometry: number;
  _keys: string[];
  _values: (string | number | boolean | null)[];
  static get types() {
    return ['Unknown', 'Point', 'LineString', 'Polygon'];
  }

  constructor(
    pbf: Protobuf,
    end: number,
    extent: any,
    keys: string[],
    values: (string | number | boolean | null)[]
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

    pbf.readFields(readFeature, this, end);
  }

  // eslint-disable-next-line complexity, max-statements
  loadGeometry(): MVTMapboxGeometry {
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

      if (cmd === 1 || cmd === 2) {
        x += pbf.readSVarint();
        y += pbf.readSVarint();

        if (cmd === 1) {
          // moveTo
          if (line) lines.push(line);
          line = [];
        }
        if (line) line.push([x, y]);
      } else if (cmd === 7) {
        // Workaround for https://github.com/mapbox/mapnik-vector-tile/issues/90
        if (line) {
          line.push(line[0].slice()); // closePolygon
        }
      } else {
        throw new Error(`unknown command ${cmd}`);
      }
    }

    if (line) lines.push(line);

    return lines;
  }

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

  _toGeoJSON(transform) {
    let coords = this.loadGeometry();
    let type = VectorTileFeature.types[this.type];
    let i: number;
    let j: number;

    // eslint-disable-next-line default-case
    switch (this.type) {
      case 1:
        const points: number[] = [];
        for (i = 0; i < coords.length; i++) {
          points[i] = coords[i][0];
        }
        coords = points;
        transform(coords, this);
        break;

      case 2:
        for (i = 0; i < coords.length; i++) {
          transform(coords[i], this);
        }
        break;

      case 3:
        coords = classifyRings(coords);
        for (i = 0; i < coords.length; i++) {
          for (j = 0; j < coords[i].length; j++) {
            transform(coords[i][j], this);
          }
        }
        break;
    }

    if (coords.length === 1) {
      coords = coords[0];
    } else {
      type = `Multi${type}`;
    }

    const result: MVTMapboxCoordinates = {
      type: 'Feature',
      geometry: {
        type,
        coordinates: coords
      },
      properties: this.properties
    };

    if (this.id !== null) {
      result.id = this.id;
    }

    return result;
  }

  toGeoJSON(
    options: {x: number; y: number; z: number} | ((data: number[], feature: {extent: any}) => void)
  ): MVTMapboxCoordinates {
    if (typeof options === 'function') {
      return this._toGeoJSON(options);
    }
    const {x, y, z} = options;
    const size = this.extent * Math.pow(2, z);
    const x0 = this.extent * x;
    const y0 = this.extent * y;

    function project(line: number[]) {
      for (let j = 0; j < line.length; j++) {
        const p = line[j];
        p[0] = ((p[0] + x0) * 360) / size - 180;
        const y2 = 180 - ((p[1] + y0) * 360) / size;
        p[1] = (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
      }
    }
    return this._toGeoJSON(project);
  }
}
