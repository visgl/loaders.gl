// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFMaterialPostprocessed} from '@loaders.gl/gltf';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {MeshTileSampler, MeshTileTexture} from './mesh.js';

/** Maps one embedded PNG/JPEG image and its sampler without decoding or changing encoded bytes. */
export function mapMeshSourceTexture(
  textureInfo: NonNullable<GLTFMaterialPostprocessed['pbrMetallicRoughness']>['baseColorTexture']
): MeshTileTexture {
  const texture = textureInfo?.texture;
  const image = texture?.source;
  const sampler = texture?.sampler;
  if (
    !textureInfo ||
    (textureInfo.texCoord !== undefined && textureInfo.texCoord !== 0) ||
    Object.keys(textureInfo.extensions || {}).length ||
    Object.keys(textureInfo).some(
      name => !['id', 'index', 'texture', 'texCoord', 'extensions', 'extras'].includes(name)
    ) ||
    !texture ||
    Object.keys(texture).some(
      name => !['id', 'source', 'sampler', 'name', 'extensions', 'extras'].includes(name)
    ) ||
    Object.keys(texture.extensions || {}).length ||
    !image ||
    image.uri !== undefined ||
    Object.keys(image.extensions || {}).length ||
    !(image.bufferView?.data instanceof Uint8Array) ||
    Object.keys(image.bufferView.extensions || {}).length ||
    !['image/png', 'image/jpeg'].includes(image.mimeType || '') ||
    (sampler &&
      (Object.keys(sampler.extensions || {}).length ||
        Object.keys(sampler).some(
          name =>
            ![
              'id',
              'parameters',
              'wrapS',
              'wrapT',
              'magFilter',
              'minFilter',
              'name',
              'extensions',
              'extras'
            ].includes(name)
        )))
  ) {
    throw new TileConversionError(
      'MESH_SOURCE_TEXTURE_UNSUPPORTED',
      'Base-color textures require an embedded PNG/JPEG bufferView, TEXCOORD_0 and plain glTF sampling'
    );
  }
  const selectedSampler = sampler
    ? ({
        wrapS: sampler.wrapS,
        wrapT: sampler.wrapT,
        magFilter: sampler.magFilter,
        minFilter: sampler.minFilter
      } as MeshTileSampler)
    : undefined;
  return {
    data: image.bufferView!.data,
    mimeType: image.mimeType as MeshTileTexture['mimeType'],
    ...(selectedSampler && Object.values(selectedSampler).some(value => value !== undefined)
      ? {sampler: selectedSampler}
      : {})
  };
}
