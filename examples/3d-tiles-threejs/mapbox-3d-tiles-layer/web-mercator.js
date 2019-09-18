import * as THREE from 'three';
const WEBMERCATOR_EXTENT = 20037508.3427892;

export function transform2mapbox(matrix) {
  const min = -WEBMERCATOR_EXTENT;
  const max = WEBMERCATOR_EXTENT;
  const scale = 1 / (2 * WEBMERCATOR_EXTENT);

  const result = matrix.slice(); // copy array
  result[12] = (matrix[12] - min) * scale; // x translation
  result[13] = (matrix[13] - max) * -scale; // y translation
  result[14] = matrix[14] * scale; // z translation

  return new THREE.Matrix4().fromArray(result).scale(new THREE.Vector3(scale, -scale, scale));
}

/*
function webmercator2mapbox(x, y, z) {
  const min = -WEBMERCATOR_EXTENT;
  const max = WEBMERCATOR_EXTENT;
  const range = 2 * WEBMERCATOR_EXTENT;
  return [(x - min) / range, ((y - max) / range) * -1, z / range];
}
*/
