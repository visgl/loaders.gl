// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getBinaryImageMetadata} from '@loaders.gl/images';
import type {GLTFMaterialPostprocessed, GLTFImagePostprocessed} from '@loaders.gl/gltf';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {MeshTileSampler, MeshTileTexture, MeshTileTextureTransform} from './mesh.js';

/** Maps a buffer-view or base64 PNG/JPEG image, sampling and UV transform without decoding pixels. */
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
    (image.uri !== undefined && image.bufferView !== undefined) ||
    Object.keys(image.extensions || {}).length ||
    (image.uri === undefined &&
      (!(image.bufferView?.data instanceof Uint8Array) ||
        Object.keys(image.bufferView.extensions || {}).length ||
        !['image/png', 'image/jpeg'].includes(image.mimeType || ''))) ||
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
      'Base-color textures require a PNG/JPEG bufferView or base64 data URI, TEXCOORD_0, glTF sampling and an optional KHR_texture_transform on TEXCOORD_0'
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
    ...mapMeshSourceImage(image),
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

/** Reads self-contained encoded bytes without fetch, pixel decoding, or Node APIs. */
function mapMeshSourceImage(
  image: GLTFImagePostprocessed
): Pick<MeshTileTexture, 'data' | 'mimeType'> {
  if (image.uri === undefined) {
    return {data: image.bufferView!.data, mimeType: image.mimeType as MeshTileTexture['mimeType']};
  }
  const match =
    typeof image.uri === 'string'
      ? /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.uri)
      : null;
  if (!match || (image.mimeType !== undefined && image.mimeType !== match[1])) {
    throw new TileConversionError(
      'MESH_SOURCE_TEXTURE_UNSUPPORTED',
      'Inline images require a PNG/JPEG base64 data URI and matching optional mimeType'
    );
  }
  let encodedBytes: string;
  try {
    encodedBytes = atob(match[2]);
  } catch {
    throw new TileConversionError('MESH_SOURCE_TEXTURE_UNSUPPORTED', 'Invalid inline image base64');
  }
  return {
    data: Uint8Array.from(encodedBytes, character => character.charCodeAt(0)),
    mimeType: match[1] as MeshTileTexture['mimeType']
  };
}

/** Resolves one external encoded image through an explicitly supplied application reader. */
export async function resolveMeshSourceTexture(
  textureInfo: NonNullable<GLTFMaterialPostprocessed['pbrMetallicRoughness']>['baseColorTexture'],
  readExternalResource:
    | ((uri: string, contentUri: string | undefined, signal?: AbortSignal) => Promise<Uint8Array>)
    | undefined,
  contentUri: string | undefined,
  signal?: AbortSignal
): Promise<MeshTileTexture> {
  const image = textureInfo?.texture?.source;
  if (!image || image.uri === undefined || image.uri.startsWith('data:'))
    return mapMeshSourceTexture(textureInfo);
  if (!readExternalResource || image.bufferView !== undefined)
    throw new TileConversionError(
      'MESH_SOURCE_TEXTURE_UNSUPPORTED',
      'External images require an explicit bounded resource reader'
    );
  signal?.throwIfAborted();
  const data = await readExternalResource(image.uri, contentUri, signal);
  signal?.throwIfAborted();
  let metadata;
  try {
    metadata = getBinaryImageMetadata(new DataView(data.buffer, data.byteOffset, data.byteLength));
  } catch {
    /* Report an unsupported encoded image consistently. */
  }
  if (
    !metadata ||
    !['image/png', 'image/jpeg'].includes(metadata.mimeType) ||
    (image.mimeType !== undefined && image.mimeType !== metadata.mimeType)
  )
    throw new TileConversionError(
      'MESH_SOURCE_TEXTURE_UNSUPPORTED',
      'External images require matching PNG/JPEG headers'
    );
  // Select encoded bytes without decoding pixels or modifying the caller-owned glTF image.
  const resolved = {
    ...textureInfo,
    texture: {
      ...textureInfo!.texture,
      source: {...image, uri: undefined, mimeType: metadata.mimeType, bufferView: {data}}
    }
  };
  return mapMeshSourceTexture(resolved as typeof textureInfo);
}
