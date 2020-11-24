import {GeometryType} from 'flatgeobuf/lib/cjs/header_generated';

// Parse Point to flat array
function parsePoint(geometry) {
  const xy = geometry.xyArray();
  const z = geometry.zArray();
  const positions = blitArrays(xy, z);
  return {positions};
}

function parseLines(geometry) {
  const xy = geometry.xyArray();
  const z = geometry.zArray();
  const positions = blitArrays(xy, z);

  // If endsArray is null, a single LineString. Otherwise, contains the end
  // indices of each part of the MultiLineString. geometry.endsArray() omits the
  // initial 0 that we have in our internal format.
  const ends = (geometry.endsArray() && Array.from(geometry.endsArray())) || [xy.length / 2];
  ends.unshift(0);

  const pathIndices = {value: new Uint16Array(ends), size: 1};

  return {
    positions,
    pathIndices
  };
}

function parsePolygons(geometry) {
  const xy = geometry.xyArray();
  const z = geometry.zArray();
  const positions = blitArrays(xy, z);

  // If endsArray is null, a simple Polygon with no inner rings. Otherwise,
  // contains the end indices of each ring of the Polygon. geometry.endsArray()
  // omits the initial 0 that we have in our internal format.
  const ends = (geometry.endsArray() && Array.from(geometry.endsArray())) || [xy.length / 2];
  ends.unshift(0);

  const primitivePolygonIndices = {value: new Uint16Array(ends), size: 1};
  const polygonIndices = {value: new Uint16Array([0, xy.length / 2]), size: 1};

  return {
    positions,
    primitivePolygonIndices,
    polygonIndices
  };
}

// eslint-disable-next-line max-statements
function parseMultiPolygons(geometry) {
  // Create arrays for each geometry part, then concatenate
  const parsedParts = [];
  let nPositions = 0;
  let nPrimitivePolygonIndices = 1;
  let nPolygonIndices = 1;

  for (let i = 0; i < geometry.partsLength(); i++) {
    const part = geometry.parts(i);
    const polygon = parsePolygons(part);

    nPositions += polygon.positions.value.length;
    nPrimitivePolygonIndices += polygon.primitivePolygonIndices.value.length - 1;
    nPolygonIndices += polygon.polygonIndices.value.length - 1;

    parsedParts.push(polygon);
  }

  const concatPositions = new Float64Array(nPositions);
  const concatPrimitivePolygonIndices = new Uint32Array(nPrimitivePolygonIndices);
  const concatPolygonIndices = new Uint32Array(nPolygonIndices);

  let positionCounter = 0;
  let primitivePolygonIndicesCounter = 1;
  let polygonIndicesCounter = 1;

  // Assumes all parts of the multipolygon have the same size
  const positionSize = parsedParts[0].positions.size;

  for (const parsedPart of parsedParts) {
    concatPositions.set(parsedPart.positions.value, positionCounter * positionSize);

    // For indices, need to add positionCounter so that position indices are
    // correct in the concatenated positions
    concatPrimitivePolygonIndices.set(
      parsedPart.primitivePolygonIndices.value.subarray(1).map(x => x + positionCounter),
      primitivePolygonIndicesCounter
    );
    concatPolygonIndices.set(
      parsedPart.polygonIndices.value.subarray(1).map(x => x + positionCounter),
      polygonIndicesCounter
    );

    positionCounter += parsedPart.positions.value.length / positionSize;
    primitivePolygonIndicesCounter += parsedPart.primitivePolygonIndices.value.length - 1;
    polygonIndicesCounter += parsedPart.polygonIndices.value.length - 1;
  }

  return {
    positions: {value: concatPositions, size: positionSize},
    primitivePolygonIndices: {value: concatPrimitivePolygonIndices, size: 1},
    polygonIndices: {value: concatPolygonIndices, size: 1}
  };
}

// Combine xy and z arrays
function blitArrays(xy, z) {
  if (!z) {
    return {value: xy, size: 2};
  }

  if (z.length * 2 !== xy.length) {
    throw new Error("Z array must be half XY array's length");
  }
  const totalLength = xy.length + z.length;

  const xyz = new Float64Array(totalLength);
  for (let i = 0; i < xy.length / 2; i++) {
    xyz[i * 3 + 0] = xy[i * 2 + 0];
    xyz[i * 3 + 1] = xy[i * 2 + 1];
    xyz[i * 3 + 2] = z[i];
  }
  return {value: xyz, size: 3};
}

export function fromGeometry(geometry, type) {
  switch (type) {
    case GeometryType.Point:
    case GeometryType.MultiPoint:
      return parsePoint(geometry);
    case GeometryType.LineString:
    case GeometryType.MultiLineString:
      return parseLines(geometry);
    case GeometryType.Polygon:
      return parsePolygons(geometry);
    case GeometryType.MultiPolygon:
      return parseMultiPolygons(geometry);
    default:
      throw new Error(`Unimplemented geometry type: ${type}`);
  }
}
