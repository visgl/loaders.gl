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
  var positions = data.positions;
  var polygonIndices = data.polygonIndices.value;
  var primitivePolygonIndices = data.primitivePolygonIndices.value;
  var multi = polygonIndices.length > 2;

  var coordinates = [];
  if (!multi) {
    for (var i = 0; i < primitivePolygonIndices.length - 1; i++) {
      var ringCoordinates = ringToGeoJson(
        positions,
        primitivePolygonIndices[i],
        primitivePolygonIndices[i + 1]
      );
      coordinates.push(ringCoordinates);
    }

    return {type: 'Polygon', coordinates};
  }

  // TODO handle MultiPolygon
  return {type: 'MultiPolygon', coordinates};
}

function ringToGeoJson(positions, startIndex, endIndex) {
  var ringCoordinates = [];
  for (var j = startIndex; j < endIndex; j++) {
    ringCoordinates.push(
      Array.from(positions.value.subarray(j * positions.size, (j + 1) * positions.size))
    );
  }
  return ringCoordinates;
}

