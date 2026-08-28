// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {MeshAttribute, MeshAttributes, MeshArrowTable} from '@loaders.gl/schema';
import {deduceMeshSchema, makeMeshArrowTable} from '@loaders.gl/schema-utils';
import type {GLTFAccessor, GLTFMeshPrimitive, GLTFNode} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import {getTypedArrayForAccessor} from '../gltf-utils/get-typed-array';
import {getSizeFromAccessorType} from '../gltf-utils/gltf-constants';

/** Controls whether accessors requiring packed storage may be materialized. */
export type GLTFMeshArrowOptions = {
  /** Accessor layout policy. Defaults to materializing exact logical values when necessary. */
  accessorLayout?: 'materialize' | 'zero-copy-only';
};

/** A glTF scene projected into reusable Mesh Arrow geometry and separate scene placements. */
export type GLTFMeshArrow = {
  /** Unique source mesh primitives, each represented by one Mesh Arrow table. */
  geometries: GLTFMeshArrowGeometry[];
  /** Scene occurrences that place reusable geometries at glTF nodes. */
  placements: GLTFMeshArrowPlacement[];
};

/** One unique source glTF mesh primitive represented as Mesh Arrow geometry. */
export type GLTFMeshArrowGeometry = {
  /** Arrow table containing vertex attributes and the optional row-0 index list. */
  table: MeshArrowTable;
  /** Source-compatible attribute descriptors, including normalization metadata. */
  attributes: MeshAttributes;
  /** Index of the source mesh. */
  meshIndex: number;
  /** Index of the primitive within the source mesh. */
  primitiveIndex: number;
  /** Index of the primitive material, when specified. */
  materialIndex?: number;
  /** Whether any accessor required packed allocation rather than borrowing source storage. */
  materialized: boolean;
};

/** Placement of one reusable Mesh Arrow geometry in the selected glTF scene. */
export type GLTFMeshArrowPlacement = {
  /** Index into the result's geometries array. */
  geometryIndex: number;
  /** World transform of the node instantiating the geometry. */
  worldMatrix: Matrix4;
  /** Index of the source node. */
  nodeIndex: number;
  /** Node indices from the selected scene root through the source node. */
  nodePath: number[];
};

type ConversionState = {
  gltf: GLTFWithBuffers;
  options: Required<GLTFMeshArrowOptions>;
  geometries: GLTFMeshArrowGeometry[];
  placements: GLTFMeshArrowPlacement[];
  geometryIndices: Map<string, number>;
};

type MeshAttributeResult = {
  attribute: MeshAttribute;
  materialized: boolean;
};

type MeshTypedArrayConstructor = {
  readonly BYTES_PER_ELEMENT: number;
  new (length: number): MeshAttribute['value'];
  new (buffer: ArrayBuffer, byteOffset: number, length: number): MeshAttribute['value'];
};

/**
 * Convert the selected glTF scene to reusable Mesh Arrow geometries and placements.
 *
 * Dense packed accessors borrow their original storage. Interleaved, sparse, and implicit-zero
 * accessors are materialized without changing component types, normalization, indexing, node
 * transforms, or primitive reuse. The input glTF and its buffers are never modified.
 * @param gltf Parsed glTF data with resolved binary buffers.
 * @param options Accessor materialization policy.
 * @returns Reusable geometries and their scene placements.
 */
export function convertGLTFToMeshArrow(
  gltf: GLTFWithBuffers,
  options: GLTFMeshArrowOptions = {}
): GLTFMeshArrow {
  const state: ConversionState = {
    gltf,
    options: {accessorLayout: options.accessorLayout || 'materialize'},
    geometries: [],
    placements: [],
    geometryIndices: new Map()
  };

  for (const rootNodeIndex of getRootNodeIndices(gltf)) {
    visitNode(state, rootNodeIndex, new Matrix4(), []);
  }

  return {geometries: state.geometries, placements: state.placements};
}

/** Visit a node and append placements for each of its mesh primitives. */
function visitNode(
  state: ConversionState,
  nodeIndex: number,
  parentWorldMatrix: Matrix4,
  parentNodePath: number[]
): void {
  if (parentNodePath.includes(nodeIndex)) {
    throw new Error(`glTF node hierarchy contains a cycle at node ${nodeIndex}`);
  }

  const node = state.gltf.json.nodes?.[nodeIndex];
  if (!node) {
    throw new Error(`glTF scene references missing node ${nodeIndex}`);
  }

  const nodePath = [...parentNodePath, nodeIndex];
  const worldMatrix = new Matrix4(parentWorldMatrix).multiplyRight(getNodeMatrix(node));

  if (node.mesh !== undefined) {
    const mesh = state.gltf.json.meshes?.[node.mesh];
    if (!mesh) {
      throw new Error(`glTF node ${nodeIndex} references missing mesh ${node.mesh}`);
    }

    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const geometryIndex = getOrCreateGeometry(state, node.mesh, primitiveIndex, primitive);
      state.placements.push({geometryIndex, worldMatrix, nodeIndex, nodePath});
    }
  }

  for (const childNodeIndex of node.children || []) {
    visitNode(state, childNodeIndex, worldMatrix, nodePath);
  }
}

