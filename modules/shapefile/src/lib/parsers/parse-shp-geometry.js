const LITTLE_ENDIAN = true;

// eslint-disable-next-line complexity
export function parseRecord(view) {
  let offset = 0;
  const type = view.getInt32(offset, LITTLE_ENDIAN);
  offset += Int32Array.BYTES_PER_ELEMENT;

  switch (type) {
    case 0:
      // Null Shape
      return parseNull(view, offset);
    case 1:
      // Point
      return parsePoint(view, offset, 2);
    case 3:
      // PolyLine
      return parsePoly(view, offset, 2, 'LineString');
    case 5:
      // Polygon
      return parsePoly(view, offset, 2, 'Polygon');
    case 8:
      // MultiPoint
      return parseMultiPoint(view, offset, 2);
    // GeometryZ can have 3 or 4 dimensions, since the M is not required to
    // exist
    case 11:
      // PointZ
      return parsePoint(view, offset, 4);
    case 13:
      // PolyLineZ
      return parsePoly(view, offset, 4, 'LineString');
    case 15:
      // PolygonZ
      return parsePoly(view, offset, 4, 'Polygon');
    case 18:
      // MultiPointZ
      return parseMultiPoint(view, offset, 4);
    case 21:
      // PointM
      return parsePoint(view, offset, 3);
    case 23:
      // PolyLineM
      return parsePoly(view, offset, 3, 'LineString');
    case 25:
      // PolygonM
      return parsePoly(view, offset, 3, 'Polygon');
    case 28:
      // MultiPointM
      return parseMultiPoint(view, offset, 3);
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
function parsePoly(view, offset, dim, type) {
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

  // parsePoly only accepts type = LineString or Polygon
  if (type === 'LineString') {
    return {
      positions: {value: positions, size: dim},
      pathIndices: {value: indices, size: 1},
      type
    };
  }

  // type is Polygon
  return {
    positions: {value: positions, size: dim},
    primitivePolygonIndices: {value: indices, size: 1},
    // Shapefiles can only hold non-Multi-Polygons
    polygonIndices: {value: new Uint16Array([0, nPoints]), size: 1},
    type
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
