import type {GLTFAccessorPostprocessed} from 'modules/gltf/src/lib/types/gltf-types';
import type {Image, MeshPrimitive} from 'modules/gltf/src/lib/types/gltf-postprocessed-schema';
import type {ExtFeatureMetadata, ExtFeatureMetadataAttribute} from 'modules/3d-tiles/src/types';

/**
 * Getting batchIds from 3DTilesNext extensions.
 * @param attributes
 * @param primitive
 * @param textures
 */
export function handleBatchIdsExtensions(
  attributes: {
    [key: string]: GLTFAccessorPostprocessed;
  },
  primitive: MeshPrimitive,
  images: Image[]
): number[] {
  const extensions = primitive?.extensions;

  if (!extensions) {
    return [];
  }

  switch (true) {
    case Boolean(extensions.EXT_feature_metadata): {
      return handleExtFeatureMetadataExtension(attributes, extensions.EXT_feature_metadata, images);
    }
    case Boolean(extensions.EXT_mesh_features): {
      // TODO Add support for EXT_mesh_features extension.
      console.warn('EXT_mesh_features extension is not supported yet');
      return [];
    }
    default: {
      console.warn("Can't handle unsupported batchIds extensions");
      return [];
    }
  }
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
  extFeatureMetadata: ExtFeatureMetadata,
  images: Image[]
): number[] {
  // Take only first extension object to get batchIds attribute name.
  const featureIdAttribute =
    extFeatureMetadata?.featureIdAttributes && extFeatureMetadata?.featureIdAttributes[0];

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
    const textureCoordinates = attributes.TEXCOORD_0.value;
    return generateBatchIdsFromTexture(featureIdTexture, textureCoordinates, images);
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
  featureIdTexture: ExtFeatureMetadataAttribute,
  textureCoordinates: Float32Array,
  images: Image[]
) {
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

  if (!image.compressed) {
    for (let index = 0; index < textureCoordinates.length; index += 2) {
      const u = textureCoordinates[index];
      const v = textureCoordinates[index + 1];

      const tx = Math.min((emod(u, 1) * image.width) | 0, image.width - 1);
      const ty = Math.min((emod(v, 1) * image.height) | 0, image.height - 1);

      const offset = (ty * image.width + tx) * image.components + channels;
      const batchId = new Uint8Array(image.data)[offset];

      batchIds.push(batchId);
    }
  } else {
    console.warn(`Can't get batch Ids from ${image.mimeType} compressed texture`);
  }

  return batchIds;
}

/**
 * Handle UVs if they are < 0 or > 1
 * @param n
 * @param m
 */
function emod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
