// Eventually will be re-exported from generic module, hopefully
var GeometryType = {
  Unknown: 0,
  Point: 1,
  LineString: 2,
  Polygon: 3,
  MultiPoint: 4,
  MultiLineString: 5,
  MultiPolygon: 6,
  GeometryCollection: 7,
  CircularString: 8,
  CompoundCurve: 9,
  CurvePolygon: 10,
  MultiCurve: 11,
  MultiSurface: 12,
  Curve: 13,
  Surface: 14,
  PolyhedralSurface: 15,
  TIN: 16,
  Triangle: 17
};

// Parse Point to flat array
function parsePoint(geometry) {
  var xy = geometry.xyArray();
  var z = geometry.zArray();
  var positions = blitArrays(xy, z);
  return {positions};
}

function parseLines(geometry) {
  var xy = geometry.xyArray();
  var z = geometry.zArray();
  var positions = blitArrays(xy, z);

  // If endsArray is null, a single LineString. Otherwise, contains the end
  // indices of each part of the MultiLineString. geometry.endsArray() omits the
  // initial 0 that we have in our internal format.
  var ends = (geometry.endsArray() && Array.from(geometry.endsArray())) || [xy.length / 2];
  ends.unshift(0);

  var pathIndices = {value: new Uint16Array(ends), size: 1};

  return {
    positions,
    pathIndices
  };
}

function parsePolygons(geometry) {
  var xy = geometry.xyArray();
  var z = geometry.zArray();
  var positions = blitArrays(xy, z);

  // If endsArray is null, a simple Polygon with no inner rings. Otherwise,
  // contains the end indices of each ring of the Polygon. geometry.endsArray()
  // omits the initial 0 that we have in our internal format.
  var ends = (geometry.endsArray() && Array.from(geometry.endsArray())) || [xy.length / 2];
  ends.unshift(0);

  var primitivePolygonIndices = {value: new Uint16Array(ends), size: 1};
  var polygonIndices = {value: new Uint16Array([0, xy.length / 2]), size: 1};

  return {
    positions,
    primitivePolygonIndices,
    polygonIndices
  };
}

function parseMultiPolygons(geometry) {
  // Create arrays for each geometry part, then concatenate
  var parsedParts = [];
  var nPositions = 0;
  var nPrimitivePolygonIndices = 1;
  var nPolygonIndices = 1;

  for (var i = 0; i < geometry.partsLength(); i++) {
    var part = geometry.parts(i);
    var polygon = parsePolygons(part);

    nPositions += polygon.positions.value.length;
    nPrimitivePolygonIndices += polygon.primitivePolygonIndices.value.length - 1;
    nPolygonIndices += polygon.polygonIndices.value.length - 1;

    parsedParts.push(polygon);
  }

  var concatPositions = new Float64Array(nPositions);
  var concatPrimitivePolygonIndices = new Uint32Array(nPrimitivePolygonIndices);
  var concatPolygonIndices = new Uint32Array(nPolygonIndices);

  var positionCounter = 0;
  var primitivePolygonIndicesCounter = 1;
  var polygonIndicesCounter = 1;

  // Assumes all parts of the multipolygon have the same size
  var positionSize = parsedParts[0].positions.size;

  for (var parsedPart of parsedParts) {
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

  assert(z.length * 2 === xy.length, "Z array must be half XY array's length");
  var totalLength = xy.length + z.length;

  var xyz = new Float64Array(totalLength);
  for (var i = 0; i < xy.length / 2; i++) {
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
