import {GLTFAccessorPostprocessed, GLTFMeshPrimitivePostprocessed} from '@loaders.gl/gltf';
import type {NumericArray} from '@loaders.gl/loader-utils';
import type {
  GLTF_EXT_feature_metadata_FeatureIdTexture,
  GLTF_EXT_feature_metadata_GLTF,
  GLTF_EXT_feature_metadata_Primitive
} from '@loaders.gl/gltf';
import {TypedArray} from '@math.gl/core';
import {TextureImageProperties} from '../types';
import {EXT_FEATURE_METADATA, EXT_MESH_FEATURES} from '../../constants';
import {Tiles3DTileContent} from '@loaders.gl/3d-tiles';

/**
 * Get featureTexture by metadataClass
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
        console.warn('EXT_mesh_features extension is not supported yet');
        return [];
      default:
        return [];
    }
  }

  return [];
}

/**
 * Get batchIds from EXT_feature_metadata extension.
 * Docs - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata
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
