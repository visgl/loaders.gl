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
  var positions = {
    value: blitArrays(xy, z),
    // TODO: fix for correct dimension
    size: 2
  }
  return {positions};
}


// Combine xy and z arrays
// TODO: should I return the dimension from here? Or use hasZ elsewhere?
function blitArrays(xy, z) {
  if (!z) {
    return xy;
  }

  assert(z.length * 2 === xy.length, "Z array must be half XY array's length")
  var totalLength = xy.length + z.length

  var xyz = new Float64Array(totalLength);
  for (var i = 0; i < xy.length / 2; i++) {
    xyz[i * 3 + 0] = xy[i * 2 + 0]
    xyz[i * 3 + 1] = xy[i * 2 + 1]
    xyz[i * 3 + 2] = z[i]
  }
  return xyz;
}

export function fromGeometry(geometry, type) {
  var binaryGeometries = {}

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
    case GeometryType.MultiPolygons:
      binaryGeometries.lines = parsePolygons(geometry);
      break;
    default:
      throw new Error('Invalid geometry type.')
  }

  // TODO: parse properties
  return binaryGeometries;

}
