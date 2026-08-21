// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {MeshAttribute, MeshAttributes, MeshArrowTable} from '@loaders.gl/schema';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import type {GLTFAccessor, GLTFMeshPrimitive, GLTFNode} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import {getTypedArrayForAccessor} from '../gltf-utils/get-typed-array';
import {getSizeFromAccessorType} from '../gltf-utils/gltf-constants';

/** A mesh primitive projected from a glTF scene into a Mesh Arrow table. */
export type GLTFMeshArrowPrimitive = {
  /** Arrow table containing the primitive's vertex attributes and optional indices. */
  table: MeshArrowTable;
  /** Source-compatible attribute descriptors, including normalized and stride metadata. */
  attributes: MeshAttributes;
  /** World transform of the node that instantiates the primitive. */
  worldMatrix: Matrix4;
  /** Index of the source node. */
  nodeIndex: number;
  /** Node indices from the selected scene root through the source node. */
  nodePath: number[];
  /** Index of the source mesh. */
  meshIndex: number;
  /** Index of the primitive within the source mesh. */
  primitiveIndex: number;
  /** Index of the primitive material, when specified. */
  materialIndex?: number;
};

/**
 * Project the default glTF scene into one Mesh Arrow table per mesh primitive.
 *
 * This projection preserves source vertex attribute views for dense, non-interleaved accessors.
 * It does not bake node transforms, apply skinning or morph targets, or flatten GPU instancing.
 * Those scene-level concerns remain represented by the returned primitive metadata and source glTF.
 * @param gltf Parsed glTF data with resolved binary buffers.
 * @returns Mesh Arrow primitives in default-scene traversal order.
 */
export function extractGLTFMeshArrowPrimitives(gltf: GLTFWithBuffers): GLTFMeshArrowPrimitive[] {
  const rootNodeIndices = getRootNodeIndices(gltf);
  const primitives: GLTFMeshArrowPrimitive[] = [];

  for (const rootNodeIndex of rootNodeIndices) {
    visitNode(gltf, rootNodeIndex, new Matrix4(), [], primitives);
  }

  return primitives;
}

/** Visit a node and append each of its mesh primitives to the projection result. */
function visitNode(
  gltf: GLTFWithBuffers,
  nodeIndex: number,
  parentWorldMatrix: Matrix4,
  parentNodePath: number[],
  primitives: GLTFMeshArrowPrimitive[]
): void {
  if (parentNodePath.includes(nodeIndex)) {
    throw new Error(`glTF node hierarchy contains a cycle at node ${nodeIndex}`);
  }

  const node = gltf.json.nodes?.[nodeIndex];
  if (!node) {
    throw new Error(`glTF scene references missing node ${nodeIndex}`);
  }

  const nodePath = [...parentNodePath, nodeIndex];
  const worldMatrix = new Matrix4(parentWorldMatrix).multiplyRight(getNodeMatrix(node));

  if (node.mesh !== undefined) {
    const mesh = gltf.json.meshes?.[node.mesh];
    if (!mesh) {
      throw new Error(`glTF node ${nodeIndex} references missing mesh ${node.mesh}`);
    }

    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const {table, attributes} = convertGLTFPrimitiveToMeshArrowTable(gltf, primitive);
      primitives.push({
        table,
        attributes,
        worldMatrix,
        nodeIndex,
        nodePath,
        meshIndex: node.mesh,
        primitiveIndex,
        materialIndex: primitive.material
      });
    }
  }

  for (const childNodeIndex of node.children || []) {
    visitNode(gltf, childNodeIndex, worldMatrix, nodePath, primitives);
  }
}

/** Get the selected scene roots, or infer roots when a glTF asset does not define scenes. */
function getRootNodeIndices(gltf: GLTFWithBuffers): number[] {
  const selectedScene = gltf.json.scenes?.[gltf.json.scene || 0];
  if (selectedScene) {
    return selectedScene.nodes || [];
  }

  const childNodeIndices = new Set(gltf.json.nodes?.flatMap(node => node.children || []));
  return (gltf.json.nodes || [])
    .map((_, nodeIndex) => nodeIndex)
    .filter(nodeIndex => !childNodeIndices.has(nodeIndex));
}

