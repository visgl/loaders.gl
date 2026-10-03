// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';
import type {MeshAttribute, MeshGeometry} from '@loaders.gl/schema';
import {TileConversionError} from './conversion-api.js';

/**
 * Encodes one untextured triangle mesh as a self-contained glTF 2.0 GLB resource.
 *
 * POSITION and optional NORMAL must contain packed finite Float32 xyz triples. Normals must have
 * unit length within 0.0001. Optional indices use packed unsigned 8-, 16-, or 32-bit values.
 * Unsupported attributes, layouts, and encoded transforms fail rather than being discarded.
 * Coordinates are preserved: callers own CRS conversion, local origins, placement, materials,
 * feature mappings, and tileset packaging. Input arrays are never modified.
 *
 * @param mesh - Triangle-list geometry in the caller's selected local coordinate frame.
 * @returns An embedded-buffer GLB containing one mesh, node, and default scene.
 */
export function encodeMeshTile(mesh: MeshGeometry): ArrayBuffer {
  const geometry = validateMeshGeometry(mesh);
  const scenegraph = new GLTFScenegraph({json: {asset: {version: '2.0', generator: 'loaders.gl'}}});
  const meshIndex = scenegraph.addMesh({
    attributes: geometry.attributes,
    indices: geometry.indices?.value,
    mode: 4
  });
  const nodeIndex = scenegraph.addNode({meshIndex});
  const sceneIndex = scenegraph.addScene({nodeIndices: [nodeIndex]});
  scenegraph.setDefaultScene(sceneIndex);
  scenegraph.createBinaryChunk();
  return GLTFWriter.encodeSync!(scenegraph.gltf);
}

/** Validates the shared mesh profile; spatial preparation may retain Float64 positions internally. */
export function validateMeshGeometry(
  mesh: MeshGeometry,
  allowFloat64Positions = false
): MeshGeometry {
  if (mesh.topology !== 'triangle-list' || mesh.mode !== 4) {
    throw new TileConversionError(
      'MESH_TOPOLOGY_UNSUPPORTED',
      'Only triangle-list mode 4 is supported'
    );
  }
  for (const name of Object.keys(mesh.attributes)) {
    if (name !== 'POSITION' && name !== 'NORMAL') {
      throw new TileConversionError(
        'MESH_ATTRIBUTE_UNSUPPORTED',
        `Mesh attribute ${name} is unsupported`
      );
    }
  }
  const positions = getFloatAttribute(mesh.attributes.POSITION, 'POSITION', allowFloat64Positions);
  const attributes: Record<string, {value: Float32Array | Float64Array; size: number}> = {
    POSITION: {value: positions, size: 3}
  };
  if (mesh.attributes.NORMAL) {
    const normals = getFloatAttribute(mesh.attributes.NORMAL, 'NORMAL');
    if (normals.length !== positions.length) {
      throw new TileConversionError(
        'MESH_NORMAL_COUNT_MISMATCH',
        'NORMAL count must match POSITION count'
      );
    }
    for (let index = 0; index < normals.length; index += 3) {
      if (
        Math.abs(Math.hypot(normals[index], normals[index + 1], normals[index + 2]) - 1) > 0.0001
      ) {
        throw new TileConversionError(
          'MESH_NORMAL_INVALID',
          'NORMAL vectors must have unit length'
        );
      }
    }
    attributes.NORMAL = {value: normals, size: 3};
  }
  const indices = getMeshIndices(mesh.indices, positions.length / 3);
  if (!indices && positions.length % 9 !== 0) {
    throw new TileConversionError(
      'MESH_TRIANGLE_COUNT_INVALID',
      'Nonindexed meshes require complete triangles'
    );
  }
  return {
    topology: 'triangle-list',
    mode: 4,
    attributes,
    indices: indices ? {value: indices, size: 1} : undefined
  };
}

/** Reads one finite packed xyz attribute without changing its storage. */
function getFloatAttribute(
  attribute: MeshAttribute | undefined,
  name: string,
  allowFloat64 = false
): Float32Array | Float64Array {
  if (
    !attribute ||
    !(
      attribute.value instanceof Float32Array ||
      (allowFloat64 && attribute.value instanceof Float64Array)
    ) ||
    attribute.size !== 3 ||
    attribute.value.length === 0 ||
    attribute.value.length % 3 !== 0
  ) {
    throw new TileConversionError(
      'MESH_ATTRIBUTE_INVALID',
      `${name} must contain packed ${allowFloat64 ? 'Float32 or Float64' : 'Float32'} xyz triples`
    );
  }
  validateAttributeLayout(attribute, name);
  if (attribute.value.some(value => !Number.isFinite(value))) {
    throw new TileConversionError('MESH_ATTRIBUTE_NONFINITE', `${name} must contain finite values`);
  }
  return attribute.value;
}

/** Reads optional packed triangle indices and checks glTF range and primitive-restart rules. */
function getMeshIndices(
  attribute: MeshAttribute | undefined,
  vertexCount: number
): Uint8Array | Uint16Array | Uint32Array | undefined {
  if (!attribute) return undefined;
  validateAttributeLayout(attribute, 'indices');
  const values = attribute.value;
  if (
    attribute.size !== 1 ||
    !(
      values instanceof Uint8Array ||
      values instanceof Uint16Array ||
      values instanceof Uint32Array
    )
  ) {
    throw new TileConversionError(
      'MESH_INDICES_INVALID',
      'Indices must contain packed unsigned integer scalars'
    );
  }
  if (values.length === 0 || values.length % 3 !== 0) {
    throw new TileConversionError(
      'MESH_TRIANGLE_COUNT_INVALID',
      'Indices must contain complete triangles'
    );
  }
  const restartIndex = 2 ** (values.BYTES_PER_ELEMENT * 8) - 1;
  if (values.some(value => value >= vertexCount || value === restartIndex)) {
    throw new TileConversionError(
      'MESH_INDEX_OUT_OF_RANGE',
      'Indices must reference existing vertices and exclude primitive-restart values'
    );
  }
  return values;
}

/** Rejects descriptor layouts and transforms the initial mesh profile cannot represent. */
function validateAttributeLayout(attribute: MeshAttribute, name: string): void {
  if (
    (attribute.byteOffset ?? 0) !== 0 ||
    (attribute.byteStride ?? 0) !== 0 ||
    attribute.normalized ||
    attribute.transform ||
    attribute.componentType
  ) {
    throw new TileConversionError(
      'MESH_ATTRIBUTE_LAYOUT_UNSUPPORTED',
      `${name} must use packed, unnormalized contiguous storage`
    );
  }
}