/** Get or create the unique geometry for one source mesh primitive. */
function getOrCreateGeometry(
  state: ConversionState,
  meshIndex: number,
  primitiveIndex: number,
  primitive: GLTFMeshPrimitive
): number {
  const key = `${meshIndex}:${primitiveIndex}`;
  const existingIndex = state.geometryIndices.get(key);
  if (existingIndex !== undefined) {
    return existingIndex;
  }

  const geometry = convertGLTFPrimitiveToMeshArrowGeometry(
    state.gltf,
    meshIndex,
    primitiveIndex,
    primitive,
    state.options
  );
  const geometryIndex = state.geometries.length;
  state.geometries.push(geometry);
  state.geometryIndices.set(key, geometryIndex);
  return geometryIndex;
}

/** Get the selected scene roots, or infer roots when a glTF asset does not define scenes. */
function getRootNodeIndices(gltf: GLTFWithBuffers): number[] {
  const selectedScene = gltf.json.scenes?.[gltf.json.scene ?? 0];
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

/** Convert one glTF mesh primitive to reusable Mesh Arrow geometry. */
function convertGLTFPrimitiveToMeshArrowGeometry(
  gltf: GLTFWithBuffers,
  meshIndex: number,
  primitiveIndex: number,
  primitive: GLTFMeshPrimitive,
  options: Required<GLTFMeshArrowOptions>
): GLTFMeshArrowGeometry {
  const attributes: MeshAttributes = {};
  let materialized = false;

  for (const [attributeName, accessorIndex] of Object.entries(primitive.attributes)) {
    const result = getMeshAttribute(gltf, accessorIndex, options);
    attributes[attributeName] = result.attribute;
    materialized ||= result.materialized;
  }

  const indexResult =
    primitive.indices === undefined
      ? undefined
      : getMeshAttribute(gltf, primitive.indices, options);
  materialized ||= indexResult?.materialized || false;
  const mode = primitive.mode ?? 4;

  return {
    table: makeMeshArrowTable(attributes, {
      schema: deduceMeshSchema(attributes),
      topology: getMeshTopology(mode),
      mode,
      indices: indexResult?.attribute
    }),
    attributes,
    meshIndex,
    primitiveIndex,
    materialIndex: primitive.material,
    materialized
  };
}

/** Get an exact-value Mesh attribute, borrowing packed storage where possible. */
function getMeshAttribute(
  gltf: GLTFWithBuffers,
  accessorIndex: number,
  options: Required<GLTFMeshArrowOptions>
): MeshAttributeResult {
  const accessor = gltf.json.accessors?.[accessorIndex];
  if (!accessor) {
    throw new Error(`glTF primitive references missing accessor ${accessorIndex}`);
  }

  const size = getSizeFromAccessorType(accessor.type);
  const ArrayType = getMeshTypedArrayConstructor(accessor.componentType);
  const elementByteLength = size * ArrayType.BYTES_PER_ELEMENT;
  const bufferView =
    accessor.bufferView === undefined ? undefined : gltf.json.bufferViews?.[accessor.bufferView];
  if (accessor.bufferView !== undefined && !bufferView) {
    throw new Error(
      `glTF accessor ${accessorIndex} references missing buffer view ${accessor.bufferView}`
    );
  }

  const isInterleaved = Boolean(
    bufferView?.byteStride && bufferView.byteStride !== elementByteLength
  );
  const requiresMaterialization = !bufferView || isInterleaved || Boolean(accessor.sparse);
  if (requiresMaterialization && options.accessorLayout === 'zero-copy-only') {
    const reason = accessor.sparse ? 'sparse' : isInterleaved ? 'interleaved' : 'implicit-zero';
    throw new Error(
      `glTF accessor ${accessorIndex} is ${reason} and cannot be projected without materializing it`
    );
  }

  let value = bufferView
    ? (getTypedArrayForAccessor(gltf.json, gltf.buffers, accessor) as MeshAttribute['value'])
    : new ArrayType(accessor.count * size);

  if (accessor.sparse) {
    const materializedValue = new ArrayType(value.length);
    materializedValue.set(value);
    applySparseAccessor(gltf, accessorIndex, accessor, materializedValue, size);
    value = materializedValue;
  }

  const attribute: MeshAttribute = {value, size};
  if (!requiresMaterialization) {
    if (accessor.byteOffset !== undefined) {
      attribute.byteOffset = accessor.byteOffset;
    }
    if (bufferView?.byteStride !== undefined) {
      attribute.byteStride = bufferView.byteStride;
    }
  }
  if (accessor.normalized !== undefined) {
    attribute.normalized = accessor.normalized;
  }

  return {
    attribute,
    materialized: requiresMaterialization
  };
}

/** Apply sparse substitutions to an independently allocated accessor value. */
function applySparseAccessor(
  gltf: GLTFWithBuffers,
  accessorIndex: number,
  accessor: GLTFAccessor,
  value: MeshAttribute['value'],
  size: number
): void {
  const sparse = accessor.sparse!;
  const sparseIndices = getBufferViewValues(
    gltf,
    sparse.indices.bufferView,
    sparse.indices.byteOffset || 0,
    sparse.indices.componentType,
    sparse.count,
    `glTF accessor ${accessorIndex} sparse indices`
  );
  const sparseValues = getBufferViewValues(
    gltf,
    sparse.values.bufferView,
    sparse.values.byteOffset || 0,
    accessor.componentType,
    sparse.count * size,
    `glTF accessor ${accessorIndex} sparse values`
  );

  for (let sparseIndex = 0; sparseIndex < sparse.count; sparseIndex++) {
    const accessorElementIndex = Number(sparseIndices[sparseIndex]);
    if (
      !Number.isInteger(accessorElementIndex) ||
      accessorElementIndex < 0 ||
      accessorElementIndex >= accessor.count
    ) {
      throw new Error(`glTF accessor ${accessorIndex} sparse index is out of bounds`);
    }
    for (let componentIndex = 0; componentIndex < size; componentIndex++) {
      value[accessorElementIndex * size + componentIndex] =
        sparseValues[sparseIndex * size + componentIndex];
    }
  }
}

/** Get tightly packed typed values from a glTF buffer view. */
function getBufferViewValues(
  gltf: GLTFWithBuffers,
  bufferViewIndex: number,
  localByteOffset: number,
  componentType: number,
  count: number,
  path: string
): MeshAttribute['value'] {
  const bufferView = gltf.json.bufferViews?.[bufferViewIndex];
  if (!bufferView) {
    throw new Error(`${path} reference missing buffer view ${bufferViewIndex}`);
  }
  const buffer = gltf.buffers[bufferView.buffer];
  if (!buffer) {
    throw new Error(`${path} reference missing buffer ${bufferView.buffer}`);
  }
  const ArrayType = getMeshTypedArrayConstructor(componentType);
  const byteLength = count * ArrayType.BYTES_PER_ELEMENT;
  if (localByteOffset + byteLength > bufferView.byteLength) {
    throw new Error(`${path} exceed buffer view ${bufferViewIndex}`);
  }
  const byteOffset = buffer.byteOffset + (bufferView.byteOffset || 0) + localByteOffset;
  return new ArrayType(buffer.arrayBuffer, byteOffset, count);
}

/** Return the numeric typed-array constructor for a Mesh Arrow accessor component type. */
function getMeshTypedArrayConstructor(componentType: number): MeshTypedArrayConstructor {
  switch (componentType) {
    case 5120:
      return Int8Array;
    case 5121:
      return Uint8Array;
    case 5122:
      return Int16Array;
    case 5123:
      return Uint16Array;
    case 5124:
      return Int32Array;
    case 5125:
      return Uint32Array;
    case 5126:
      return Float32Array;
    case 5130:
      return Float64Array;
    default:
      throw new Error(
        `glTF accessor component type ${componentType} is not supported by Mesh Arrow`
      );
  }
}

/** Map the supported glTF primitive modes to Mesh Arrow topology names. */
function getMeshTopology(mode: number): MeshArrowTable['topology'] {
  switch (mode) {
    case 0:
      return 'point-list';
    case 1:
      return 'line-list';
    case 3:
      return 'line-strip';
    case 2:
      return 'line-loop';
    case 4:
      return 'triangle-list';
    case 5:
      return 'triangle-strip';
    case 6:
      return 'triangle-fan';
    default:
      throw new Error(`glTF primitive mode ${mode} is not supported by Mesh Arrow`);
  }
}
