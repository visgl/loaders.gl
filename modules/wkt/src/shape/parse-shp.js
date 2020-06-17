import BinaryReader from './binary-async-iterator-reader';

function concat(a, b) {
  var ab = new Uint8Array(a.length + b.length);
  ab.set(a, 0);
  ab.set(b, a.length);
  return ab;
}

const SHAPE_HEADER_SIZE = 100;
const SHAPE_RECORD_HEADER_SIZE = 12;

export function parseShape(arrayBuffer) {
  const headerView = new DataView(arrayBuffer, 0, SHAPE_HEADER_SIZE);
  const header = parseHeader(headerView);

  let currentIndex = 0;
  const features = [];

  let offset = SHAPE_HEADER_SIZE;

  while (offset < arrayBuffer.length + SHAPE_RECORD_HEADER_SIZE) {
    const recordHeaderView = new DataView(arrayBuffer, offset, SHAPE_RECORD_HEADER_SIZE);
    const index = recordHeaderView.getInt32(0, false)
    const byteLength = recordHeaderView.getInt32(4, false) * 2 - 4; // 2 byte words...
    const type = recordHeaderView.getInt32(8, true);

    // All records must have at least four bytes (for the record shape type)
    if (byteLength < 4 || type !== header.type || index !== currentIndex) {
      // Malformed record, try again after advancing 4 bytes
      offset += 4;
    } else {
      const recordView = new DataView(arrayBuffer + offset + 8, 4 + length);
      features.push(parseRecord(recordView));
      currentIndex++;
      offset += SHAPE_RECORD_HEADER_SIZE + byteLength;
    }
  }

  // TODO convert to geojson?
  return {
    header,
    features
  };
}

/*
export async function *parseShapeInBatches(asyncIterator) {
  const binaryReader = new BinaryReader(asyncIterator);

  let index = 0;
  let shpType;
  ++index;

  const header = await binaryReader.getDataView(12);
  if (header === null) {
    // Source exhausted, finished
    return;
  }

  const length = header.getInt32(4, false) * 2 - 4;
  const type = header.getInt32(8, true);

  const isInvalid = length < 0 || (type && type !== shpType);

  // If the record starts with an invalid shape type (see #36), scan ahead in
  // four-byte increments to find the next valid record, identified by the
  // expected index, a non-empty content length and a valid shape type.
  if (!isInvalid) {
    // All records should have at least four bytes (for the record shape type),
    // so an invalid content length indicates corruption.
    const chunk = await binaryReader.getDataView(length);
    if (!type) {
      yield null;
    }
    const array = concat(header.buffer.slice(8), chunk);
    const record = new DataView(array, 0, length + 4);
    yield parse(record);

  } else {

    const chunk = await binaryReader.getDataView(4);
    if (chunk == null) {
      return;
    }
    
    const array = concat(header.buffer.slice(4), chunk);
    header = new DataView(array)

    array = concat(array.slice(4), chunk);
    // const header = view(array));
    header.getInt32(0, false) !== that._index ? skip() : read();
  });
}
*/

function parseHeader(header) {
  // TODO any other information of interest?
  return {
    type: header.getInt32(32, true),
    bbox: [
      header.getFloat64(36, true),
      header.getFloat64(44, true),
      header.getFloat64(52, true),
      header.getFloat64(60, true)
    ]
  };
}

function parseRecord(record) {
  switch (type) {
    case 0: return parseNull(record);
    case 1: return parsePoint(record);
    case 3: return parsePolyLine(record);
    case 5: return parsePolygon(record);
    case 8: return parseMultiPoint(record);
    case 11: return parsePoint(record); // PointZ
    case 13: return parsePolyLine(record); // PolyLineZ
    case 15: return parsePolygon(record); // PolygonZ
    case 18: return parseMultiPoint(record); // MultiPointZ
    case 21: return parsePoint(record); // PointM
    case 23: return parsePolyLine(record); // PolyLineM
    case 25: return parsePolygon(record); // PolygonM
    case 28: return parseMultiPoint(record);// MultiPointM
    default: throw new Error(`unsupported shape type: " + type`)
  };
}

