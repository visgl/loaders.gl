// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.
/* eslint-disable */

// Reduce GC by reusing variables
let endPos, cmd, cmdLen, length, x, y, i;

export const TEST_EXPORTS = {
  classifyRings
};

export default class VectorTileFeature {
  static get types() {
    return ['Unknown', 'Point', 'LineString', 'Polygon'];
  }

  constructor(pbf, end, extent, keys, values, firstPassData) {
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
  loadGeometry() {
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
    const lines = []; // Indices where lines start
    const data = []; // Flat array of coordinate data

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
        const rings = classifyRings(geom);
        this._firstPassData.polygonFeaturesCount++;
        this._firstPassData.polygonObjectsCount += rings.length;

        for (const lines of rings) {
          this._firstPassData.polygonRingsCount += lines.length;
        }
        this._firstPassData.polygonPositionsCount += geom.data.length / coordLength;

        // Unlike Point & LineString geom.lines is a 2D array, thanks
        // to the classifyRings method
        geom.lines = rings;
        break;
    }

    geom.type = VectorTileFeature.types[this.type];
    if (geom.lines.length > 1) {
      geom.type = `Multi${geom.type}`;
    }

    const result = {
      type: 'Feature',
      geometry: geom,
      properties: this.properties
    };

    if (this.id !== null) {
      result.id = this.id;
    }

    return result;
  }

  toBinaryCoordinates(options) {
    if (typeof options === 'function') {
      return this._toBinaryCoordinates(options);
    }
    const {x, y, z} = options;
    const size = this.extent * Math.pow(2, z);
    const x0 = this.extent * x;
    const y0 = this.extent * y;

    function project(data) {
      for (let j = 0, jl = data.length; j < jl; j += 2) {
        data[j] = ((data[j] + x0) * 360) / size - 180;
        const y2 = 180 - ((data[j + 1] + y0) * 360) / size;
        data[j + 1] = (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
      }
    }
    return this._toBinaryCoordinates(project);
  }
}

// All code below is unchanged from the original Mapbox implemenation

// classifies an array of rings into polygons with outer rings and holes
function classifyRings(geom) {
  const len = geom.lines.length;

  if (len <= 1) return [geom.lines];

  const polygons = [];
  let polygon;
  let ccw;

  for (let i = 0, startIndex, endIndex; i < len; i++) {
    startIndex = geom.lines[i];

    // endIndex will be undefined for last polygon
    // but that is fine as we only pass it to slice()
    endIndex = geom.lines[i + 1];
    const shape = geom.data.slice(startIndex, endIndex);
    const area = signedArea(shape);

    // TODO would strip out some data, which we want to avoid
    // if (area === 0) continue;

    if (ccw === undefined) ccw = area < 0;

    if (ccw === area < 0) {
      if (polygon) polygons.push(polygon);
      polygon = [startIndex];
    } else {
      // @ts-ignore
      polygon.push(startIndex);
    }
  }
  if (polygon) polygons.push(polygon);

  return polygons;
}

function signedArea(ring) {
  let sum = 0,
    p1x,
    p1y,
    p2x,
    p2y;
  for (let i = 0, len = ring.length / 2, j = len - 1; i < len; j = i++) {
    p1x = ring[2 * i];
    p1y = ring[2 * i + 1];
    p2x = ring[2 * j];
    p2y = ring[2 * j + 1];
    sum += (p2x - p1x) * (p1y + p2y);
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
