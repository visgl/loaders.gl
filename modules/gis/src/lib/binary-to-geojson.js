/* eslint-disable */

export function binaryToGeoJson(binary, type, options = {}) {
  switch (type) {
    case 'point':
      return pointToGeoJson(binary);
    case 'lineString':
      return lineStringToGeoJson(binary);
    case 'polygon':
      return polygonToGeoJson(binary);
    default:
      throw new Error('Invalid type');
  }
}

function polygonToGeoJson(data) {
  var positions = data.positions.value;
  var positionsSize = data.positions.size;
  var polygonIndices = data.polygonIndices.value;
  var primitivePolygonIndices = data.primitivePolygonIndices.value;
  var multi = polygonIndices.length > 2;

  var coordinates = [];
  if (!multi) {
    for (var i = 0; i < primitivePolygonIndices.length - 1; i++) {
      var ringCoordinates = [];
      var primitivePolygonIndex = primitivePolygonIndices[i];
      var nextPrimitivePolygonIndex = primitivePolygonIndices[i + 1];

      for (var j = primitivePolygonIndex; j < nextPrimitivePolygonIndex; j++) {
        ringCoordinates.push(
          Array.from(positions.subarray(j * positionsSize, (j + 1) * positionsSize))
        );
      }

      coordinates.push(ringCoordinates);
    }

    return {type: 'Polygon', coordinates};
  }

  // TODO handle MultiPolygon
  return {type: 'MultiPolygon', coordinates};
}
