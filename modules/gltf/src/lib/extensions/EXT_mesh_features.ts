/* eslint-disable camelcase */
import type {GLTF} from '../types/gltf-json-schema';
import {GLTFLoaderOptions} from '../../gltf-loader';
import type {
  GLTF_EXT_mesh_features,
  GLTF_EXT_mesh_features_featureId
} from '../types/gltf-ext-mesh-features-schema';
import type {GLTF_EXT_structural_metadata_PropertyTable} from '../types/gltf-ext-structural-metadata-schema';

import {GLTFScenegraph} from '../api/gltf-scenegraph';
import {
  getPrimitiveTextureData,
  primitivePropertyDataToAttributes
} from './texture-data-processing';
import {getPropertyTable} from './EXT_structural_metadata';

import {EXTENSION_NAME_EXT_MESH_FEATURES} from '../types/gltf-ext-mesh-features-schema';

export const name = EXTENSION_NAME_EXT_MESH_FEATURES;

export async function decode(gltfData: {json: GLTF}, options: GLTFLoaderOptions): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  decodeExtMeshFeatures(scenegraph, options);
}

/**
 * Decodes feature metadata from extension
 * @param scenegraph
 */
/* eslint max-depth: ["error", 6]*/
/* eslint complexity: ["error", { "max": 14 }]*/
function decodeExtMeshFeatures(scenegraph: GLTFScenegraph, options: GLTFLoaderOptions): void {
  // Iterate through all meshes/primitives.
  const json = scenegraph.gltf.json;
  if (!json.meshes) {
    return;
  }

  for (const mesh of json.meshes) {
    for (const primitive of mesh.primitives) {
      const extension = primitive.extensions?.[
        EXTENSION_NAME_EXT_MESH_FEATURES
      ] as GLTF_EXT_mesh_features;
      if (extension) {
        const featureIds: GLTF_EXT_mesh_features_featureId[] = extension.featureIds;

        if (!featureIds) return;
        for (const featureId of featureIds) {
          if (!featureId.dataAttributeNames) featureId.dataAttributeNames = [];
          const featureTextureTable: number[] = [];
          if (typeof featureId.texture !== 'undefined' && options.gltf?.loadImages) {
            let propertyTable: GLTF_EXT_structural_metadata_PropertyTable | null = null;
            if (typeof featureId.propertyTable === 'number') {
              propertyTable = getPropertyTable(scenegraph, featureId.propertyTable);
            }
            const attributeName = propertyTable?.name || '';
            const propertyData: number[] | null = getPrimitiveTextureData(
              scenegraph,
              featureId.texture,
              primitive
            );
            if (propertyData === null) return;
            primitivePropertyDataToAttributes(
              scenegraph,
              attributeName,
              propertyData,
              featureTextureTable,
              primitive
            );

            featureId.dataAttributeNames.push(attributeName);
            featureId.data = featureTextureTable;
          }
          if (typeof featureId.attribute !== 'undefined') {
            // TODO
          }
        }
      }
    }
  }
}
