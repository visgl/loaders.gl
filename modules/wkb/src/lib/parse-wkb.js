/* eslint-disable */

var NUM_DIMENSIONS = {
  0: 2,
  1: 3,
  2: 3,
  3: 4,
}

function parseWKB(buffer) {
  var view = new DataView(buffer)
  var offset = 0;

  // Check endianness of data
  var littleEndian = view.getUint8(offset) === 1
  offset++

  // 4-digit code representing dimension and type of geometry
  var geometryCode = view.getUint32(offset, littleEndian)
  offset += 4

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
      console.error(`Unsupported geometry type: ${geometryType}`)
  }

function parsePolygon(view, offset, dimension, littleEndian) {
  var nRings = view.getUint32(offset, littleEndian);
  offset += 4;

  for (var i = 0; i < nRings; i++) {
    var {coords, offset} = parseLinearRing(view, offset, dimension, littleEndian);
  }

  // Concatenate rings
}


function parseLinearRing(view, offset, dimension, littleEndian) {
  var nPoints = view.getUint32(offset, littleEndian)
  offset += 4;

  // Instantiate array
  var coords = new Float64Array(nPoints * dimension);
  for (var i = 0; i < nPoints * dimension; i++) {
    coords[i] = view.getFloat64(offset, littleEndian)
    offset += 8;
  }

  return {coords, offset};
}




