// GLTF EXTENSION: EXT_mesh_features
// https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features
/* eslint-disable camelcase */
import type {NumericArray} from '@loaders.gl/loader-utils';
import type {GLTF, GLTFMeshPrimitive} from '../types/gltf-json-schema';
import {GLTFLoaderOptions} from '../../gltf-loader';
import {GLTFWriterOptions} from '../../gltf-writer';
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

export function encode(gltfData: {json: GLTF}, options: GLTFWriterOptions): void {
  const scenegraph = new GLTFScenegraph(gltfData);
  encodeExtMeshFeatures(scenegraph, options);
}

/**
 * Decodes feature metadata from extension.
 * @param {GLTFScenegraph} scenegraph - Instance of the class for structured access to GLTF data.
 * @param {GLTFLoaderOptions} options - GLTFLoader options.
 */
export function decodeExtMeshFeatures(
  scenegraph: GLTFScenegraph,
  options: GLTFLoaderOptions
): void {
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

export function encodeExtMeshFeatures(scenegraph: GLTFScenegraph, options: GLTFWriterOptions) {
  const meshes = scenegraph.gltf.json.meshes;
  if (!meshes) {
    return;
  }

  // Iterate through all meshes/primitives.
  for (const mesh of meshes) {
    for (const primitive of mesh.primitives) {
      encodeExtMeshFeaturesForPrimitive(scenegraph, primitive);
    }
  }
}

/**
 * Creates ExtMeshFeatures, creates a featureId containing feature ids provided.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @primitive - target primitive instance that will contain the extension
 * @param featureIdArray - Array of feature id
 * @param propertyTableIndex - index of the property table created by the ExtStructuralMetadata (optional).
 */
export function createExtMeshFeatures(
  scenegraph: GLTFScenegraph,
  primitive: GLTFMeshPrimitive,
  featureIdArray: TypedArray,
  propertyTableIndex?: number
) {
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
    propertyTable: propertyTableIndex,
    data: featureIdArray
  };
  featureIds.push(featureId);

  scenegraph.addObjectExtension(primitive, EXT_MESH_FEATURES_NAME, extension);
}

/**
 * Encodes a feature ID set to extension.
 * @param scenegraph - Instance of the class for structured access to GLTF data.
 * @param primitive - Primitive that the data encoded belongs to.
 * @see https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features
 */
function encodeExtMeshFeaturesForPrimitive(
  scenegraph: GLTFScenegraph,
  primitive: GLTFMeshPrimitive
) {
  const extension = primitive.extensions?.[EXT_MESH_FEATURES_NAME] as GLTF_EXT_mesh_features;
  if (!extension) {
    return;
  }
  const featureIds: GLTF_EXT_mesh_features_featureId[] = extension.featureIds;
  for (const featureId of featureIds) {
    if (featureId.data) {
      const {accessorKey, index} = createAccessorKey(primitive.attributes);
      featureId.attribute = index;
      const typedArray = new Uint32Array(featureId.data as number[]);

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

      featureId.data = undefined; // Delete the data already encoded.
    }
  }
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