/**
 * @param {DataView} record 
 */
function parseNull(record) {
  return null;
}

/**
 * @param {DataView} record 
 */
function parsePoint(record) {
  return {type: "Point", coordinates: [record.getFloat64(4, true), record.getFloat64(12, true)]};
}

/**
 * @param {DataView} record 
 */
function parseMultiPoint(record) {
  export default function(record) {
    var i = 40, j, n = record.getInt32(36, true), coordinates = new Array(n);
    for (j = 0; j < n; ++j, i += 16) coordinates[j] = [record.getFloat64(i, true), record.getFloat64(i + 8, true)];
    return {type: "MultiPoint", coordinates: coordinates};
  };
}

/**
 * @param {DataView} record 
 */
function parsePolyLine(record) {
  const n = record.getInt32(36, true);
  const m = record.getInt32(40, true);
  const parts = new Array(n);
  const points = new Array(m);

  let i = 44;
  for (let j = 0; j < n; ++j, i += 4) {
    parts[j] = record.getInt32(i, true);
  }
  for (let j = 0; j < m; ++j, i += 16) {
    points[j] = [record.getFloat64(i, true), record.getFloat64(i + 8, true)];
  }
  return n === 1
      ? {type: "LineString", coordinates: points}
      : {type: "MultiLineString", coordinates: parts.map((i, j) => points.slice(i, parts[j + 1]))};
}

/**
 * @param {DataView} record 
 * TODO - modernize parse polygon code
 */
function parsePolygon(record) {
  var i = 44, j, n = record.getInt32(36, true), m = record.getInt32(40, true), parts = new Array(n), points = new Array(m), polygons = [], holes = [];
  for (j = 0; j < n; ++j, i += 4) parts[j] = record.getInt32(i, true);
  for (j = 0; j < m; ++j, i += 16) points[j] = [record.getFloat64(i, true), record.getFloat64(i + 8, true)];

  parts.forEach(function(i, j) {
    var ring = points.slice(i, parts[j + 1]);
    if (ringClockwise(ring)) polygons.push([ring]);
    else holes.push(ring);
  });

  holes.forEach(function(hole) {
    polygons.some(function(polygon) {
      if (ringContainsSome(polygon[0], hole)) {
        polygon.push(hole);
        return true;
      }
    }) || polygons.push([hole]);
  });

  return polygons.length === 1
      ? {type: "Polygon", coordinates: polygons[0]}
      : {type: "MultiPolygon", coordinates: polygons};
};

function ringClockwise(ring) {
  if ((n = ring.length) < 4) return false;
  var i = 0, n, area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area >= 0;
}

function ringContainsSome(ring, hole) {
  var i = -1, n = hole.length, c;
  while (++i < n) {
    if (c = ringContains(ring, hole[i])) {
      return c > 0;
    }
  }
  return false;
}

function ringContains(ring, point) {
  var x = point[0], y = point[1], contains = -1;
  for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    var pi = ring[i], xi = pi[0], yi = pi[1],
        pj = ring[j], xj = pj[0], yj = pj[1];
    if (segmentContains(pi, pj, point)) {
      return 0;
    }
    if (((yi > y) !== (yj > y)) && ((x < (xj - xi) * (y - yi) / (yj - yi) + xi))) {
      contains = -contains;
    }
  }
  return contains;
}

function segmentContains(p0, p1, p2) {
  var x20 = p2[0] - p0[0], y20 = p2[1] - p0[1];
  if (x20 === 0 && y20 === 0) return true;
  var x10 = p1[0] - p0[0], y10 = p1[1] - p0[1];
  if (x10 === 0 && y10 === 0) return false;
  var t = (x20 * x10 + y20 * y10) / (x10 * x10 + y10 * y10);
  return t < 0 || t > 1 ? false : t === 0 || t === 1 ? true : t * x10 === x20 && t * y10 === y20;
}