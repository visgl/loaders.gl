/* eslint-disable */

var NUM_DIMENSIONS = {
  0: 2,
  1: 3,
  2: 3,
  3: 4
};

function parseWKB(buffer) {
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
      parsePoint();
      break;
    case 2:
      parseLineString();
      break;
    case 3:
      parsePolygon(view, offset, dimension, littleEndian);
      break;
    case 4:
      parseMultiPoint();
      break;
    case 5:
      parseMultiLineString();
      break;
    case 6:
      parseMultiPolygon();
      break;
    case 7:
      parseGeometryCollection();
      break;
    default:
      console.error(`Unsupported geometry type: ${geometryType}`);
  }
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

function parseLinearRing(view, offset, dimension, littleEndian) {
  var nPoints = view.getUint32(offset, littleEndian);
  offset += 4;

  // Instantiate array
  var coords = new Float64Array(nPoints * dimension);
  for (var i = 0; i < nPoints * dimension; i++) {
    coords[i] = view.getFloat64(offset, littleEndian);
    offset += 8;
  }

  return {coords, offset};
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


