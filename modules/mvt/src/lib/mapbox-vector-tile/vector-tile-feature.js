// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.
/* eslint-disable */
import Point from '@mapbox/point-geometry';

export default class VectorTileFeature {
  static get types() {
    return ['Unknown', 'Point', 'LineString', 'Polygon'];
  }

  constructor(pbf, end, extent, keys, values) {
    // Public
    this.properties = {};
    this.extent = extent;
    this.type = 0;

    // Private
    this._pbf = pbf;
    this._geometry = -1;
    this._keys = keys;
    this._values = values;

    pbf.readFields(readFeature, this, end);
  }

  // eslint-disable-next-line complexity, max-statements
  loadGeometry() {
    const pbf = this._pbf;
    pbf.pos = this._geometry;

    const end = pbf.readVarint() + pbf.pos;
    let cmd = 1;
    let length = 0;
    let x = 0;
    let y = 0;
    const lines = [];
    let line;

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
        // @ts-ignore
        line.push(new Point(x, y));
      } else if (cmd === 7) {
        // Workaround for https://github.com/mapbox/mapnik-vector-tile/issues/90
        if (line) {
          line.push(line[0].clone()); // closePolygon
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

  toGeoJSON(x, y, z) {
    const size = this.extent * Math.pow(2, z);
    const x0 = this.extent * x;
    const y0 = this.extent * y;
    let coords = this.loadGeometry();
    let type = VectorTileFeature.types[this.type];
    let i;
    let j;

    function project(line) {
      for (let j = 0; j < line.length; j++) {
        const p = line[j];
        const y2 = 180 - ((p.y + y0) * 360) / size;
        line[j] = [
          ((p.x + x0) * 360) / size - 180,
          (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90
        ];
      }
    }

    switch (this.type) {
      case 1:
        var points = [];
        for (i = 0; i < coords.length; i++) {
          points[i] = coords[i][0];
        }
        coords = points;
        project(coords);
        break;

      case 2:
        for (i = 0; i < coords.length; i++) {
          project(coords[i]);
        }
        break;

      case 3:
        coords = classifyRings(coords);
        for (i = 0; i < coords.length; i++) {
          for (j = 0; j < coords[i].length; j++) {
            project(coords[i][j]);
          }
        }
        break;
    }

    if (coords.length === 1) {
      coords = coords[0];
    } else {
      type = `Multi${type}`;
    }

    const result = {
      type: 'Feature',
      geometry: {
        type,
        coordinates: coords
      },
      properties: this.properties
    };

    if ('id' in this) {
      // @ts-igore
      // result.id = this.id;
    }

    return result;
  }
}

/**
 * Classifies an array of rings into polygons with outer rings and holes
 */

function classifyRings(rings) {
  const len = rings.length;

  if (len <= 1) return [rings];

  const polygons = [];
  let polygon;
  let ccw;

  for (let i = 0; i < len; i++) {
    const area = signedArea(rings[i]);
    if (area === 0) continue;

    if (ccw === undefined) ccw = area < 0;

    if (ccw === area < 0) {
      if (polygon) polygons.push(polygon);
      polygon = [rings[i]];
    } else {
      // @ts-ignore
      polygon.push(rings[i]);
    }
  }
  if (polygon) polygons.push(polygon);

  return polygons;
}

function signedArea(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1, p1, p2; i < ring.length; j = i++) {
    p1 = ring[i];
    p2 = ring[j];
    sum += (p2.x - p1.x) * (p1.y + p2.y);
  }
  return sum;
}

function readFeature(tag, feature, pbf) {
  if (tag === 1) feature.id = pbf.readVarint();
  else if (tag === 2) readTag(pbf, feature);
  else if (tag === 3) feature.type = pbf.readVarint();
  else if (tag === 4) feature._geometry = pbf.pos;
}

function readTag(pbf, feature) {
  const end = pbf.readVarint() + pbf.pos;

  while (pbf.pos < end) {
    const key = feature._keys[pbf.readVarint()];
    const value = feature._values[pbf.readVarint()];
    feature.properties[key] = value;
  }
}
