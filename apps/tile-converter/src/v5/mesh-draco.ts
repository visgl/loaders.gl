// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DracoLoader, type DracoMesh} from '@loaders.gl/scene/draco';
import {DracoWriter} from '@loaders.gl/scene/draco/bundled';
import {hasSameDracoMeshTriangles} from '@loaders.gl/scene/api';
import type {GLTFAccessor} from '@loaders.gl/scene/gltf';
import type {MeshGeometry} from '@loaders.gl/core/schema';
import type {LoadLibraryOptions} from '@loaders.gl/core/worker-utils';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import {
  createMeshTileScenegraph,
  finalizeMeshTileScenegraph,
  type MeshTileOptions,
  validateMeshGeometry
} from './mesh.js';

import {hasSameDracoPositions} from './mesh-draco-positions.js';
import {prepareMeshFeatureGeometry, encodeMeshFeatures} from './mesh-features.js';

const DRACO_EXTENSION = 'KHR_draco_mesh_compression';

/** Encodes the validated single-mesh profile with lossless Edge Breaker and no raw fallback. */
export async function encodeDracoMeshTile(
  geometry: MeshGeometry,
  options: MeshTileOptions,
  libraryOptions: LoadLibraryOptions = {}
): Promise<ReturnType<typeof finalizeMeshTileScenegraph>> {
  geometry = prepareMeshFeatureGeometry(validateMeshGeometry(geometry), options.features);
  // Draco requires explicit faces even when the input triangle list is non-indexed.
  if (!geometry.indices) {
    geometry.indices = {
      size: 1,
      value: Uint32Array.from(
        {length: geometry.attributes.POSITION.value.length / 3},
        (_, index) => index
      )
    };
  }
  const {modules, useLocalLibraries, CDN: contentDeliveryNetwork} = libraryOptions;
  const runtimeOptions = {modules, core: {useLocalLibraries, CDN: contentDeliveryNetwork}};
  const {scenegraph, materialIndex} = createMeshTileScenegraph(options, geometry);
  const encoded = await DracoWriter.encodeGeometry(geometry, {
    ...runtimeOptions,
    draco: {method: 'MESH_EDGEBREAKER_ENCODING'}
  });
  const loaderOptions = {...runtimeOptions, draco: {shape: 'mesh' as const}};
  const loader = await DracoLoader.preload('', loaderOptions);
  const decoded = (await loader.parse!(encoded.data, loaderOptions)) as DracoMesh;
  const positions = decoded.attributes.POSITION.value;
  if (
    !(positions instanceof Float32Array) ||
    positions.length !== encoded.report.pointCount * 3 ||
    encoded.report.pointCount === 0 ||
    !decoded.indices ||
    decoded.indices.value.length !== encoded.report.faceCount * 3 ||
    encoded.report.faceCount * 3 !==
      (geometry.indices?.value.length ?? geometry.attributes.POSITION.value.length / 3)
  ) {
    throw new TileConversionError(
      'MESH_DRACO_ENCODING_INVALID',
      'Draco must preserve the triangle count and emit finite positions'
    );
  }
  // Lossy quantization is deliberately unavailable in this initial profile.
  const inputPositions = geometry.attributes.POSITION.value as Float32Array;
  if (!hasSameDracoPositions(inputPositions, positions)) {
    throw new TileConversionError(
      'MESH_DRACO_POSITION_CHANGED',
      'Lossless Draco must preserve the encoded Float32 positions'
    );
  }
  const attributeNames = Object.keys(geometry.attributes);
  if (
    attributeNames.length !== Object.keys(decoded.attributes).length ||
    !hasSameDracoMeshTriangles(
      geometry.attributes,
      geometry.indices.value,
      decoded.attributes,
      decoded.indices.value,
      attributeNames
    )
  ) {
    throw new TileConversionError(
      'MESH_DRACO_ATTRIBUTE_CHANGED',
      'Lossless Draco must preserve oriented triangles and every attribute, including feature ownership'
    );
  }
  const bufferView = scenegraph.addBufferView(encoded.data);
  const attributes: Record<string, number> = {};
  const attributeIdentifiers: Record<string, number> = {};
  scenegraph.json.accessors = [];
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const decodedAttribute = decoded.attributes[name];
    if (
      !decodedAttribute ||
      decodedAttribute.value.length !== encoded.report.pointCount * attribute.size
    ) {
      throw new TileConversionError('MESH_DRACO_ENCODING_INVALID', `Draco must preserve ${name}`);
    }
    const accessor: GLTFAccessor = {
      componentType:
        attribute.value instanceof Uint8Array
          ? 5121
          : attribute.value instanceof Uint16Array
            ? 5123
            : attribute.value instanceof Uint32Array
              ? 5125
              : 5126,
      count: encoded.report.pointCount,
      type:
        attribute.size === 1
          ? 'SCALAR'
          : attribute.size === 2
            ? 'VEC2'
            : attribute.size === 3
              ? 'VEC3'
              : 'VEC4',
      ...(attribute.normalized ? {normalized: true} : {})
    };
    if (name === 'POSITION') {
      const minimum = [Infinity, Infinity, Infinity];
      const maximum = [-Infinity, -Infinity, -Infinity];
      for (let index = 0; index < positions.length; index += 3) {
        for (let axis = 0; axis < 3; axis++) {
          const position = positions[index + axis];
          minimum[axis] = Math.min(minimum[axis], position);
          maximum[axis] = Math.max(maximum[axis], position);
        }
      }
      accessor.min = minimum;
      accessor.max = maximum;
    }
    attributes[name] = scenegraph.json.accessors.push(accessor) - 1;
    attributeIdentifiers[name] = encoded.report.attributes[name].id;
  }
  const indices =
    scenegraph.json.accessors.push({
      componentType: decoded.indices.value instanceof Uint16Array ? 5123 : 5125,
      count: encoded.report.faceCount * 3,
      type: 'SCALAR'
    }) - 1;
  scenegraph.json.meshes = [
    {
      primitives: [
        {
          attributes,
          indices,
          mode: 4,
          ...(materialIndex === undefined ? {} : {material: materialIndex}),
          extensions: {[DRACO_EXTENSION]: {bufferView, attributes: attributeIdentifiers}}
        }
      ]
    }
  ];
  encodeMeshFeatures(scenegraph, 0, options.features);
  scenegraph.registerRequiredExtension(DRACO_EXTENSION);
  return finalizeMeshTileScenegraph(scenegraph, 0);
}
