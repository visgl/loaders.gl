import {toRadians} from 'math.gl';
import {getDistanceScales} from 'viewport-mercator-project';

/* eslint-disable max-statements */
export function lodJudge(tile, frameState) {
  const viewport = frameState.viewport;
  const distanceScales = getDistanceScales(viewport);

  const mbsLat = tile._mbs[1];
  const mbsLon = tile._mbs[0];
  const mbsR = tile._mbs[3];

  const {height, width, latitude, longitude} = viewport;

  const viewportCenter = [longitude, latitude];
  const mbsCenter = [mbsLon, mbsLat];
  const mbsLatProjected = [longitude, mbsLat];
  const mbsLonProjected = [mbsLon, latitude];

  const diagonalInMeters =
    Math.sqrt(height * height + width * width) * distanceScales.metersPerPixel[0];
  const distanceInMeters = getDistanceFromLatLon(viewportCenter, mbsCenter);

  const visibleHeight = height * 0.5 + mbsR;
  const visibleWidth = width * 0.5 + mbsR;

  if (distanceInMeters > diagonalInMeters + mbsR) {
    return 'OUT';
  }
  if (getDistanceFromLatLon(viewportCenter, mbsLatProjected) > visibleHeight) {
    return 'OUT';
  }
  if (getDistanceFromLatLon(viewportCenter, mbsLonProjected) > visibleWidth) {
    return 'OUT';
  }

  if (tile.lodMaxError === 0) {
    return 'DIG';
  }

  // For the maxScreenThreshold error metric, maxError means that you should replace the node with it's children
  // as soon as the nodes bounding sphere has a screen radius larger than maxError pixels.
  // In this sense a value of 0 means you should always load it's children,
  // or if it's a leaf node, you should always display it.
  const screenSize = getScreenSize(tile, frameState);
  // -1000 is a hack
  if (!tile._header.children || screenSize <= tile.lodMaxError - 1000) {
    return 'DRAW';
  } else if (tile._header.children) {
    return 'DIG';
  }

  return 'OUT';
}
/* eslint-enable max-statements */

function getDistanceFromLatLon([lon1, lat1], [lon2, lat2]) {
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

export function getScreenSize(tile, frameState) {
  // https://stackoverflow.com/questions/21648630/radius-of-projected-sphere-in-screen-space
  const mbsLat = tile._mbs[1];
  const mbsLon = tile._mbs[0];
  const mbsR = tile._mbs[3];

  const mbsCenter = [mbsLon, mbsLat];
  const cameraPositionCartographic = frameState.viewport.unprojectPosition(
    frameState.viewport.cameraPosition
  );

  const mbsToCameraDistanceInMeters = getDistanceFromLatLon(cameraPositionCartographic, mbsCenter);
  const dSquared = mbsToCameraDistanceInMeters * mbsToCameraDistanceInMeters - mbsR * mbsR;

  const fltMax = 3.4028235e38; // convert from 0x7f7fffff which is the maximum
  if (dSquared <= 0.0) {
    return 0.5 * fltMax;
  }

  const d = Math.sqrt(dSquared);
  // console.log(d, tile._distanceToCamera);
  let screenSizeFactor = calculateScreenSizeFactor(tile, frameState);
  screenSizeFactor *= mbsR / d;
  return screenSizeFactor;
}

function calculateScreenSizeFactor(tile, frameState) {
  const tanOfHalfVFAngle = Math.tan(
    Math.atan(
      Math.sqrt(
        1.0 / (frameState.viewProjectionMatrix[0] * frameState.viewProjectionMatrix[0]) +
          1.0 / (frameState.viewProjectionMatrix[5] * frameState.viewProjectionMatrix[5])
      )
    )
  );

  const screenCircleFactor =
    Math.sqrt(frameState.height * frameState.height + frameState.width * frameState.width) /
    tanOfHalfVFAngle;

  return screenCircleFactor;
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
