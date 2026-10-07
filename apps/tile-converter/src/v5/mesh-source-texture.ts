// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFMaterialPostprocessed} from '@loaders.gl/gltf';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {MeshTileSampler, MeshTileTexture, MeshTileTextureTransform} from './mesh.js';

/** Maps one embedded PNG/JPEG image, sampling and UV transform without decoding or baking UVs. */
export function mapMeshSourceTexture(
  textureInfo: NonNullable<GLTFMaterialPostprocessed['pbrMetallicRoughness']>['baseColorTexture']
): MeshTileTexture {
  const texture = textureInfo?.texture;
  const image = texture?.source;
  const sampler = texture?.sampler;
  const extensions = textureInfo?.extensions || {};
  const hasTransform = Object.hasOwn(extensions, 'KHR_texture_transform');
  const transform = extensions.KHR_texture_transform;
  if (
    !textureInfo ||
    (textureInfo.texCoord !== undefined && textureInfo.texCoord !== 0) ||
    Object.keys(extensions).some(name => name !== 'KHR_texture_transform') ||
    (hasTransform &&
      (!transform ||
        typeof transform !== 'object' ||
        Array.isArray(transform) ||
        (transform.texCoord !== undefined && transform.texCoord !== 0) ||
        Object.keys(transform.extensions || {}).length ||
        Object.keys(transform).some(
          name =>
            !['offset', 'rotation', 'scale', 'texCoord', 'extensions', 'extras'].includes(name)
        ))) ||
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
      'Base-color textures require an embedded PNG/JPEG bufferView, TEXCOORD_0, glTF sampling and an optional KHR_texture_transform on TEXCOORD_0'
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
    ...(hasTransform
      ? {
          transform: {
            offset: transform.offset,
            rotation: transform.rotation,
            scale: transform.scale
          } as MeshTileTextureTransform
        }
      : {}),
    ...(selectedSampler && Object.values(selectedSampler).some(value => value !== undefined)
      ? {sampler: selectedSampler}
      : {})
  };
}
