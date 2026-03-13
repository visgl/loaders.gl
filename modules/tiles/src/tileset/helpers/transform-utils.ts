// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Ellipsoid} from '@math.gl/geospatial';
import {Matrix4, Vector3} from '@math.gl/core';
import {assert} from '@loaders.gl/loader-utils';

import {Tile3D} from '../tile-3d';

export function calculateTransformProps(tileHeader: Tile3D, tile: Tile3D['content']) {
  assert(tileHeader);
  assert(tile);

  const {rtcCenter, gltfUpAxis} = tile;
  const {
    computedTransform,
    boundingVolume: {center}
  } = tileHeader;

  let modelMatrix = new Matrix4(computedTransform);

  // Translate if appropriate
  if (rtcCenter) {
    modelMatrix.translate(rtcCenter);
  }

  // glTF models need to be rotated from Y to Z up
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#y-up-to-z-up
  switch (gltfUpAxis) {
    case 'Z':
      break;
    case 'Y':
      const rotationY = new Matrix4().rotateX(Math.PI / 2);
      modelMatrix = modelMatrix.multiplyRight(rotationY);
      break;
    case 'X':
      const rotationX = new Matrix4().rotateY(-Math.PI / 2);
      modelMatrix = modelMatrix.multiplyRight(rotationX);
      break;
    default:
      break;
  }

  // Scale/offset positions if normalized integers
  if (tile.isQuantized) {
    modelMatrix.translate(tile.quantizedVolumeOffset).scale(tile.quantizedVolumeScale);
  }

  // Option 1: Cartesian matrix and origin
  const cartesianOrigin = new Vector3(center);

  tile.cartesianModelMatrix = modelMatrix;
  tile.cartesianOrigin = cartesianOrigin;

  // Option 2: Cartographic matrix and origin
  const cartographicOrigin = Ellipsoid.WGS84.cartesianToCartographic(
    cartesianOrigin,
    new Vector3()
  );
  const fromFixedFrameMatrix = Ellipsoid.WGS84.eastNorthUpToFixedFrame(cartesianOrigin);
  const toFixedFrameMatrix = fromFixedFrameMatrix.invert();

  tile.cartographicModelMatrix = toFixedFrameMatrix.multiplyRight(modelMatrix);
  tile.cartographicOrigin = cartographicOrigin;

  // Absorb glTF root node matrix into model matrices for Float32 precision.
  // The glTF root node matrix (applied as sceneModelMatrix in the shader) may contain
  // ECEF-scale translations (~millions of meters). When both cartographicModelMatrix
  // and sceneModelMatrix are applied in the Float32 GPU shader, catastrophic cancellation
  // occurs causing visible seams between adjacent tiles. By combining them here in Float64,
  // the result has small ENU-scale values that preserve precision.
  const rootNode = _getRootNode(tile);
  if (rootNode) {
    tile.cartesianModelMatrix = new Matrix4(modelMatrix).multiplyRight(rootNode.matrix);
    tile.cartographicModelMatrix.multiplyRight(rootNode.matrix);
    rootNode.matrix = Matrix4.IDENTITY;
  }

  // Deprecated, drop
  if (!tile.coordinateSystem) {
    tile.modelMatrix = tile.cartographicModelMatrix;
  }
}

const TRANSLATION_LIMIT_SQUARED = 10e5 ** 2; // 100km

/**
 * Returns the glTF root node if it has a matrix with earth-scale translations (> 100km).
 * These large translations cause Float32 precision issues when applied in the GPU shader.
 */
function _getRootNode(tile: Tile3D['content']): {matrix: number[]} | null {
  const gltf = tile.gltf;
  if (!gltf) {
    return null;
  }

  const sceneIndex = typeof gltf.scene === 'number' ? gltf.scene : 0;
  const scene = gltf.scenes?.[sceneIndex];
  const rootNode = scene?.nodes?.[0];
  if (!rootNode?.matrix) return null;

  // Extract translation and compare magnitude (meters) to limit
  const m = rootNode.matrix;
  const translationMagnitude = m[12] * m[12] + m[13] * m[13] + m[14] * m[14];
  if (translationMagnitude <= TRANSLATION_LIMIT_SQUARED) return null;

  return rootNode;
}
