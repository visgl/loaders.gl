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
    case 13:
      return parsePoly(view, offset, 4); // PolyLineZ
    case 15:
      return parsePoly(view, offset, 4); // PolygonZ
    case 18:
      return parseMultiPoint(view, offset, 4); // MultiPointZ
    case 21:
      return parsePoint(view, offset, 3); // PointM
    case 23:
      return parsePoly(view, offset, 3); // PolyLineM
    case 25:
      return parsePoly(view, offset, 3); // PolygonM
    case 28:
      return parseMultiPoint(view, offset, 3); // MultiPointM
    default:
      throw new Error(`unsupported shape type: ${type}`);
  }
}

// TODO handle null
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
  let mPositions;
  let zPositions;
  [xyPositions, offset] = parsePositions(view, offset, nPoints, 2);

  // Parse Z coordinates
  if (dim === 4) {
    // skip parsing range
    offset += 2 * Float64Array.BYTES_PER_ELEMENT;
    [zPositions, offset] = parsePositions(view, offset, nPoints, 1);
  }

  // Parse M coordinates
  if (dim >= 3) {
    // skip parsing range
    offset += 2 * Float64Array.BYTES_PER_ELEMENT;
    [mPositions, offset] = parsePositions(view, offset, nPoints, 1);
  }

  const positions = concatPositions(xyPositions, mPositions, zPositions);

  return {
    positions: {value: positions, size: dim},
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

  // Create longer indices array by 1 because output format is expected to
  // include the last index as the total number of positions
  const bufferOffset = view.byteOffset + offset;
  const bufferLength = nParts * Int32Array.BYTES_PER_ELEMENT;
  const indices = new Int32Array(nParts + 1);
  indices.set(new Int32Array(view.buffer.slice(bufferOffset, bufferOffset + bufferLength)));
  indices[nParts] = nPoints;
  offset += nParts * Int32Array.BYTES_PER_ELEMENT;

  let xyPositions;
  let mPositions;
  let zPositions;
  [xyPositions, offset] = parsePositions(view, offset, nPoints, 2);

  // Parse Z coordinates
  if (dim === 4) {
    // skip parsing range
    offset += 2 * Float64Array.BYTES_PER_ELEMENT;
    [zPositions, offset] = parsePositions(view, offset, nPoints, 1);
  }

  // Parse M coordinates
  if (dim >= 3) {
    // skip parsing range
    offset += 2 * Float64Array.BYTES_PER_ELEMENT;
    [mPositions, offset] = parsePositions(view, offset, nPoints, 1);
  }

  const positions = concatPositions(xyPositions, mPositions, zPositions);

  return {
    positions: {value: positions, size: dim},
    indices: {value: indices, size: 1}
  };
}

// Parse a contiguous block of positions into a Float64Array
function parsePositions(view, offset, nPoints, dim) {
  const bufferOffset = view.byteOffset + offset;
  const bufferLength = nPoints * dim * Float64Array.BYTES_PER_ELEMENT;
  return [
    new Float64Array(view.buffer.slice(bufferOffset, bufferOffset + bufferLength)),
    offset + bufferLength
  ];
}

// Concatenate and interleave positions arrays
// xy positions are interleaved; mPositions, zPositions are their own arrays
// eslint-disable-next-line complexity
function concatPositions(xyPositions, mPositions, zPositions) {
  if (!(mPositions || zPositions)) {
    return xyPositions;
  }

  let arrayLength = xyPositions.length;
  let nDim = 2;

  if (zPositions && zPositions.length) {
    arrayLength += zPositions.length;
    nDim++;
  }

  if (mPositions && mPositions.length) {
    arrayLength += mPositions.length;
    nDim++;
  }

  const positions = new Float64Array(arrayLength);
  for (let i = 0; i < xyPositions.length / 2; i++) {
    positions[nDim * i] = xyPositions[i * 2];
    positions[nDim * i + 1] = xyPositions[i * 2 + 1];
  }

  if (zPositions && zPositions.length) {
    for (let i = 0; i < zPositions.length; i++) {
      // If Z coordinates exist; used as third coord in positions array
      positions[nDim * i + 2] = zPositions[i];
    }
  }

  if (mPositions && mPositions.length) {
    for (let i = 0; i < mPositions.length; i++) {
      // M is always last, either 3rd or 4th depending on if Z exists
      positions[nDim * i + (nDim - 1)] = mPositions[i];
    }
  }

  return positions;
}
