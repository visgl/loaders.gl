// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BuilderInput} from '../../lib/utils/builder-input';

import type {MaterialDefinitionInfo, TextureDefinitionInfo} from '@loaders.gl/i3s';
import type {SharedResourcesArrays} from '../types';

/** Legacy material fields are selected from the material record, rather than its params field. */
/** Legacy texture records receive the generated image index as an annotation. */
type IndexedTexture = TextureDefinitionInfo & {
  /** Generated legacy image index. */
  imageIndex?: string;
};

/** Material parameters are selected from the root record. */
type MaterialInput = BuilderInput<MaterialDefinitionInfo> &
  BuilderInput<MaterialDefinitionInfo['params']>;

/** Builds one material while retaining the legacy root-level parameter selection. */
function createMaterial(input: MaterialInput) {
  return {
    name: input.name ?? 'standard',
    type: input.type ?? 'standard',
    params: {
      renderMode: input.renderMode ?? 'solid',
      shininess: input.shininess ?? 1,
      reflectivity: input.reflectivity ?? 0,
      ambient: input.ambient ?? [1, 1, 1],
      diffuse: input.diffuse ?? [1, 1, 1],
      specular: input.specular ?? [0, 0, 0],
      useVertexColorAlpha: input.useVertexColorAlpha ?? false,
      vertexRegions: input.vertexRegions ?? false,
      vertexColors: input.vertexColors ?? true
    }
  };
}

/** Builds a texture record with the historical image fields and defaults. */
function createTexture(input: BuilderInput<TextureDefinitionInfo>) {
  return {
    encoding: input.encoding ?? undefined,
    wrap: input.wrap ?? ['none'],
    atlas: input.atlas ?? false,
    uvSet: input.uvSet ?? 'uv0',
    channels: input.channels ?? 'rgb',
    images: input.images!.map(image => ({
      id: image.id ?? undefined,
      size: image.size ?? undefined,
      href: image.href ?? ['../textures/0'],
      length: image.length ?? undefined
    }))
  };
}

/** Builds shared resources, preserving generated keys and the legacy image-index annotation. */
export function createSharedResources(input: SharedResourcesArrays) {
  const materialDefinitions: Record<string, ReturnType<typeof createMaterial>> = {};
  for (const [index, material] of input.materialDefinitionInfos!.entries()) {
    materialDefinitions[`Mat${input.nodePath}${index}`] = createMaterial(material);
  }
  const textureDefinitions: Record<string, ReturnType<typeof createTexture>> | null =
    input.textureDefinitionInfos ? {} : null;
  if (textureDefinitions) {
    for (const [index, texture] of input.textureDefinitionInfos!.entries()) {
      const imageIndex = `${input.nodePath}${index}`;
      (texture as IndexedTexture).imageIndex = imageIndex;
      textureDefinitions[imageIndex] = createTexture(texture);
    }
  }
  return {materialDefinitions, textureDefinitions};
}
