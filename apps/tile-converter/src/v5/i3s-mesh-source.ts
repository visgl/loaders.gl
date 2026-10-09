// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {I3STileContent, I3SMeshFeatures} from '@loaders.gl/i3s';
import type {
  Tileset3D,
  TilesetSourceMetadata,
  TilesetContentTraversalItem
} from '@loaders.gl/tiles';
import {
  TileConversionError,
  createTilesetConversionSource
} from '@loaders.gl/tile-converter/v5/core';
import type {
  TileConversionSource,
  TilesetConversionSourceOptions
} from '@loaders.gl/tile-converter/v5/core';
import type {MeshSourceResource} from './mesh-source.js';
import type {MeshTilesetSourceOptions} from './mesh-source.js';
import {mapI3SMeshSourceMaterial} from './i3s-mesh-source-material.js';
import {extractI3SMeshFeatures} from './i3s-mesh-source-features.js';
import type {I3SMeshSourceFeatureOptions} from './i3s-mesh-source-features.js';
import {validateMeshGeometry} from './mesh.js';
export type {I3SMeshSourceFeatureOptions} from './i3s-mesh-source-features.js';

/** Selected I3S triangle, encoded base-color appearance and explicit-schema feature profile. */
export interface I3SMeshTilesetSourceOptions extends TilesetConversionSourceOptions {
  /** Read scalar/string attribute resources with an explicit schema and geometry OID mapping. */
  readonly features?: I3SMeshSourceFeatureOptions;
  /** Application-owned bounded reader, including archive resolution, authentication and decompression. */
  readonly readExternalResource?: MeshTilesetSourceOptions['readExternalResource'];
  /** Custom alternative to features, for source semantics outside the scalar resource profile. */
  readonly getFeatures?: (
    content: I3STileContent,
    item: TilesetContentTraversalItem,
    metadata: TilesetSourceMetadata,
    signal?: AbortSignal
  ) => I3SMeshFeatures | Promise<I3SMeshFeatures>;
}

/**
 * Reads original absolute I3S positions through camera-independent traversal.
 * Use a dedicated runtime with i3s.geometryMode='source'. The shared I3S spatial codec owns
 * units, elevation and reprojection; this source never consumes renderer placement matrices.
 * Pair the GLB codec with autoOrigin=true, or select an explicit target origin on the resources.
 * Positions/normals/TEXCOORD_0, basic PBR factors and one encoded PNG/JPEG base-color texture
 * are supported. Vertex colors, UV regions, additional attributes and segmentation fail explicitly.
 * Features require an explicit schema/resource reader or a custom Arrow mapper.
 * Unsafe decoded numeric geometry identifiers are rejected; exact property IDs use bigint.
 * @param tileset - Dedicated I3S runtime using source-coordinate content decoding.
 * @param options - Feature mapping and lifetime policy for content loaded during traversal.
 * @returns A portable source of one absolute mesh per I3S node content.
 */
