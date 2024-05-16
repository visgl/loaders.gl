/* eslint-disable camelcase */
import {GLTFAccessorPostprocessed, GLTFMeshPrimitivePostprocessed} from '@loaders.gl/gltf';
import type {NumericArray} from '@loaders.gl/loader-utils';
import type {
  GLTF_EXT_feature_metadata_FeatureIdTexture,
  GLTF_EXT_feature_metadata_GLTF,
  GLTF_EXT_feature_metadata_Primitive
} from '@loaders.gl/gltf';

import type {GLTF_EXT_mesh_features} from '@loaders.gl/gltf';

import {TypedArray} from '@math.gl/core';
import {TextureImageProperties} from '../types';
import {emod} from '@loaders.gl/math';
import {EXT_MESH_FEATURES, EXT_FEATURE_METADATA} from '@loaders.gl/gltf';
import {Tiles3DTileContent} from '@loaders.gl/3d-tiles';

/**
 * Get featureTexture by a metadata class.
 * Metadata classes come from a structural metadata extesion (EXT_feature_metadata or EXT_structural_metadata).
 * The glTF might contain multiple texel-level metadata textures related to different classes. Having only one metadata class
 * selected to convert to I3S, we have to pick only one texture to convert to per-vertex property.
 * @param tileContent - 3d tile content
 * @param metadataClass - user selected feature metadata class name
 * @returns featureTexture key
 */
export function getTextureByMetadataClass(
  tileContent: Tiles3DTileContent,
  metadataClass?: string
): string | null {
  const extFeatureMetadata = tileContent.gltf?.extensions?.[
    EXT_FEATURE_METADATA
  ] as GLTF_EXT_feature_metadata_GLTF;
  if (!extFeatureMetadata?.featureTextures) {
    return null;
  }
  for (const textureKey in extFeatureMetadata.featureTextures) {
    const texture = extFeatureMetadata.featureTextures[textureKey];
    if (texture.class === metadataClass) {
      return textureKey;
    }
  }
  return null;
}

/**
 * Getting batchIds from 3DTilesNext extensions.
 * @param attributes - gltf accessors
 * @param primitive - gltf primitive data
 * @param images - gltf texture images
 * @param featureTexture - feature texture key
 * @return array of batch IDs
 */
export function handleBatchIdsExtensions(
  attributes: {
    [key: string]: GLTFAccessorPostprocessed;
  },
  primitive: GLTFMeshPrimitivePostprocessed,
  images: (TextureImageProperties | null)[],
  featureTexture: string | null
): NumericArray {
  const extensions = primitive?.extensions;
  if (!extensions) {
    return [];
  }

  for (const [extensionName, extensionData] of Object.entries(extensions || {})) {
    switch (extensionName) {
      case EXT_FEATURE_METADATA:
        return handleExtFeatureMetadataExtension(
          attributes,
          extensionData as GLTF_EXT_feature_metadata_Primitive,
          images,
          featureTexture
        );
      case EXT_MESH_FEATURES:
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
 * @returns an array of attribute values
 */
function handleExtMeshFeaturesExtension(
  attributes: {
    [key: string]: GLTFAccessorPostprocessed;
  },
  extMeshFeatures: GLTF_EXT_mesh_features
): NumericArray {
  for (const ids of extMeshFeatures.featureIds) {
    if (typeof ids.propertyTable !== 'undefined') {
      // propertyTable is an index that can be 0
      // return the first featureID set that corresponts to property table.
      return ids.data as NumericArray;
    }
  }
  return [];
}

/**
 * Get batchIds from EXT_feature_metadata extension.
 * @see - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata
 * @param attributes - glTF attributes
 * @param extFeatureMetadata - primitive-level EXT_FEATURE_METADATA extension data
 * @param textures - texture images
 * @param featureTexture - feature texture key
 */
function handleExtFeatureMetadataExtension(
  attributes: {
    [key: string]: GLTFAccessorPostprocessed;
  },
  extFeatureMetadata: GLTF_EXT_feature_metadata_Primitive,
  images: (TextureImageProperties | null)[],
  featureTexture: string | null
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

  if (featureTexture) {
    const batchIdsAttribute = attributes[featureTexture];
    return batchIdsAttribute.value;
  }

  return [];
}

/**
 * Generates implicit feature ids
 * @see - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#implicit-feature-ids
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
    // eslint-disable-next-line no-console
    console.warn(`Can't get batch Ids from ${image?.mimeType || ''} compressed texture`);
  }

  return batchIds;
}
