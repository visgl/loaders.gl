/* eslint-disable */

var NUM_DIMENSIONS = {
  0: 2, // 2D
  1: 3, // 3D (Z)
  2: 3, // 3D (M)
  3: 4 // 4D (ZM)
};

export default function parseWKB(buffer) {
  var view = new DataView(buffer);
  var offset = 0;

  // Check endianness of data
  var littleEndian = view.getUint8(offset) === 1;
  offset++;

  // 4-digit code representing dimension and type of geometry
  var geometryCode = view.getUint32(offset, littleEndian);
  offset += 4;

  var geometryType = geometryCode % 1000;
  var dimension = NUM_DIMENSIONS[(geometryCode - geometryType) / 1000];

  switch (geometryType) {
    case 1:
      return parsePoint(view, offset, dimension, littleEndian);
      break;
    case 2:
      return parseLineString(view, offset, dimension, littleEndian);
      break;
    case 3:
      return parsePolygon(view, offset, dimension, littleEndian);
      break;
    case 4:
      return parseMultiPoint(view, offset, dimension, littleEndian);
      break;
    case 5:
      return parseMultiLineString(view, offset, dimension, littleEndian);
      break;
    case 6:
      return parseMultiPolygon(view, offset, dimension, littleEndian);
      break;
    case 7:
      // TODO: handle GeometryCollections
      // return parseGeometryCollection(view, offset, dimension, littleEndian);
      break;
    default:
      console.error(`Unsupported geometry type: ${geometryType}`);
  }
}

// Primitives; parse point and linear ring
function parsePoint(view, offset, dimension, littleEndian) {
  var positions = new Float64Array(dimension);
  for (var i = 0; i < dimension; i++) {
    positions[i] = view.getFloat64(offset, littleEndian);
    offset += 8;
  }

  return {positions: {value: positions, size: dimension}, offset};
}

function parseLineString(view, offset, dimension, littleEndian) {
  var nPoints = view.getUint32(offset, littleEndian);
  offset += 4;

  // Instantiate array
  var positions = new Float64Array(nPoints * dimension);
  for (var i = 0; i < nPoints * dimension; i++) {
    positions[i] = view.getFloat64(offset, littleEndian);
    offset += 8;
  }

  return {
    positions: {value: positions, size: dimension},
    pathIndices: {value: new Uint16Array([0, nPoints]), size: 1},
    offset
  };
}

function parsePolygon(view, offset, dimension, littleEndian) {
  var nRings = view.getUint32(offset, littleEndian);
  offset += 4;

  var polygonCoords = [];
  for (var i = 0; i < nRings; i++) {
    var {coords, offset} = parseLinearRing(view, offset, dimension, littleEndian);
    polygonCoords.push(coords);
  }

  var positions = new Float64Array(concatTypedArrays(polygonCoords).buffer);
  var primitivePolygonIndices = [0];
  var primitivePolygonIndex = 0;
  for (var i = 0; i < polygonCoords.length; i++) {
    primitivePolygonIndex += polygonCoords[i].length;
    primitivePolygonIndices.push(primitivePolygonIndex);
  }

  return {
    positions: {value: positions, size: dimension},
    primitivePolygonIndices: {value: primitivePolygonIndices, size: 1}
  };
}

function parseMultiPoint(view, offset, dimension, littleEndian) {
  var nPoints = view.getUint32(offset, littleEndian);
  offset += 4;

  var points = [];
  for (var i = 0; i < nPoints; i++) {
    // Byte order for point
    var littleEndianPoint = view.getUint8(offset) === 1;
    offset++;

    // Assert point type
    assert(view.getUint32(offset, littleEndianPoint) % 1000 === 1);
    offset += 4;

    var {positions, offset} = parsePoint(view, offset, dimension, littleEndianPoint);
    points.push(positions);
  }

  return {
    positions: {value: new Float64Array(concatTypedArrays(points).buffer), size: dimension}
  };
}

function parseMultiLineString(view, offset, dimension, littleEndian) {
  var nLines = view.getUint32(offset, littleEndian);
  offset += 4;

  var lines = [];
  for (var i = 0; i < nLines; i++) {
    // Byte order for line
    var littleEndianLine = view.getUint8(offset) === 1;
    offset++;

    // Assert type LineString
    assert(view.getUint32(offset, littleEndianLine) % 1000 === 2);
    offset += 4;

    var {positions, offset} = parseLineString(view, offset, dimension, littleEndianLine);
    lines.push(positions);
  }

  return {
    positions: {value: new Float64Array(concatTypedArrays(lines).buffer), size: dimension}
  };
}

function parseMultiPolygon(view, offset, dimension, littleEndian) {
  var nPolygons = view.getUint32(offset, littleEndian);
  offset += 4;

  var polygons = [];
  for (var i = 0; i < nPolygons; i++) {
    // Byte order for polygon
    var littleEndianPolygon = view.getUint8(offset) === 1;
    offset++;

    // Assert type Polygon
    assert(view.getUint32(offset, littleEndianPolygon) % 1000 === 3);
    offset += 4;

    var {positions, offset} = parsePolygon(view, offset, dimension, littleEndianPolygon);
    polygons.push(positions);
  }

  return {
    positions: {value: new Float64Array(concatTypedArrays(polygons).buffer), size: dimension}
  };
}

// TODO: remove copy; import from typed-array-utils
// modules/math/src/geometry/typed-arrays/typed-array-utils.js
function concatTypedArrays(arrays) {
  let byteLength = 0;
  for (let i = 0; i < arrays.length; ++i) {
    byteLength += arrays[i].byteLength;
  }
  const buffer = new Uint8Array(byteLength);

  let byteOffset = 0;
  for (let i = 0; i < arrays.length; ++i) {
    const data = new Uint8Array(arrays[i].buffer);
    byteLength = data.length;
    for (let j = 0; j < byteLength; ++j) {
      buffer[byteOffset++] = data[j];
    }
  }
  return buffer;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`parseWKB assertion failed. ${message}`);
  }
}


