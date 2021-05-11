// This code is forked from https://github.com/mapbox/vector-tile-js under BSD 3-clause license.
/* eslint-disable */

import {getPolygonSignedArea} from '@math.gl/polygon';

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
        const classified = classifyRings(geom);

        // Unlike Point & LineString geom.lines is a 2D array, thanks
        // to the classifyRings method
        this._firstPassData.polygonFeaturesCount++;
        this._firstPassData.polygonObjectsCount += classified.lines.length;

        for (const lines of classified.lines) {
          this._firstPassData.polygonRingsCount += lines.length;
        }
        this._firstPassData.polygonPositionsCount += classified.data.length / coordLength;

        // @ts-ignore
        geom = classified;
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

/**
 * Classifies an array of rings into polygons with outer rings and holes
 * The function also detects holes which have zero area and
 * removes them. In doing so it modifies the input
 * `geom.data` array to remove the unneeded data
 */
function classifyRings(geom) {
  const len = geom.lines.length;

  if (len <= 1) {
    return {
      data: geom.data,
      areas: [[getPolygonSignedArea(geom.data)]],
      lines: [geom.lines]
    };
  }

  const areas = [];
  const polygons = [];
  let ringAreas;
  let polygon;
  let ccw;
  let offset = 0;

  for (let i = 0, startIndex, endIndex; i < len; i++) {
    startIndex = geom.lines[i] - offset;

    endIndex = geom.lines[i + 1] - offset || geom.data.length;
    const shape = geom.data.slice(startIndex, endIndex);
    const area = getPolygonSignedArea(shape);

    if (area === 0) {
      // This polygon has no area, so remove it from the shape
      // Remove the section from the data array
      const before = geom.data.slice(0, startIndex);
      const after = geom.data.slice(endIndex);
      geom.data = before.concat(after);

      // Need to offset any remaining indices as we have
      // modified the data buffer
      offset += endIndex - startIndex;

      // Do not add this index to the output and process next shape
      continue;
    }

    if (ccw === undefined) ccw = area < 0;

    if (ccw === area < 0) {
      if (polygon) {
        areas.push(ringAreas);
        polygons.push(polygon);
      }
      polygon = [startIndex];
      ringAreas = [area];
    } else {
      // @ts-ignore
      ringAreas.push(area);
      // @ts-ignore
      polygon.push(startIndex);
    }
  }
  if (ringAreas) areas.push(ringAreas);
  if (polygon) polygons.push(polygon);

  return {areas, lines: polygons, data: geom.data};
}

// All code below is unchanged from the original Mapbox implemenation

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
