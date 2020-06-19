import {LITTLE_ENDIAN} from './util';

// eslint-disable-next-line complexity
export function parseRecord(view) {
  let offset = 0;
  const type = view.getInt32(offset, LITTLE_ENDIAN);
  offset += Int32Array.BYTES_PER_ELEMENT;

  switch (type) {
    case 0:
      return parseNull(view, offset);
    case 1:
      return parsePoint(view, offset, 2);
    case 3:
      return parsePoly(view, offset, 2);
    case 5:
      return parsePoly(view, offset, 2);
    case 8:
      return parseMultiPoint(view, offset, 2);
    // GeometryZ can have 3 or 4 dimensions, since the M is not required to
    // exist
    case 11:
      return parsePoint(view, offset, 4); // PointZ
    // case 13:
    //   return parsePoly(view, offset, 4); // PolyLineZ
    // case 15:
    //   return parsePoly(view, offset, 4); // PolygonZ
    // case 18:
    //   return parseMultiPoint(view, offset, 4); // MultiPointZ
    case 21:
      return parsePoint(view, offset, 3); // PointM
    // case 23:
    //   return parsePoly(view, offset, 3); // PolyLineM
    // case 25:
    //   return parsePoly(view, offset, 3); // PolygonM
    // case 28:
    //   return parseMultiPoint(view, offset, 3); // MultiPointM
    default:
      throw new Error(`unsupported shape type: ${type}`);
  }
}

function parseNull(view, offset) {
  return null;
}

function parsePoint(view, offset, dim) {
  let positions;
  [positions, offset] = parsePositions(view, offset, 1, dim);

  return {
    positions: {value: positions, size: dim},
    type: 'Point'
  };
}

function parseMultiPoint(view, offset, dim) {
  // skip parsing box
  offset += 4 * Float64Array.BYTES_PER_ELEMENT;

  const nPoints = view.getInt32(offset, LITTLE_ENDIAN);
  offset += Int32Array.BYTES_PER_ELEMENT;

  let xyPositions;
  [xyPositions, offset] = parsePositions(view, offset, nPoints, 2);

  // TODO: parse 3/4D, concat and interleave

  return {
    positions: {value: xyPositions, size: dim},
    type: 'Point'
  };
}

// MultiPolygon doesn't exist? Multiple records with the same attributes?
// polygon and polyline parsing
// This is 2d only
function parsePoly(view, offset, dim) {
  // skip parsing bounding box
  offset += 4 * Float64Array.BYTES_PER_ELEMENT;

  const nParts = view.getInt32(offset, LITTLE_ENDIAN);
  offset += Int32Array.BYTES_PER_ELEMENT;
  const nPoints = view.getInt32(offset, LITTLE_ENDIAN);
  offset += Int32Array.BYTES_PER_ELEMENT;

  // Load parts directly into int32 array
  // Note, doesn't include length of positions; hence is one shorter than deck expects
  const bufferOffset = view.byteOffset + offset;
  const bufferLength = nParts * Int32Array.BYTES_PER_ELEMENT;
  const indices = new Int32Array(view.buffer.slice(bufferOffset, bufferOffset + bufferLength));
  offset += nParts * Int32Array.BYTES_PER_ELEMENT;

  let xyPositions;
  [xyPositions, offset] = parsePositions(view, offset, nPoints, 2);

  // TODO: parse 3/4D, concat and interleave

  return {
    positions: {value: xyPositions, size: dim},
    indices: {value: indices, size: 1}
  };
}

// Parse a contiguous block of positions into a Float64Array
function parsePositions(view, offset, nPoints, dim) {
  const bufferOffset = view.byteOffset + offset;
  const bufferLength = nPoints * dim * Float64Array.BYTES_PER_ELEMENT;
  return [new Float64Array(view.buffer.slice(bufferOffset, bufferOffset + bufferLength)), offset];
}
