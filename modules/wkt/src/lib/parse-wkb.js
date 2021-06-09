const NUM_DIMENSIONS = {
  0: 2, // 2D
  1: 3, // 3D (Z)
  2: 3, // 3D (M)
  3: 4 // 4D (ZM)
};

export default function parseWKB(buffer) {
  const view = new DataView(buffer);
  let offset = 0;

  // Check endianness of data
  const littleEndian = view.getUint8(offset) === 1;
  offset++;

  // 4-digit code representing dimension and type of geometry
  const geometryCode = view.getUint32(offset, littleEndian);
  offset += 4;

  const geometryType = geometryCode % 1000;
  const dimension = NUM_DIMENSIONS[(geometryCode - geometryType) / 1000];

  switch (geometryType) {
    case 1:
      const point = parsePoint(view, offset, dimension, littleEndian);
      delete point.offset;
      point.type = 'Point';
      return point;
    case 2:
      const line = parseLineString(view, offset, dimension, littleEndian);
      delete line.offset;
      line.type = 'LineString';
      return line;
    case 3:
      const polygon = parsePolygon(view, offset, dimension, littleEndian);
      delete polygon.offset;
      polygon.type = 'Polygon';
      return polygon;
    case 4:
      const multiPoint = parseMultiPoint(view, offset, dimension, littleEndian);
      multiPoint.type = 'Point';
      return multiPoint;
    case 5:
      const multiLine = parseMultiLineString(view, offset, dimension, littleEndian);
      multiLine.type = 'LineString';
      return multiLine;
    case 6:
      const multiPolygon = parseMultiPolygon(view, offset, dimension, littleEndian);
      multiPolygon.type = 'Polygon';
      return multiPolygon;
    // case 7:
    // TODO: handle GeometryCollections
    // return parseGeometryCollection(view, offset, dimension, littleEndian);
    default:
      assert(false, `Unsupported geometry type: ${geometryType}`);
  }

  return null;
}

// Primitives; parse point and linear ring
function parsePoint(view, offset, dimension, littleEndian) {
  const positions = new Float64Array(dimension);
  for (let i = 0; i < dimension; i++) {
    positions[i] = view.getFloat64(offset, littleEndian);
    offset += 8;
  }

  return {positions: {value: positions, size: dimension}, offset};
}

function parseLineString(view, offset, dimension, littleEndian) {
  const nPoints = view.getUint32(offset, littleEndian);
  offset += 4;

  // Instantiate array
  const positions = new Float64Array(nPoints * dimension);
  for (let i = 0; i < nPoints * dimension; i++) {
    positions[i] = view.getFloat64(offset, littleEndian);
    offset += 8;
  }

  const pathIndices = [0];
  if (nPoints > 0) {
    pathIndices.push(nPoints);
  }

  return {
    positions: {value: positions, size: dimension},
    pathIndices: {value: new Uint16Array(pathIndices), size: 1},
    offset
  };
}

// https://stackoverflow.com/a/55261098
const cumulativeSum = (sum) => (value) => (sum += value);

function parsePolygon(view, offset, dimension, littleEndian) {
  const nRings = view.getUint32(offset, littleEndian);
  offset += 4;

  const rings = [];
  for (let i = 0; i < nRings; i++) {
    const parsed = parseLineString(view, offset, dimension, littleEndian);
    const {positions} = parsed;
    offset = parsed.offset;
    rings.push(positions.value);
  }

  const concatenatedPositions = new Float64Array(concatTypedArrays(rings).buffer);
  const polygonIndices = [0];
  if (concatenatedPositions.length > 0) {
    polygonIndices.push(concatenatedPositions.length / dimension);
  }
  const primitivePolygonIndices = rings.map((l) => l.length / dimension).map(cumulativeSum(0));
  primitivePolygonIndices.unshift(0);

  return {
    positions: {value: concatenatedPositions, size: dimension},
    polygonIndices: {
      value: new Uint16Array(polygonIndices),
      size: 1
    },
    primitivePolygonIndices: {value: new Uint16Array(primitivePolygonIndices), size: 1},
    offset
  };
}

