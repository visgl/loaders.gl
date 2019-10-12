import {Ellipsoid} from '@math.gl/geospatial';
import {Vector3, toRadians} from 'math.gl';
import WebMercatorViewport from 'viewport-mercator-project';

const MIN_ERROR = 1200;

export function lodJudge(frameState, tile) {
  if (tile.id === 'root') {
    return 'DIG';
  } else if (!isFinite(tile.id) || Number(tile.id) > 2) {
    return 'OUT';
  }
  return 'DRAW';

  const viewport = new WebMercatorViewport(frameState.viewState);

  let mbsLat = tile.mbs[1];
  let mbsLon = tile.mbs[0];
  let mbsH = tile.mbs[2];
  let mbsR = tile.mbs[3];

  const {height, width, latitude, longitude} = viewport;
  let diagonal = Math.sqrt(height * height + width * width);
  let distance = getDistanceFromLatLon(latitude, longitude, mbsLat, mbsLon);

  if (distance > diagonal + mbsR) {
    return 'OUT';
  }
  if (getDistanceFromLatLon(latitude, longitude, mbsLat, longitude) > height * 0.5 + mbsR) {
    return 'OUT';
  }
  if (getDistanceFromLatLon(latitude, longitude, latitude, mbsLon) > width * 0.5 + mbsR) {
    return 'OUT';
  }

  if (tile.lodMaxError == 0) {
    return 'DIG';
  } else {
    // calculate maxScreenThreshold and mbs
    const pixelsPerMeter = viewport.pixelsPerMeter;

    let distancesPerDegree = getDistancePerDegree(mbsLat, mbsLon);
    let objWest = mbsLon - mbsR / distancesPerDegree.longitude;
    let objWestPixelLocation = wgs84ToPixels(viewport, new Vector3(objWest, mbsLat, mbsH));
    if (!objWestPixelLocation) {
      objWestPixelLocation = {x: 0, y: 0};
    }
    let objEast = mbsLon + mbsR / distancesPerDegree.longitude;
    let objEastPixelLocation = wgs84ToPixels(viewport, new Vector3(objEast, mbsLat, mbsH));
    if (!objEastPixelLocation) {
      objEastPixelLocation = {x: 0, y: 0};
    }

    let pixelDistance = Math.abs(
      (objEastPixelLocation.x - objWestPixelLocation.x) * pixelsPerMeter
    );

    let maxError = tile.lodMaxError < MIN_ERROR ? MIN_ERROR : tile.lodMaxError;

    if (pixelDistance > maxError) {
      if (!tile && tile.children.length > 0) {
        return 'DIG';
      } else if (tile && tile.children) {
        return 'DIG';
      }
      return 'DRAW';
    }

    return 'DRAW';
  }
}

function wgs84ToPixels(viewport, cartesian) {
  const carto = Ellipsoid.WGS84.cartesianToCartographic(cartesian, new Vector3());
  const pixels = viewport.project(carto);
  return pixels;
}

function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the earth
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in
  return d;
}

function getDistancePerDegree(latitude, longitude) {
  let earthRadius = 6371000; // in meters

  let distanceBetweenLatitudes = (2 * Math.PI * earthRadius) / 360;
  let distanceBetweenLongitudes =
    (2 * Math.PI * Math.cos(latitude / (180 / Math.PI)) * earthRadius) / 360;

  return {
    latitude: distanceBetweenLatitudes,
    longitude: distanceBetweenLongitudes
  };
}

// function parseFeatures(featureData, geometryBuffer, node) {
//   const features = featureData.featureData;
//   const geometryData = featureData.geometryData[0];
//   const vertexAttributes = geometryData.params.vertexAttributes;
//   const instances = [];
//
//   let vertexPerFeature = 3;
//   if (geometryData.params.type == 'triangles') {
//     vertexPerFeature = 3;
//   } else if (geometryData.params.type == 'lines') {
//     vertexPerFeature = 2;
//   } else if (geometryData.params.type == 'points') {
//     vertexPerFeature = 1;
//   }
//
//   for (const feature of features) {
//     const faceRange = feature.geometries[0].params.faceRange; // faceRange is the index of faces(triangles): [first, last]
//     const featureVertices = new Float32Array(
//       geometryBuffer,
//       vertexAttributes.position.byteOffset + faceRange[0] * (vertexPerFeature * vertexAttributes.position.valuesPerElement) * Float32Array.BYTES_PER_ELEMENT, // offset
//       (faceRange[1] - faceRange[0] + 1) * (vertexPerFeature * vertexAttributes.position.valuesPerElement) // count
//     );
//
//     const minHeight = featureVertices
//     .filter((coordinate, index) => (index + 1) % 3 == 0)
//     .reduce((accumulator, currentValue) => Math.min(accumulator, currentValue), Infinity);
//
//     offsetVertices(featureVertices, node.mbs[0], node.mbs[1], -minHeight); // move each vertices to right coordinates
//
//     const positions = featureVertices;
//
//     const colors = new Uint8Array(
//       geometryBuffer,
//       vertexAttributes.color.byteOffset + faceRange[0] * (vertexPerFeature * vertexAttributes.color.valuesPerElement) * Uint8Array.BYTES_PER_ELEMENT,
//       (faceRange[1] - faceRange[0] + 1) * (vertexPerFeature * vertexAttributes.color.valuesPerElement)
//     );
//
//     const normals = new Float32Array(
//       geometryBuffer,
//       vertexAttributes.normal.byteOffset + faceRange[0] * (vertexPerFeature * vertexAttributes.normal.valuesPerElement) * Float32Array.BYTES_PER_ELEMENT,
//       (faceRange[1] - faceRange[0] + 1) * (vertexPerFeature * vertexAttributes.normal.valuesPerElement)
//     );
//
//     const uv0s = new Float32Array(
//       geometryBuffer,
//       vertexAttributes.uv0.byteOffset + faceRange[0] * (vertexPerFeature * vertexAttributes.uv0.valuesPerElement) * Float32Array.BYTES_PER_ELEMENT,
//       (faceRange[1] - faceRange[0] + 1) * (vertexPerFeature * vertexAttributes.uv0.valuesPerElement)
//     );
//
//     // flip the v-coordinate (v = 1 - v), the v directions in i3s and cesium are reversed
//     for (let j = 0; j < uv0s.length; j += 2) {
//       uv0s[j + 1] = 1 - uv0s[j + 1];
//     }
//
//     instances.push({
//       node,
//       ...geometryData,
//       id: feature.id,
//       count: vertexAttributes.position.count,
//       position: {
//         type: GL.DOUBLE,
//         value: positions
//       },
//       normal: {
//         type: GL.FLOAT,
//         size: 3,
//         value: normals
//       },
//       color: {
//         type: GL.UNSIGNED_BYTE,
//         size: 4,
//         value: colors,
//         normalized: true
//       }
//     });
//   }
// }
