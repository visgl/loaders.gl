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
  var {
    positions,
    polygonIndices: {value: polygonIndices},
    primitivePolygonIndices: {value: primitivePolygonIndices}
  } = data;
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

function lineStringToGeoJson(data) {
  var {
    positions,
    pathIndices: {value: pathIndices}
  } = data;
  var multi = pathIndices.length > 2;

  var coordinates = [];
  if (!multi) {
    coordinates = ringToGeoJson(positions);
    return {type: 'LineString', coordinates};
  }

  for (var i = 0; i < pathIndices.length - 1; i++) {
    var ringCoordinates = ringToGeoJson(positions, pathIndices[i], pathIndices[i + 1]);
    coordinates.push(ringCoordinates);
  }

  return {type: 'MultiLineString', coordinates};
}

function ringToGeoJson(positions, startIndex, endIndex) {
  startIndex = startIndex || 0;
  endIndex = endIndex || positions.value.length / positions.size;

  var ringCoordinates = [];
  for (var j = startIndex; j < endIndex; j++) {
    ringCoordinates.push(
      Array.from(positions.value.subarray(j * positions.size, (j + 1) * positions.size))
    );
  }
  return ringCoordinates;
}

