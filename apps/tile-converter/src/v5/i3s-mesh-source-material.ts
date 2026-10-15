// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {I3STileContent, I3STileHeader} from '@loaders.gl/i3s';
import type {GLTFMaterialPostprocessed} from '@loaders.gl/gltf';
import {getBinaryImageMetadata} from '@loaders.gl/images';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {MeshTilesetSourceOptions} from './mesh-source.js';
import {mapMeshSourceMaterial} from './mesh-source.js';
import type {MeshTileMaterial} from './mesh.js';

/** Maps normalized I3S factors and one encoded base-color PNG/JPEG with explicit wrapping. */
export async function mapI3SMeshSourceMaterial(
  content: I3STileContent,
  header: Partial<I3STileHeader>,
  readExternalResource: MeshTilesetSourceOptions['readExternalResource'],
  contentUri: string | undefined,
  signal?: AbortSignal
): Promise<MeshTileMaterial | undefined> {
  const material = Object.fromEntries(
    Object.entries(content.material || {}).filter(([, value]) => value !== undefined)
  );
  const metallicRoughness = material.pbrMetallicRoughness
    ? Object.fromEntries(
        Object.entries(material.pbrMetallicRoughness).filter(([, value]) => value !== undefined)
      )
    : {};
  material.pbrMetallicRoughness = metallicRoughness;
  if (material.cullFace !== undefined && material.cullFace !== 'back') {
    throw new TileConversionError(
      'I3S_MESH_SOURCE_MATERIAL_UNSUPPORTED',
      'Only back-face culling is supported'
    );
  }
  delete material.cullFace;
  let textureInfo = metallicRoughness.baseColorTexture
    ? {...(metallicRoughness.baseColorTexture as Record<string, unknown>)}
    : undefined;
  const resources = header.textureUrls?.length
    ? header.textureUrls
    : header.textureUrl
      ? [
          {
            textureSetDefinitionId: textureInfo?.textureSetDefinitionId ?? 0,
            textureUrl: header.textureUrl,
            textureFormat: header.textureFormat || 'jpg'
          }
        ]
      : [];
  // Legacy singleton textures without a material definition are implicit base-color maps.
  if (!textureInfo && !header.materialDefinition && resources.length === 1) {
    textureInfo = {textureSetDefinitionId: resources[0].textureSetDefinitionId};
  }
  const encodedTextures = content.textures || {};
  if (
    !textureInfo &&
    (resources.length || content.texture || Object.keys(encodedTextures).length)
  ) {
    throw new TileConversionError(
      'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED',
      'Texture resources require a base-color mapping'
    );
  }
  if (textureInfo) {
    const definitionId = textureInfo.textureSetDefinitionId;
    const wrappingModes: Record<string, number> = {none: 33071, repeat: 10497, mirror: 33648};
    if (
      typeof definitionId !== 'number' ||
      !Number.isSafeInteger(definitionId) ||
      definitionId < 0 ||
      (textureInfo.texCoord !== undefined && textureInfo.texCoord !== 0) ||
      Object.keys(textureInfo).some(
        name => !['textureSetDefinitionId', 'texCoord', 'wrapS', 'wrapT', 'texture'].includes(name)
      ) ||
      (['wrapS', 'wrapT'] as const).some(
        name =>
          textureInfo![name] !== undefined &&
          (typeof textureInfo![name] !== 'string' ||
            !Object.hasOwn(wrappingModes, textureInfo![name] as string))
      ) ||
      resources.length > 1 ||
      resources.some(resource => resource.textureSetDefinitionId !== definitionId) ||
      Object.keys(encodedTextures).some(key => key !== String(definitionId))
    ) {
      throw new TileConversionError(
        'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED',
        'Only one base-color texture set on TEXCOORD_0 with qualified wrapping is supported'
      );
    }
    let encoded =
      encodedTextures[String(definitionId)] ||
      content.texture ||
      (textureInfo.texture as {source?: {image?: unknown}} | undefined)?.source?.image;
    if (!encoded) {
      if (!resources.length || !readExternalResource) {
        throw new TileConversionError(
          'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED',
          'Encoded texture bytes or an explicit bounded resource reader are required'
        );
      }
      signal?.throwIfAborted();
      encoded = await readExternalResource(resources[0].textureUrl, contentUri, signal);
      signal?.throwIfAborted();
    }
    const data = encoded instanceof ArrayBuffer ? new Uint8Array(encoded) : encoded;
    let image;
    if (data instanceof Uint8Array) {
      try {
        image = getBinaryImageMetadata(new DataView(data.buffer, data.byteOffset, data.byteLength));
      } catch {
        /* Reject malformed or compressed image resources below. */
      }
    }
    const declaredFormat = resources[0]?.textureFormat;
    if (
      !image ||
      !['image/png', 'image/jpeg'].includes(image.mimeType) ||
      (declaredFormat &&
        (declaredFormat === 'png'
          ? image.mimeType !== 'image/png'
          : declaredFormat === 'jpg'
            ? image.mimeType !== 'image/jpeg'
            : true))
    ) {
      throw new TileConversionError(
        'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED',
        'I3S base-color bytes must have matching PNG/JPEG headers'
      );
    }
    const sampler = Object.fromEntries(
      ['wrapS', 'wrapT']
        .filter(name => textureInfo![name] !== undefined)
        .map(name => [name, wrappingModes[textureInfo![name] as string]])
    );
    metallicRoughness.baseColorTexture = {
      texCoord: 0,
      texture: {
        source: {mimeType: image.mimeType, bufferView: {data}},
        ...(Object.keys(sampler).length ? {sampler} : {})
      }
    };
  }
  const mapped = await mapMeshSourceMaterial(
    material as GLTFMaterialPostprocessed,
    undefined,
    contentUri,
    signal
  );
  if (mapped?.baseColorTexture && !content.sourceAttributes?.uv0) {
    throw new TileConversionError(
      'MESH_TEXCOORD_REQUIRED',
      'Base-color textures require TEXCOORD_0'
    );
  }
  return mapped;
}