/** Get the local transform encoded by a glTF node. */
function getNodeMatrix(node: GLTFNode): Matrix4 {
  if (node.matrix) {
    return new Matrix4(node.matrix);
  }

  const rotationMatrix = new Matrix4().fromQuaternion(node.rotation || [0, 0, 0, 1]);
  return new Matrix4()
    .translate(node.translation || [0, 0, 0])
    .multiplyRight(rotationMatrix)
    .scale(node.scale || [1, 1, 1]);
}

/** Convert one glTF mesh primitive to its Mesh Arrow representation. */
function convertGLTFPrimitiveToMeshArrowTable(
  gltf: GLTFWithBuffers,
  primitive: GLTFMeshPrimitive
): {table: MeshArrowTable; attributes: MeshAttributes} {
  const attributes: MeshAttributes = {};

  for (const [attributeName, accessorIndex] of Object.entries(primitive.attributes)) {
    attributes[attributeName] = getMeshAttribute(gltf, accessorIndex);
  }

  const indices =
    primitive.indices === undefined ? undefined : getMeshAttribute(gltf, primitive.indices);
  const mode = primitive.mode || 4;

  return {
    table: makeMeshArrowTable(attributes, {topology: getMeshTopology(mode), mode, indices}),
    attributes
  };
}

/** Get a zero-copy Mesh attribute from a dense glTF accessor. */
function getMeshAttribute(gltf: GLTFWithBuffers, accessorIndex: number): MeshAttribute {
  const accessor = gltf.json.accessors?.[accessorIndex];
  if (!accessor) {
    throw new Error(`glTF primitive references missing accessor ${accessorIndex}`);
  }
  if (accessor.sparse) {
    throw new Error(
      `glTF accessor ${accessorIndex} is sparse and cannot be projected without materializing it`
    );
  }
  if (accessor.bufferView === undefined) {
    throw new Error(`glTF accessor ${accessorIndex} has no buffer view and cannot be projected`);
  }

  const bufferView = gltf.json.bufferViews?.[accessor.bufferView];
  if (!bufferView) {
    throw new Error(
      `glTF accessor ${accessorIndex} references missing buffer view ${accessor.bufferView}`
    );
  }

  const size = getSizeFromAccessorType(accessor.type);
  const elementByteLength = size * getAccessorComponentByteLength(accessor);
  if (bufferView.byteStride && bufferView.byteStride !== elementByteLength) {
    throw new Error(
      `glTF accessor ${accessorIndex} is interleaved and cannot be projected without materializing it`
    );
  }

  // Component byte-length validation above rejects the bigint component types that MeshAttribute excludes.
  const value = getTypedArrayForAccessor(
    gltf.json,
    gltf.buffers,
    accessor
  ) as MeshAttribute['value'];
  return {
    value,
    size,
    byteOffset: accessor.byteOffset,
    byteStride: bufferView.byteStride,
    normalized: accessor.normalized
  };
}

/** Return the component byte length for a glTF accessor. */
function getAccessorComponentByteLength(accessor: GLTFAccessor): number {
  switch (accessor.componentType) {
    case 5120:
    case 5121:
      return 1;
    case 5122:
    case 5123:
      return 2;
    case 5125:
    case 5126:
      return 4;
    default:
      throw new Error(
        `glTF accessor component type ${accessor.componentType} is not supported by Mesh Arrow`
      );
  }
}

/** Map the supported glTF primitive modes to Mesh Arrow topology names. */
function getMeshTopology(mode: number): MeshArrowTable['topology'] {
  switch (mode) {
    case 0:
      return 'point-list';
    case 4:
      return 'triangle-list';
    case 5:
      return 'triangle-strip';
    default:
      throw new Error(`glTF primitive mode ${mode} is not supported by Mesh Arrow`);
  }
}
