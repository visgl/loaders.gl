import {GLTFAccessorPostprocessed, GLTFMeshPrimitivePostprocessed} from '@loaders.gl/gltf';
import type {NumericArray} from '@loaders.gl/loader-utils';
import type {
  GLTF_EXT_feature_metadata_FeatureIdTexture,
  GLTF_EXT_feature_metadata_Primitive
} from '@loaders.gl/gltf';

import type {GLTF_EXT_mesh_features, GLTF_EXT_mesh_features_featureId} from '@loaders.gl/gltf';

import {TypedArray} from '@math.gl/core';
import {TextureImageProperties} from '../../i3s-attributes-worker';

import {
  EXTENSION_NAME_EXT_MESH_FEATURES,
  EXTENSION_NAME_EXT_FEATURE_METADATA
} from '@loaders.gl/gltf';

/**
 * Getting batchIds from 3DTilesNext extensions.
 * @param attributes - gltf accessors
 * @param primitive - gltf primitive data
 * @param images - gltf texture images
 */
export function handleBatchIdsExtensions(
  attributes: {
    [key: string]: GLTFAccessorPostprocessed;
  },
  primitive: GLTFMeshPrimitivePostprocessed,
  images: (TextureImageProperties | null)[]
): NumericArray {
  const extensions = primitive?.extensions;

  if (!extensions) {
    return [];
  }

  for (const [extensionName, extensionData] of Object.entries(extensions || {})) {
    switch (extensionName) {
      case EXTENSION_NAME_EXT_FEATURE_METADATA:
        return handleExtFeatureMetadataExtension(
          attributes,
          extensionData as GLTF_EXT_feature_metadata_Primitive,
          images
        );
      case EXTENSION_NAME_EXT_MESH_FEATURES:
        return handleExtMeshFeaturesExtension(attributes, extensionData as GLTF_EXT_mesh_features);
      default:
        return [];
    }
  }

  return [];
}

/**
 * Getting batchIds from EXT_mesh_features extensions.
 * @param attributes - gltf accessors
 * @param extMeshFeatures - EXT_mesh_features extension
 * @returns
 */
function handleExtMeshFeaturesExtension(
  attributes: {
    [key: string]: GLTFAccessorPostprocessed;
  },
  extMeshFeatures: GLTF_EXT_mesh_features
): NumericArray {
  // Take only first extension object to get batchIds attribute name.
  if (extMeshFeatures?.featureIds.length) {
    const extMeshFeaturesFeatureId: GLTF_EXT_mesh_features_featureId =
      extMeshFeatures.featureIds[0];
    const dataAttributeNames = extMeshFeaturesFeatureId?.dataAttributeNames;
    if (dataAttributeNames && dataAttributeNames.length) {
      // Let's use the first element of the array
      // TODO: What to do with others if any?
      const batchIdsAttribute = attributes[dataAttributeNames[0]];
      return batchIdsAttribute.value;
    }
  }
  return [];
}

/**
 * Get batchIds from EXT_feature_metadata extension.
 * Docs - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata
 * @param attributes
 * @param extFeatureMetadata
 * @param textures
 */
function handleExtFeatureMetadataExtension(
  attributes: {
    [key: string]: GLTFAccessorPostprocessed;
  },
  extFeatureMetadata: GLTF_EXT_feature_metadata_Primitive,
  images: (TextureImageProperties | null)[]
): NumericArray {
  // Take only first extension object to get batchIds attribute name.
  const featureIdAttribute = extFeatureMetadata?.featureIdAttributes?.[0];

  if (featureIdAttribute?.featureIds?.attribute) {
    const batchIdsAttribute = attributes[featureIdAttribute.featureIds.attribute];
    return batchIdsAttribute.value;
  }

  if (
    featureIdAttribute?.featureIds?.hasOwnProperty('constant') &&
    featureIdAttribute?.featureIds?.hasOwnProperty('divisor')
  ) {
    const featuresCount = attributes?.POSITIONS?.value.length / 3 || 0;
    return generateImplicitFeatureIds(
      featuresCount,
      featureIdAttribute.featureIds.constant,
      featureIdAttribute.featureIds.divisor
    );
  }

  // Take only first extension object to get batchIds attribute name.
  const featureIdTexture =
    extFeatureMetadata?.featureIdTextures && extFeatureMetadata?.featureIdTextures[0];

  if (featureIdTexture) {
    const textureAttributeIndex = featureIdTexture?.featureIds?.texture?.texCoord || 0;
    const textCoordAttribute = `TEXCOORD_${textureAttributeIndex}`;
    const textureCoordinates = attributes[textCoordAttribute].value;
    return generateBatchIdsFromTexture(featureIdTexture, textureCoordinates, images);
  }

  // Take only first extension texture to get batchIds from the root EXT_feature_metadata object.
  const featureTexture =
    extFeatureMetadata?.featureTextures && extFeatureMetadata?.featureTextures[0];

  if (featureTexture) {
    const batchIdsAttribute = attributes[featureTexture];
    return batchIdsAttribute.value;
  }

  return [];
}

/**
 * Generates implicit feature ids
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#implicit-feature-ids
 * @param featuresCount
 * @param constant
 * @param devisor
 */
function generateImplicitFeatureIds(
  featuresCount: number,
  constant: number = 0,
  divisor: number = 0
): number[] {
  let featureIds: number[] = [];

  if (divisor > 0) {
    let currentValue = constant;
    let devisorCounter = divisor;

    for (let index = 0; index < featuresCount; index++) {
      featureIds.push(currentValue);

      devisorCounter -= 1;

      if (devisorCounter === 0) {
        currentValue++;
        devisorCounter = divisor;
      }
    }
  } else {
    featureIds = Array<number>(featuresCount).fill(constant, 0, featuresCount);
  }

  return featureIds;
}

/**
 * Get batchIds from texture.
 * @param primitive
 * @param featureIdTextures
 */
function generateBatchIdsFromTexture(
  featureIdTexture: GLTF_EXT_feature_metadata_FeatureIdTexture,
  textureCoordinates: TypedArray,
  images: (TextureImageProperties | null)[]
) {
  if (!images?.length) {
    return [];
  }

  const CHANNELS_MAP = {
    r: 0,
    g: 1,
    b: 2,
    a: 3
  };

  const textureIndex = featureIdTexture?.featureIds?.texture?.index;
  const featureChannel = featureIdTexture?.featureIds?.channels;

  if (!featureChannel || textureIndex === undefined) {
    return [];
  }

  const image = images[textureIndex];
  const batchIds: number[] = [];
  const channels = CHANNELS_MAP[featureChannel];

  if (image && image?.width && image?.height && image?.components) {
    for (let index = 0; index < textureCoordinates.length; index += 2) {
      const u = textureCoordinates[index];
      const v = textureCoordinates[index + 1];

      const tx = Math.min((emod(u) * image.width) | 0, image.width - 1);
      const ty = Math.min((emod(v) * image.height) | 0, image.height - 1);

      const offset = (ty * image.width + tx) * image.components + channels;
      const batchId = new Uint8Array(image.data)[offset];

      batchIds.push(batchId);
    }
  } else {
    console.warn(`Can't get batch Ids from ${image?.mimeType || ''} compressed texture`);
  }

  return batchIds;
}

/**
 * Handle UVs if they are out of range [0,1].
 * @param n
 * @param m
 */
function emod(n: number): number {
  return ((n % 1) + 1) % 1;
}
