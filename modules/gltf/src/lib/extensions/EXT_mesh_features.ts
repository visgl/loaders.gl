// GLTF EXTENSION: EXT_mesh_features
// https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features
/* eslint-disable camelcase */
import type {GLTF, GLTFMeshPrimitive} from '../types/gltf-json-schema';
import {GLTFLoaderOptions} from '../../gltf-loader';
import type {
  GLTF_EXT_mesh_features,
  GLTF_EXT_mesh_features_featureId
} from '../types/gltf-ext-mesh-features-schema';
import type {GLTF_EXT_structural_metadata_PropertyTable} from '../types/gltf-ext-structural-metadata-schema';

import {GLTFScenegraph} from '../api/gltf-scenegraph';
import {getPrimitiveTextureData, primitivePropertyDataToAttributes} from './utils/3d-tiles-utils';
import {getPropertyTablePopulated} from './EXT_structural_metadata';

const EXT_MESH_FEATURES_NAME = 'EXT_mesh_features';
export const name = EXT_MESH_FEATURES_NAME;

export async function decode(gltfData: {json: GLTF}, options: GLTFLoaderOptions): Promise<void> {
  const scenegraph = new GLTFScenegraph(gltfData);
  decodeExtMeshFeatures(scenegraph, options);
}

/**
 * Decodes feature metadata from extension
 * @param {GLTFScenegraph} scenegraph - Instance of the class for structured access to GLTF data.
 * @param {GLTFLoaderOptions} options - loader options.
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
 * @param {GLTFMeshPrimitive} primitive - primitive that contains extensions.
 * @param {GLTFLoaderOptions} options - loader options.
 */
function processMeshPrimitiveFeatures(
  scenegraph: GLTFScenegraph,
  primitive: GLTFMeshPrimitive,
  options: GLTFLoaderOptions
): void {
  const extension = primitive.extensions?.[EXT_MESH_FEATURES_NAME] as GLTF_EXT_mesh_features;
  const featureIds: GLTF_EXT_mesh_features_featureId[] = extension?.featureIds;
  if (!featureIds) return;

  if (!extension.dataAttributeNames) {
    extension.dataAttributeNames = [];
  }

  let featureIdCount = 0; // It can be used to name the feature if neither label nor property table name is provided.
  for (const featureId of featureIds) {
    /*
      When combined with the EXT_structural_metadata extension, feature ID sets can be associated with property tables.
      A property table maps each feature ID to a set of values that are associated with the respective feature.
      The feature ID in this case serves as an index for the row of the table.
      The index of the property table that a certain set of feature IDs is associated with is stored in the propertyTable of the feature ID set definition.
    */
    let propertyTable: GLTF_EXT_structural_metadata_PropertyTable | null = null;
    if (typeof featureId.propertyTable === 'number') {
      propertyTable = getPropertyTablePopulated(scenegraph, featureId.propertyTable);
    }

    let propertyData: number[] | null = null;
    // Process "Feature ID by Vertex"
    if (typeof featureId.attribute !== 'undefined') {
      const accessorKey = `_FEATURE_ID_${featureId.attribute}`;
      const accessorIndex = primitive.attributes[accessorKey];
      const propertyDataTypedArray = scenegraph.getTypedArrayForAccessor(accessorIndex);
      propertyData = Array.prototype.slice.call(propertyDataTypedArray);
    }

    // Process "Feature ID by Texture Coordinates"
    else if (typeof featureId.texture !== 'undefined' && options?.gltf?.loadImages) {
      propertyData = getPrimitiveTextureData(scenegraph, featureId.texture, primitive);
    }

    // Process "Feature ID by Index"
    else {
      /*
      When both featureId.attribute and featureId.texture are undefined,
      then the feature ID value for each vertex is given implicitly, via the index of the vertex.
      In this case, the featureCount must match the number of vertices of the mesh primitive.
      */
      // TODO: At the moment of writing we don't have a tileset with the data of that kind. Implement it later.
    }

    const attributeName =
      featureId.label || propertyTable?.name || `featureAttribute${featureIdCount}`;

    // featureTable - an array where unique data from the property data are being stored
    const featureTable: number[] = [];
    if (propertyData) {
      primitivePropertyDataToAttributes(
        scenegraph,
        attributeName,
        propertyData,
        featureTable,
        primitive
      );
    }
    extension.dataAttributeNames.push(attributeName);
    featureId.data = featureTable;

    featureIdCount++;
  }
}
