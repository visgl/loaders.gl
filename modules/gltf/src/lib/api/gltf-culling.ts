// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BoxShape, CapsuleShape, CylinderShape, PlaneShape, SphereShape} from '@math.gl/culling';
import type {ImplicitShape} from '@math.gl/culling';
import type {GLTFBoundingVolume, GLTFShape} from '../types/gltf-shape-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import {Matrix4} from '@math.gl/core';

/** Options for resolving a glTF 2.1 shape. */
export type GLTFCullingShapeOptions = {
  /** Optional transform applied after the shape's own local transform. */
  matrix?: readonly number[];
};

/** Resolve a draft glTF 2.1 shape into the corresponding math.gl analytic shape. */
export function getGLTFCullingShape(
  gltf: GLTFWithBuffers,
  shapeIndex: number,
  options: GLTFCullingShapeOptions = {}
): ImplicitShape | undefined {
  const shape = gltf.json.shapes?.[shapeIndex] as GLTFShape | undefined;
  if (!shape) throw new Error(`Invalid glTF shape reference: /shapes/${shapeIndex}`);

  switch (shape.type) {
    case 'box':
      return new BoxShape({size: shape.box?.size, matrix: options.matrix});
    case 'capsule':
      return new CapsuleShape({...shape.capsule, matrix: options.matrix});
    case 'cylinder':
      return new CylinderShape({...shape.cylinder, matrix: options.matrix});
    case 'plane':
      return new PlaneShape({...shape.plane, matrix: options.matrix});
    case 'sphere':
      return new SphereShape({...shape.sphere, matrix: options.matrix});
    default:
      return undefined;
  }
}

/** Resolve a node's draft glTF 2.1 bounding volume, including its local matrix. */
export function getGLTFNodeCullingShape(
  gltf: GLTFWithBuffers,
  nodeIndex: number,
  options: GLTFCullingShapeOptions = {}
): ImplicitShape | undefined {
  const node = gltf.json.nodes?.[nodeIndex];
  if (!node) throw new Error(`Invalid glTF node reference: /nodes/${nodeIndex}`);
  const boundingVolume = node.boundingVolume as GLTFBoundingVolume | undefined;
  if (!boundingVolume) return undefined;
  const shape = getGLTFCullingShape(gltf, boundingVolume.shape, {
    matrix: getBoundingVolumeMatrix(boundingVolume)
  });
  if (shape && options.matrix) shape.transform(options.matrix);
  return shape;
}

/** Compose a bounding-volume matrix from its matrix or TRS representation. */
function getBoundingVolumeMatrix(
  boundingVolume: GLTFBoundingVolume
): readonly number[] | undefined {
  if (boundingVolume.matrix) {
    return boundingVolume.matrix;
  }
  if (!boundingVolume.translation && !boundingVolume.rotation && !boundingVolume.scale) {
    return undefined;
  }
  const rotationMatrix = new Matrix4().fromQuaternion(boundingVolume.rotation || [0, 0, 0, 1]);
  return new Matrix4()
    .translate(boundingVolume.translation || [0, 0, 0])
    .multiplyRight(rotationMatrix)
    .scale(boundingVolume.scale || [1, 1, 1]);
}
