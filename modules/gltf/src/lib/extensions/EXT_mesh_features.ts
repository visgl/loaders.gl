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