export function createI3SMeshTilesetConversionSource(
  tileset: Tileset3D,
  options: I3SMeshTilesetSourceOptions = {}
): TileConversionSource<TilesetSourceMetadata, MeshSourceResource> {
  const source = createTilesetConversionSource(tileset, options);
  return {
    /** Validates the layer profile and explicit source decode policy before reading. */
    async inspect(signal) {
      if (options.features && options.getFeatures) {
        throw new TileConversionError(
          'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED',
          'Choose explicit resource features or a custom getFeatures mapper, not both'
        );
      }
      const metadata = await source.inspect(signal);
      if (
        metadata.type !== 'I3S' ||
        !['3DObject', 'IntegratedMesh'].includes(metadata.tileset.layerType) ||
        tileset.options.i3s?.geometryMode !== 'source'
      ) {
        throw new TileConversionError(
          'I3S_MESH_SOURCE_PROFILE_UNSUPPORTED',
          'I3S mesh extraction requires a 3DObject/IntegratedMesh runtime with geometryMode=source'
        );
      }
      if (!metadata.spatialReference?.sourceCrs) {
        throw new TileConversionError(
          'I3S_MESH_SOURCE_REFERENCE_REQUIRED',
          'I3S conversion requires an explicit source CRS'
        );
      }
      return metadata;
    },
    /** Converts each supported content entry before shared traversal releases its buffers. */
    async *read(metadata, signal) {
      for await (const item of source.read(metadata, signal)) {
        for (const entry of item.contents) {
          signal?.throwIfAborted();
          const content = entry.payload as I3STileContent;
          const attributes = content?.sourceAttributes;
          if (
            content?.geometryMode !== 'source' ||
            content.topology !== 'triangle-list' ||
            !attributes ||
            !(attributes.position?.value instanceof Float64Array) ||
            content.spatialReference?.status !== 'native' ||
            (
              [
                'sourceCrs',
                'verticalCrs',
                'axisOrder',
                'units',
                'verticalUnitScale',
                'heightReference',
                'elevationMode',
                'elevationOffset',
                'elevationUnitScale',
                'coordinateEpoch'
              ] as const
            ).some(
              field =>
                JSON.stringify(content.spatialReference?.[field]) !==
                JSON.stringify(metadata.spatialReference?.[field])
            )
          ) {
            throw new TileConversionError(
              'I3S_MESH_SOURCE_GEOMETRY_UNSUPPORTED',
              'I3S extraction requires original source-frame Float64 triangle geometry'
            );
          }
          if (
            !['earth-centered', 'vertex-reference-frame'].includes(
              content.normalReferenceFrame || ''
            ) ||
            content.normalReferenceFrame !==
              (metadata.tileset.store?.normalReferenceFrame || 'earth-centered')
          ) {
            throw new TileConversionError(
              'I3S_MESH_SOURCE_NORMAL_FRAME_UNSUPPORTED',
              'Unknown I3S vector basis'
            );
          }
          if (
            content.meshSegmentation ||
            Object.entries(attributes).some(
              ([name, value]) =>
                value && !['position', 'normal', 'uv0', 'id', 'faceRange'].includes(name)
            )
          ) {
            throw new TileConversionError(
              'I3S_MESH_SOURCE_ATTRIBUTE_UNSUPPORTED',
              'Only positions, normals, TEXCOORD_0 and explicitly mapped feature associations are supported'
            );
          }
          const hasFeatures =
            content.featureIds.length > 0 ||
            metadata.tileset.fields?.length ||
            metadata.tileset.attributeStorageInfo?.length;
          if (Array.from(content.featureIds).some(value => !Number.isSafeInteger(value))) {
            throw new TileConversionError(
              'I3S_MESH_SOURCE_FEATURE_ID_UNSUPPORTED',
              'Decoded numeric feature IDs must be exact safe integers'
            );
          }
          if (hasFeatures && !options.getFeatures && !options.features) {
            throw new TileConversionError(
              'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED',
              'I3S feature data requires explicit resource features or a custom Arrow mapper'
            );
          }
          const mesh = validateMeshGeometry(
            {
              mode: 4,
              topology: 'triangle-list',
              attributes: {
                POSITION: attributes.position,
                ...(attributes.normal ? {NORMAL: attributes.normal} : {}),
                ...(attributes.uv0 ? {TEXCOORD_0: attributes.uv0} : {})
              },
              ...(content.indices ? {indices: {value: content.indices, size: 1}} : {})
            },
            true
          );
          if (mesh.attributes.POSITION.value.length / 3 !== content.vertexCount) {
            throw new TileConversionError(
              'I3S_MESH_SOURCE_COUNT_INVALID',
              'I3S vertexCount must match the decoded geometry'
            );
          }
          const features = options.getFeatures
            ? await options.getFeatures(content, item, metadata, signal)
            : options.features
              ? await extractI3SMeshFeatures(
                  content,
                  item,
                  metadata,
                  options.features,
                  options.readExternalResource,
                  entry.uri,
                  signal
                )
              : undefined;
          signal?.throwIfAborted();
          if (hasFeatures && !features) {
            throw new TileConversionError(
              'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED',
              'The feature mapper must return all declared feature data'
            );
          }
          const mappedMaterial = await mapI3SMeshSourceMaterial(
            content,
            item.tile.header,
            options.readExternalResource,
            entry.uri,
            signal
          );
          signal?.throwIfAborted();
          yield {
            id: `${item.tile.id}/${entry.index}`,
            origin: [0, 0, 0],
            mesh,
            normalReferenceFrame:
              content.normalReferenceFrame === 'vertex-reference-frame'
                ? 'vertex-reference-frame'
                : 'earth-centered',
            features,
            material: mappedMaterial
          };
        }
      }
    }
  };
}
