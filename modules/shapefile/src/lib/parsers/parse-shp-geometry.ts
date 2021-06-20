import {BinaryGeometryData} from '@loaders.gl/gis';

const LITTLE_ENDIAN = true;

/**
 * Parse individual record
 *
 * @param view Record data
 * @return Binary Geometry Object
 */
// eslint-disable-next-line complexity
export function parseRecord(view: DataView, options?: {shp?}): BinaryGeometryData | null {
  const {_maxDimensions} = options?.shp || {};

  let offset = 0;
  const type = view.getInt32(offset, LITTLE_ENDIAN);
  offset += Int32Array.BYTES_PER_ELEMENT;

  switch (type) {
    case 0:
      // Null Shape
      return parseNull();
    case 1:
      // Point
      return parsePoint(view, offset, Math.min(2, _maxDimensions));
    case 3:
      // PolyLine
      return parsePoly(view, offset, Math.min(2, _maxDimensions), 'LineString');
    case 5:
      // Polygon
      return parsePoly(view, offset, Math.min(2, _maxDimensions), 'Polygon');
    case 8:
      // MultiPoint
      return parseMultiPoint(view, offset, Math.min(2, _maxDimensions));
    // GeometryZ can have 3 or 4 dimensions, since the M is not required to
    // exist
    case 11:
      // PointZ
      return parsePoint(view, offset, Math.min(4, _maxDimensions));
    case 13:
      // PolyLineZ
      return parsePoly(view, offset, Math.min(4, _maxDimensions), 'LineString');
    case 15:
      // PolygonZ
      return parsePoly(view, offset, Math.min(4, _maxDimensions), 'Polygon');
    case 18:
      // MultiPointZ
      return parseMultiPoint(view, offset, Math.min(4, _maxDimensions));
    case 21:
      // PointM
      return parsePoint(view, offset, Math.min(3, _maxDimensions));
    case 23:
      // PolyLineM
      return parsePoly(view, offset, Math.min(3, _maxDimensions), 'LineString');
    case 25:
      // PolygonM
      return parsePoly(view, offset, Math.min(3, _maxDimensions), 'Polygon');
    case 28:
      // MultiPointM
      return parseMultiPoint(view, offset, Math.min(3, _maxDimensions));
    default:
      throw new Error(`unsupported shape type: ${type}`);
  }
}

// TODO handle null
/**
 * Parse Null geometry
 *
 * @return {null}
 */
function parseNull() {
  return null;
}

/**
 * Parse point geometry
 *
 * @param  {DataView} view Geometry data
 * @param  {number} offset Offset in view
 * @param  {number} dim Dimension size
 * @return {object} Binary geometry object
 */
function parsePoint(view, offset, dim) {
  let positions;
  [positions, offset] = parsePositions(view, offset, 1, dim);

  return {
    positions: {value: positions, size: dim},
    type: 'Point'
  };
}

/**
 * Parse MultiPoint geometry
 *
 * @param  {DataView} view Geometry data
 * @param  {number} offset Offset in view
 * @param  {number} dim Input dimension
 * @return {object} Binary geometry object
 */
function parseMultiPoint(view, offset, dim) {
  // skip parsing box
  offset += 4 * Float64Array.BYTES_PER_ELEMENT;

  const nPoints = view.getInt32(offset, LITTLE_ENDIAN);
  offset += Int32Array.BYTES_PER_ELEMENT;

  let xyPositions = null;
  let mPositions = null;
  let zPositions = null;
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

/**
 * Polygon and PolyLine parsing
 * @param view Geometry data
 * @param offset Offset in view
 * @param dim Input dimension
 * @param type Either 'Polygon' or 'Polyline'
 * @return Binary geometry object
 */
// eslint-disable-next-line max-statements
function parsePoly(view: DataView, offset: number, dim: number, type: string) {
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
  const ringIndices = new Int32Array(nParts + 1);
  ringIndices.set(new Int32Array(view.buffer.slice(bufferOffset, bufferOffset + bufferLength)));
  ringIndices[nParts] = nPoints;
  offset += nParts * Int32Array.BYTES_PER_ELEMENT;

  let xyPositions = null;
  let mPositions = null;
  let zPositions = null;
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
      pathIndices: {value: ringIndices, size: 1},
      type
    };
  }

  // for every ring, determine sign of polygon
  // Use only 2D positions for ring calc
  const polygonIndices: number[] = [];
  for (let i = 1; i < ringIndices.length; i++) {
    const startRingIndex = ringIndices[i - 1];
    const endRingIndex = ringIndices[i];
    // @ts-ignore
    const ring = xyPositions.subarray(startRingIndex * 2, endRingIndex * 2);
    const sign = getWindingDirection(ring);

    // A positive sign implies clockwise
    // A clockwise ring is a filled ring
    if (sign > 0) {
      polygonIndices.push(startRingIndex);
    }
  }

  polygonIndices.push(nPoints);

  return {
    positions: {value: positions, size: dim},
    primitivePolygonIndices: {value: ringIndices, size: 1},
    // TODO: Dynamically choose Uint32Array over Uint16Array only when
    // necessary. I believe the implementation requires nPoints to be the
    // largest value in the array, so you should be able to use Uint32Array only
    // when nPoints > 65535.
    polygonIndices: {value: new Uint32Array(polygonIndices), size: 1},
    type
  };
}

/**
 * Parse a contiguous block of positions into a Float64Array
 *
 * @param  {DataView} view  Geometry data
 * @param  {number} offset  Offset in view
 * @param  {number} nPoints Number of points
 * @param  {number} dim     Input dimension
 * @return {[Float64Array, number]} Data and offset
 */
function parsePositions(view, offset, nPoints, dim) {
  const bufferOffset = view.byteOffset + offset;
  const bufferLength = nPoints * dim * Float64Array.BYTES_PER_ELEMENT;
  return [
    new Float64Array(view.buffer.slice(bufferOffset, bufferOffset + bufferLength)),
    offset + bufferLength
  ];
}

/**
 * Concatenate and interleave positions arrays
 * xy positions are interleaved; mPositions, zPositions are their own arrays
 *
 * @param  {Float64Array} xyPositions 2d positions
 * @param  {Float64Array?} mPositions  M positions
 * @param  {Float64Array?} zPositions  Z positions
 * @return {Float64Array} Combined interleaved positions
 */
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

/**
 * Returns the direction of the polygon path
 * A positive number is clockwise.
 * A negative number is counter clockwise.
 *
 * @param  {Float64Array} positions
 * @return {number} Sign of polygon ring
 */
function getWindingDirection(positions) {
  return Math.sign(getSignedArea(positions));
}

/**
 * Get signed area of flat typed array of 2d positions
 *
 * @param  {Float64Array} positions
 * @return {number} Signed area of polygon ring
 */
function getSignedArea(positions) {
  let area = 0;

  // Rings are closed according to shapefile spec
  const nCoords = positions.length / 2 - 1;
  for (let i = 0; i < nCoords; i++) {
    area +=
      (positions[i * 2] + positions[(i + 1) * 2]) *
      (positions[i * 2 + 1] - positions[(i + 1) * 2 + 1]);
  }

  return area / 2;
}
