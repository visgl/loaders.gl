// GLTF EXTENSION: EXT_mesh_features
// https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features
/* eslint-disable camelcase */
import type {NumericArray} from '@loaders.gl/loader-utils';
import type {GLTF, GLTFMeshPrimitive} from '../types/gltf-json-schema';
import {GLTFLoaderOptions} from '../../gltf-loader';
import type {
  GLTF_EXT_mesh_features,
  GLTF_EXT_mesh_features_featureId
} from '../types/gltf-ext-mesh-features-schema';

import {GLTFScenegraph} from '../api/gltf-scenegraph';
import {getPrimitiveTextureData} from './utils/3d-tiles-utils';
import {getComponentTypeFromArray} from '../gltf-utils/gltf-utils';
import type {TypedArray} from '@loaders.gl/schema';

const EXT_MESH_FEATURES_NAME = 'EXT_mesh_features';
export const name = EXT_MESH_FEATURES_NAME;

export async function decode(gltfData: {json: GLTF}, options: GLTFLoaderOptions): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  decodeExtMeshFeatures(scenegraph, options);
}

/**
 * Decodes feature metadata from extension.
 * @param {GLTFScenegraph} scenegraph - Instance of the class for structured access to GLTF data.
 * @param {GLTFLoaderOptions} options - GLTFLoader options.
 */
function decodeExtMeshFeatures(scenegraph: GLTFScenegraph, options: GLTFLoaderOptions): void {
  const json = scenegraph.gltf.json;
  if (!json.meshes) {
    return;
  }

  // Iterate through all meshes/primitives.
  for (const mesh of json.meshes) {
    for (const primitive of mesh.primitives) {
      processMeshPrimitiveFeatures(scenegraph, primitive, options);
    }
  }
}

/**
 * Takes data from EXT_mesh_features and store it in 'data' property of featureIds.
 * If combined with EXT_structural_metadata, corresponding data are taken from the property tables of that extension.
 * @param {GLTFScenegraph} scenegraph - Instance of the class for structured access to GLTF data.
 * @param {GLTFMeshPrimitive} primitive - Primitive that contains extensions.
 * @param {GLTFLoaderOptions} options - GLTFLoader options.
 */
function processMeshPrimitiveFeatures(
  scenegraph: GLTFScenegraph,
  primitive: GLTFMeshPrimitive,
  options: GLTFLoaderOptions
): void {
  // Processing of mesh primitive features requires buffers to be loaded.
  if (!options?.gltf?.loadBuffers) {
    return;
  }

  const extension = primitive.extensions?.[EXT_MESH_FEATURES_NAME] as GLTF_EXT_mesh_features;
  const featureIds: GLTF_EXT_mesh_features_featureId[] = extension?.featureIds;

  if (!featureIds) {
    return;
  }

  for (const featureId of featureIds) {
    let featureIdData: NumericArray;
    // Process "Feature ID by Vertex"
    if (typeof featureId.attribute !== 'undefined') {
      const accessorKey = `_FEATURE_ID_${featureId.attribute}`;
      const accessorIndex = primitive.attributes[accessorKey];
      featureIdData = scenegraph.getTypedArrayForAccessor(accessorIndex);
    }

    // Process "Feature ID by Texture Coordinates"
    else if (typeof featureId.texture !== 'undefined' && options?.gltf?.loadImages) {
      featureIdData = getPrimitiveTextureData(scenegraph, featureId.texture, primitive);
    }

    // Process "Feature ID by Index"
    else {
      /*
      When both featureId.attribute and featureId.texture are undefined,
      then the feature ID value for each vertex is given implicitly, via the index of the vertex.
      In this case, the featureCount must match the number of vertices of the mesh primitive.
      */
      // TODO: At the moment of writing we don't have a tileset with the data of that kind. Implement it later.
      featureIdData = [];
    }

    featureId.data = featureIdData;
  }
}

/*
  Encoding data
*/

/**
 * Ecnodes a feature ID set to extension.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param featureIdArray - array of feature IDs.
 * @param meshIndex - index of the mesh comntaining the target primitive.
 * @param primitiveIndex - index of the primitive where the data encoded should be put.
 * @returns primitive updated
 * @see https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features
 */
export function encodeExtMeshFeatures(
  scenegraph: GLTFScenegraph,
  featureIdArray: number[] | TypedArray,
  meshIndex: number,
  primitiveIndex: number = 0
) {
  const meshes = scenegraph.gltf.json.meshes;
  if (!meshes) {
    return;
  }
  const primitive = meshes?.[meshIndex]?.primitives?.[primitiveIndex];
  if (!primitive) {
    return;
  }

  const {accessorKey, index} = createAccessorKey(primitive.attributes);

  if (!primitive.extensions) {
    primitive.extensions = {};
  }
  let extension = primitive.extensions[EXT_MESH_FEATURES_NAME] as GLTF_EXT_mesh_features;
  if (!extension) {
    extension = {featureIds: []};
    primitive.extensions[EXT_MESH_FEATURES_NAME] = extension;
  }

  const featureIds: GLTF_EXT_mesh_features_featureId[] = extension.featureIds;
  const featureId: GLTF_EXT_mesh_features_featureId = {
    featureCount: featureIdArray.length,
    attribute: index
  };
  featureIds.push(featureId);

  const typedArray = new Uint32Array(featureIdArray);
  const bufferIndex =
    scenegraph.gltf.buffers.push({
      arrayBuffer: typedArray.buffer,
      byteOffset: typedArray.byteOffset,
      byteLength: typedArray.byteLength
    }) - 1;
  const bufferViewIndex = scenegraph.addBufferView(typedArray, bufferIndex, 0);
  const accessorIndex = scenegraph.addAccessor(bufferViewIndex, {
    size: 1,
    componentType: getComponentTypeFromArray(typedArray),
    count: typedArray.length
  });
  primitive.attributes[accessorKey] = accessorIndex;

  scenegraph.addObjectExtension(primitive, EXT_MESH_FEATURES_NAME, extension);
  meshes[meshIndex].primitives[primitiveIndex] = primitive;
}

function createAccessorKey(attributes: {}) {
  const prefix = '_FEATURE_ID_';
  // Search for all "_FEATURE_ID_n" attribures in the primitive provided if any.
  // If there are some, e.g. "_FEATURE_ID_0", "_FEATURE_ID_1",
  // we will add a new one with the name "_FEATURE_ID_2"
  const attrs = Object.keys(attributes).filter((item) => item.indexOf(prefix) !== -1);
  let max = -1;
  for (const a of attrs) {
    const n = Number(a.substring(prefix.length));
    if (n > max) {
      max = n;
    }
  }
  max++;
  const accessorKey = `${prefix}${max}`;
  return {accessorKey, index: max};
}