function parseMultiPoint(view, offset, dimension, littleEndian) {
  const nPoints = view.getUint32(offset, littleEndian);
  offset += 4;

  const points = [];
  for (let i = 0; i < nPoints; i++) {
    // Byte order for point
    const littleEndianPoint = view.getUint8(offset) === 1;
    offset++;

    // Assert point type
    assert(
      view.getUint32(offset, littleEndianPoint) % 1000 === 1,
      'Inner geometries of MultiPoint not of type Point'
    );
    offset += 4;

    const parsed = parsePoint(view, offset, dimension, littleEndianPoint);
    const {positions} = parsed;
    offset = parsed.offset;
    points.push(positions.value);
  }

  const concatenatedPositions = new Float64Array(concatTypedArrays(points).buffer);

  return {
    positions: {value: concatenatedPositions, size: dimension}
  };
}

function parseMultiLineString(view, offset, dimension, littleEndian) {
  const nLines = view.getUint32(offset, littleEndian);
  offset += 4;

  const lines = [];
  for (let i = 0; i < nLines; i++) {
    // Byte order for line
    const littleEndianLine = view.getUint8(offset) === 1;
    offset++;

    // Assert type LineString
    assert(
      view.getUint32(offset, littleEndianLine) % 1000 === 2,
      'Inner geometries of MultiLineString not of type LineString'
    );
    offset += 4;

    const parsed = parseLineString(view, offset, dimension, littleEndianLine);
    const {positions} = parsed;
    offset = parsed.offset;
    lines.push(positions.value);
  }

  const concatenatedPositions = new Float64Array(concatTypedArrays(lines).buffer);
  const pathIndices = lines.map((l) => l.length / dimension).map(cumulativeSum(0));
  pathIndices.unshift(0);

  return {
    positions: {value: concatenatedPositions, size: dimension},
    pathIndices: {value: new Uint16Array(pathIndices), size: 1}
  };
}

function parseMultiPolygon(view, offset, dimension, littleEndian) {
  const nPolygons = view.getUint32(offset, littleEndian);
  offset += 4;

  const polygons = [];
  const primitivePolygons = [];
  for (let i = 0; i < nPolygons; i++) {
    // Byte order for polygon
    const littleEndianPolygon = view.getUint8(offset) === 1;
    offset++;

    // Assert type Polygon
    assert(
      view.getUint32(offset, littleEndianPolygon) % 1000 === 3,
      'Inner geometries of MultiPolygon not of type Polygon'
    );
    offset += 4;

    const parsed = parsePolygon(view, offset, dimension, littleEndianPolygon);
    const {positions, primitivePolygonIndices} = parsed;
    offset = parsed.offset;
    polygons.push(positions.value);
    primitivePolygons.push(primitivePolygonIndices.value);
  }

  const concatenatedPositions = new Float64Array(concatTypedArrays(polygons).buffer);
  const polygonIndices = polygons.map((p) => p.length / dimension).map(cumulativeSum(0));
  polygonIndices.unshift(0);

  // Combine primitivePolygonIndices from each individual polygon
  const primitivePolygonIndices = [0];
  for (const primitivePolygon of primitivePolygons) {
    primitivePolygonIndices.push(
      ...primitivePolygon
        .filter((x) => x > 0)
        .map((x) => x + primitivePolygonIndices[primitivePolygonIndices.length - 1])
    );
  }

  return {
    positions: {value: concatenatedPositions, size: dimension},
    polygonIndices: {value: new Uint16Array(polygonIndices), size: 1},
    primitivePolygonIndices: {value: new Uint16Array(primitivePolygonIndices), size: 1}
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
    throw new Error(`Error parsing Well-Known Binary. ${message}`);
  }
}
