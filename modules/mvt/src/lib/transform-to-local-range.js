const geometryTypes = ['Unknown', 'Point', 'LineString', 'Polygon'];

export function transformToLocalCoordinates(line, feature) {
  // This function transforms local coordinates in a
  // [0 - bufferSize, this.extent + bufferSize] range to a
  // [0 - (bufferSize / this.extent), 1 + (bufferSize / this.extent)] range.
  // The resulting extent would be 1.

  for (let i = 0; i < line.length; i++) {
    const point = line[i];

    line[i] = [point.x / feature.extent, point.y / feature.extent];
  }
}

export function transformCoordinates(feature, transform = (coordinates, feature_) => coordinates) {
  const type = geometryTypes[feature.type];
  let coordinates = feature.loadGeometry();

  switch (feature.type) {
    // Point
    case 1:
      const points = [];
      for (let i = 0; i < coordinates.length; i++) {
        points[i] = coordinates[i][0];
      }
      coordinates = points;
      transform(coordinates, feature);
      break;

    // LineString
    case 2:
      for (let i = 0; i < coordinates.length; i++) {
        transform(coordinates[i], feature);
      }
      break;

    // Polygon
    case 3:
      coordinates = classifyRings(coordinates);
      for (let i = 0; i < coordinates.length; i++) {
        for (let j = 0; j < coordinates[i].length; j++) {
          transform(coordinates[i][j], feature);
        }
      }
      break;

    default:
      break;
  }

  return generateJSON(type, feature, coordinates);
}

function generateJSON(type, feature, coordinates) {
  let geometryType = type;

  if (coordinates.length === 1) {
    coordinates = coordinates[0];
  } else {
    geometryType = `Multi${type}`;
  }

  const jsonResult = {
    type: 'Feature',
    geometry: {
      type: geometryType,
      coordinates
    },
    properties: feature.properties || {}
  };

  if ('id' in feature) {
    jsonResult.id = feature.id;
  }

  return jsonResult;
}

/*
* Methods below are extracted and modified from @mapbox/vector-tile
* https://github.com/mapbox/vector-tile-js/blob/58df1e9344ee64f26deee84a9f54cee11fb95ef6/lib/vectortilefeature.js#L197-L233
*/

// classifies an array of rings into polygons with outer rings and holes
function classifyRings(rings) {
  const len = rings.length;

  if (len <= 1) return [rings];

  const polygons = [];
  let polygon;
  let ccw;

  for (let i = 0; i < len; i++) {
    const area = signedArea(rings[i]);

    if (area === 0) {
      /* eslint-disable-next-line no-continue */
      continue;
    }

    if (ccw === undefined) ccw = area < 0;

    if (ccw === area < 0) {
      if (polygon) {
        polygons.push(polygon);
      }

      polygon = [rings[i]];
    } else {
      polygon.push(rings[i]);
    }
  }

  if (polygon) polygons.push(polygon);

  return polygons;
}

function signedArea(ring) {
  const length = ring.length;
  let sum = 0;
  let p1;
  let p2;

  for (let i = 0, j = length - 1; i < length; j = i++) {
    p1 = ring[i];
    p2 = ring[j];
    sum += (p2.x - p1.x) * (p1.y + p2.y);
  }

  return sum;
}
