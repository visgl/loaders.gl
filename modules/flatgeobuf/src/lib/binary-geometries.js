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
  var binaryGeometries = {};

  // FlatGeobuf files can only hold a single geometry type per file, otherwise
  // GeometryType is GeometryCollection
  switch (type) {
    case GeometryType.Point:
    case GeometryType.MultiPoint:
      binaryGeometries.points = parsePoint(geometry);
      break;
    case GeometryType.LineString:
    case GeometryType.MultiLineString:
      binaryGeometries.lines = parseLines(geometry);
      break;

    case GeometryType.Polygon:
      binaryGeometries.polygons = parsePolygons(geometry);
    case GeometryType.MultiPolygons:
      binaryGeometries.polygons = parseMultiPolygons(geometry);
      break;
    default:
      throw new Error('Invalid geometry type.');
  }

  // TODO: parse properties
  return binaryGeometries;

}
