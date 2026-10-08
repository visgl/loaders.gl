// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {MeshAttribute} from '@loaders.gl/schema';
import type {
  GLTFPostprocessed,
  GLTFNodePostprocessed,
  GLTFMeshPrimitivePostprocessed,
  GLTFMaterialPostprocessed
} from '@loaders.gl/gltf';
import type {Tileset3D, TilesetSourceMetadata} from '@loaders.gl/tiles';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {TileConversionSource} from '@loaders.gl/tile-converter/v5/core';
import {createTilesetConversionSource} from '@loaders.gl/tile-converter/v5/core';
import type {TilesetConversionSourceOptions} from '@loaders.gl/tile-converter/v5/core';
import type {MeshConversionInput} from './mesh-conversion.js';
import type {MeshTileMaterial} from './mesh.js';
import {validateMeshGeometry, validateMeshIndices} from './mesh.js';
import {resolveMeshSourceTexture} from './mesh-source-texture.js';
import {extractMeshFeatures} from './mesh-source-features.js';
import type {MeshSourceFeatureOptions} from './mesh-source-features.js';
import type {I3SMeshFeatures} from '@loaders.gl/i3s';
export type {MeshSourceFeatureOptions} from './mesh-source-features.js';

/** Source mesh with optional explicit-schema feature data and triangle association. */
export interface MeshSourceResource extends MeshConversionInput {
  /** Arrow features associated with the selected primitive; IDs are distinct from table row indices. */
  readonly features?: I3SMeshFeatures;
}

/** Narrow source profile and content lifetime controls. */
export interface MeshTilesetSourceOptions extends TilesetConversionSourceOptions {
  /** Required when the source has batch/structural metadata; no schema is inferred. */
  readonly features?: MeshSourceFeatureOptions;
  /** Explicit bounded reader for external encoded images, relative to the content URI. */
  readonly readExternalResource?: (
    uri: string,
    contentUri: string | undefined,
    signal?: AbortSignal
  ) => Promise<Uint8Array>;
}

/**
 * Extracts static GLB/B3DM primitives from a native ECEF 3D Tiles runtime, including
 * optional buffer-view or base64 data-URI PNG/JPEG images, TEXCOORD_0, glTF sampling and
 * KHR_texture_transform controls on TEXCOORD_0. Decode content with
 * `gltf.excludeExtensions: {KHR_texture_transform: false}` to retain authored UVs/transforms.
 * Triangle strips are expanded with alternating winding; the glTF loader already expands fans.
 * Shared traversal retains placement identity and unloads content according to the supplied policy.
 * The adapter applies node transforms, glTF up-axis correction, RTC translation, and tile placement
 * once, retaining Float64 absolute positions and inverse-transpose unit normals. Animation, skins,
 * morphs, instancing, broader texture semantics, unknown extensions, non-affine/mirrored
 * placements, and
 * metadata outside the declared feature profile fail explicitly. Multiple resources can be read;
 * collection sinks accept bounded multiple placements; the compatibility single-mesh sink rejects a second resource.
 * @param tileset - Dedicated native EPSG:4978 runtime with decoded glTF content enabled.
 * @param options - Explicit feature schema/mapping and optional decoded-content cleanup.
 * @returns Portable conversion source; COLOR_0 is preserved for GLB, while I3S rejects vertex colors.
 */
export function createMeshTilesetConversionSource(
  tileset: Tileset3D,
  options: MeshTilesetSourceOptions = {}
): TileConversionSource<TilesetSourceMetadata, MeshSourceResource> {
  const source = createTilesetConversionSource(tileset, options);
  return {
    /** Validates the source frame and supported dataset metadata before traversal. */
    async inspect(signal) {
      const metadata = await source.inspect(signal);
      const reference = metadata.spatialReference;
      if (
        metadata.type !== 'TILES3D' ||
        !reference ||
        reference.status !== 'native' ||
        reference.sourceCrs !== 'EPSG:4978' ||
        reference.heightReference !== 'ellipsoidal' ||
        reference.axisOrder !== 'xyz' ||
        reference.verticalUnitScale !== 1 ||
        reference.units?.some(unit => unit !== 'meter')
      ) {
        throw new TileConversionError(
          'MESH_SOURCE_FRAME_UNSUPPORTED',
          'Mesh extraction requires native EPSG:4978 xyz coordinates in meters and ellipsoidal heights'
        );
      }
      if (metadata.tileset.metadata || metadata.tileset.groups?.length) {
        throw new TileConversionError(
          'MESH_SOURCE_METADATA_UNSUPPORTED',
          'Tileset/group metadata requires a separate mapping'
        );
      }
      return metadata;
    },
    /** Yields each primitive placement while the shared traversal owns content lifetime. */
    async *read(inspection, signal) {
      for await (const item of source.read(inspection, signal)) {
        const placementReference = item.tile.header._spatialReference || tileset.spatialReference;
        if (
          placementReference &&
          (placementReference.status !== 'native' || placementReference.sourceCrs !== 'EPSG:4978')
        )
          throw new TileConversionError(
            'MESH_SOURCE_FRAME_UNSUPPORTED',
            'Nested mesh placements require native ECEF coordinates'
          );
        if (item.tile.header.metadata || item.tile.header.implicitMetadata)
          throw new TileConversionError(
            'MESH_SOURCE_METADATA_UNSUPPORTED',
            'Tile metadata requires a separate mapping'
          );
        for (const content of item.contents) {
          signal?.throwIfAborted();
          if (content.metadata || content.group !== undefined)
            throw new TileConversionError(
              'MESH_SOURCE_METADATA_UNSUPPORTED',
              'Content metadata requires a separate mapping'
            );
          const payload = content.payload as {
            gltf?: GLTFPostprocessed;
            gltfUpAxis?: string;
            rtcCenter?: number[];
            type?: string;
            batchTableJson?: Record<string, unknown>;
            header?: {batchLength?: number};
            featureTableJson?: Record<string, unknown>;
          };
          if (
            !payload?.gltf ||
            !['glTF', 'gltf', 'b3dm'].includes(payload.type || content.type || '')
          ) {
            throw new TileConversionError(
              'MESH_SOURCE_CONTENT_UNSUPPORTED',
              'Mesh extraction requires decoded GLB/glTF or B3DM content'
            );
          }
          const gltf = payload.gltf;
          if (
            gltf.animations?.length ||
            gltf.skins?.length ||
            Object.keys(gltf.extensions || {}).some(
              name => !['EXT_structural_metadata', 'CESIUM_RTC'].includes(name)
            )
          ) {
            throw new TileConversionError(
              'MESH_SOURCE_SCENE_UNSUPPORTED',
              'Animated/skinned scenes and unmapped scene extensions are unsupported'
            );
          }
          const axis = payload.gltfUpAxis || 'Y';
          if (!['X', 'Y', 'Z'].includes(axis))
            throw new TileConversionError('MESH_SOURCE_AXIS_UNSUPPORTED', 'Unknown glTF up axis');
          const placement = new Matrix4(item.tile.computedTransform);
          const rtc = payload.rtcCenter || gltf.extensions?.CESIUM_RTC?.center;
          if (rtc) {
            if (rtc.length !== 3 || rtc.some((value: number) => !Number.isFinite(value)))
              throw new TileConversionError(
                'MESH_SOURCE_TRANSFORM_INVALID',
                'RTC center must contain finite xyz coordinates'
              );
            placement.translate(rtc);
          }
          if (axis === 'Y')
            placement.multiplyRight(new Matrix4([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]));
          if (axis === 'X')
            placement.multiplyRight(new Matrix4([0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1]));
          const roots =
            gltf.scene?.nodes || (gltf.scenes?.length === 1 ? gltf.scenes[0].nodes : undefined);
          if (!roots?.length)
            throw new TileConversionError(
              'MESH_SOURCE_SCENE_UNSUPPORTED',
              'A default scene or exactly one scene is required'
            );
          let primitiveIndex = 0;
          for (const selected of traverseMeshNodes(roots, placement)) {
            const resource = await extractPrimitive(
              selected.primitive,
              selected.transform,
              `${item.tile.id}/${content.index}/${primitiveIndex++}`,
              options.readExternalResource,
              content.uri,
              signal
            );
            const features = extractMeshFeatures(
              gltf,
              selected.primitive,
              payload,
              resource.mesh,
              options.features
            );
            yield {...resource, features};
          }
          if (!primitiveIndex)
            throw new TileConversionError(
              'MESH_SOURCE_CONTENT_EMPTY',
              'Declared content contains no supported mesh primitive'
            );
        }
      }
    }
  };
}

/** Walks scene placements without deduplicating a shared mesh or mutating postprocessed nodes. */
function* traverseMeshNodes(
  nodes: readonly GLTFNodePostprocessed[],
  parent: Matrix4,
  ancestors = new Set<GLTFNodePostprocessed>()
): Generator<{primitive: GLTFMeshPrimitivePostprocessed; transform: Matrix4}> {
  for (const node of nodes) {
    if (
      ancestors.has(node) ||
      node.skin ||
      node.weights ||
      Object.keys(node.extensions || {}).length
    )
      throw new TileConversionError(
        'MESH_SOURCE_NODE_UNSUPPORTED',
        'Cyclic, skinned, morphed, or extended nodes are unsupported'
      );
    const transform = new Matrix4(parent).multiplyRight(
      node.matrix
        ? new Matrix4(node.matrix)
        : new Matrix4()
            .translate(node.translation || [0, 0, 0])
            .multiplyRight(new Matrix4().fromQuaternion(node.rotation || [0, 0, 0, 1]))
            .scale(node.scale || [1, 1, 1])
    );
    if (node.mesh) {
      if (node.mesh.weights || Object.keys(node.mesh.extensions || {}).length)
        throw new TileConversionError(
          'MESH_SOURCE_NODE_UNSUPPORTED',
          'Morph weights and mesh extensions are unsupported'
        );
      for (const primitive of node.mesh.primitives) yield {primitive, transform};
    }
    yield* traverseMeshNodes(node.children || [], transform, new Set([...ancestors, node]));
  }
}

/** Copies one packed primitive, places it once, and derives a useful ECEF local origin. */
async function extractPrimitive(
  primitive: GLTFMeshPrimitivePostprocessed,
  transform: Matrix4,
  id: string,
  readExternalResource: MeshTilesetSourceOptions['readExternalResource'],
  contentUri: string | undefined,
  signal?: AbortSignal
): Promise<MeshSourceResource> {
  if (
    primitive.targets?.length ||
    Object.keys(primitive.extensions || {}).some(name => name !== 'EXT_mesh_features')
  )
    throw new TileConversionError(
      'MESH_SOURCE_PRIMITIVE_UNSUPPORTED',
      'Morph targets and unmapped primitive extensions are unsupported'
    );
  if (
    Array.from(transform).some(value => !Number.isFinite(value)) ||
    transform[3] !== 0 ||
    transform[7] !== 0 ||
    transform[11] !== 0 ||
    transform[15] !== 1 ||
    transform.determinant() <= 0
  )
    throw new TileConversionError(
      'MESH_SOURCE_TRANSFORM_INVALID',
      'Mesh placement requires a finite invertible affine transform with positive determinant'
    );
  const attributes: Record<string, MeshAttribute> = {};
  for (const [name, accessor] of Object.entries(primitive.attributes)) {
    if (name === '_BATCHID' || /^_FEATURE_ID_\d+$/.test(name)) continue;
    if (!['POSITION', 'NORMAL', 'COLOR_0', 'TEXCOORD_0'].includes(name))
      throw new TileConversionError(
        'MESH_SOURCE_ATTRIBUTE_UNSUPPORTED',
        `Unsupported mesh attribute ${name}`
      );
    attributes[name] = {
      value: accessor.value as MeshAttribute['value'],
      size: accessor.components,
      ...(accessor.normalized ? {normalized: true} : {})
    };
  }
  const mesh = validateMeshGeometry(
    {
      topology: 'triangle-list',
      mode: primitive.mode === 5 ? 4 : (primitive.mode ?? 4),
      attributes,
      indices: createTriangleIndices(primitive, (attributes.POSITION?.value.length ?? 0) / 3)
    },
    true
  );
  const sourcePositions = mesh.attributes.POSITION.value;
  const positions = new Float64Array(sourcePositions.length);
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < positions.length; index += 3) {
    const placed = transform.transformAsPoint(
      Array.from(sourcePositions.subarray(index, index + 3))
    );
    positions.set(placed, index);
    for (let axis = 0; axis < 3; axis++) {
      minimum[axis] = Math.min(minimum[axis], placed[axis]);
      maximum[axis] = Math.max(maximum[axis], placed[axis]);
    }
  }
  mesh.attributes.POSITION = {value: positions, size: 3};
  if (mesh.attributes.NORMAL) {
    const values = mesh.attributes.NORMAL.value;
    const normalMatrix = new Matrix4(transform).invert().transpose();
    const normals = new Float32Array(values.length);
    for (let index = 0; index < values.length; index += 3) {
      const normal = normalMatrix.transformAsVector(Array.from(values.subarray(index, index + 3)));
      const length = Math.hypot(...normal);
      normals.set(
        normal.map(value => value / length),
        index
      );
    }
    mesh.attributes.NORMAL = {value: normals, size: 3};
  }
  return {
    id,
    mesh,
    origin: minimum.map((value, axis) => value / 2 + maximum[axis] / 2) as [number, number, number],
    material: await mapMaterial(primitive.material, readExternalResource, contentUri, signal)
  };
}

/** Maps supported PBR controls and an embedded base-color image, rejecting unmapped semantics. */
async function mapMaterial(
  material: GLTFMaterialPostprocessed | undefined,
  readExternalResource: MeshTilesetSourceOptions['readExternalResource'],
  contentUri: string | undefined,
  signal?: AbortSignal
): Promise<MeshTileMaterial | undefined> {
  if (!material) return undefined;
  const pbr = material.pbrMetallicRoughness;
  if (
    Object.keys(material).some(
      name =>
        ![
          'id',
          'name',
          'pbrMetallicRoughness',
          'alphaMode',
          'alphaCutoff',
          'doubleSided',
          'emissiveFactor',
          'extras'
        ].includes(name)
    ) ||
    Object.keys(pbr || {}).some(
      name =>
        !['baseColorFactor', 'baseColorTexture', 'metallicFactor', 'roughnessFactor'].includes(name)
    ) ||
    material.emissiveFactor?.some(value => value !== 0)
  )
    throw new TileConversionError(
      'MESH_SOURCE_MATERIAL_UNSUPPORTED',
      'Only metallic-roughness factors and one embedded base-color image are supported'
    );
  return {
    baseColorFactor: pbr?.baseColorFactor as [number, number, number, number] | undefined,
    ...('baseColorTexture' in (pbr || {})
      ? {
          baseColorTexture: await resolveMeshSourceTexture(
            pbr!.baseColorTexture,
            readExternalResource,
            contentUri,
            signal
          )
        }
      : {}),
    metallicFactor: pbr?.metallicFactor,
    roughnessFactor: pbr?.roughnessFactor,
    alphaMode: material.alphaMode as MeshTileMaterial['alphaMode'],
    ...(material.alphaMode === 'MASK' ? {alphaCutoff: material.alphaCutoff ?? 0.5} : {}),
    doubleSided: material.doubleSided
  };
}

/** Expands a strip without changing vertex storage, feature IDs, source indices, or parity. */
function createTriangleIndices(
  primitive: GLTFMeshPrimitivePostprocessed,
  vertexCount: number
): MeshAttribute | undefined {
  const attribute = primitive.indices
    ? {
        value: primitive.indices.value as MeshAttribute['value'],
        size: primitive.indices.components,
        normalized: primitive.indices.normalized
      }
    : undefined;
  if (primitive.mode !== 5) return attribute;
  const sourceIndices = validateMeshIndices(attribute, vertexCount, 5);
  const indexCount = sourceIndices?.length ?? vertexCount;
  if (!Number.isSafeInteger(indexCount) || indexCount < 3) {
    throw new TileConversionError(
      'MESH_TRIANGLE_COUNT_INVALID',
      'Triangle strips require at least three vertices'
    );
  }
  const IndexArray = vertexCount < 65536 ? Uint16Array : Uint32Array;
  const indices = new IndexArray((indexCount - 2) * 3);
  for (let triangle = 0; triangle < indexCount - 2; triangle++) {
    // Match the glTF strip equation, including degenerate connectors; they advance parity too.
    const second = triangle + 1 + (triangle % 2);
    const third = triangle + 2 - (triangle % 2);
    indices[triangle * 3] = sourceIndices?.[triangle] ?? triangle;
    indices[triangle * 3 + 1] = sourceIndices?.[second] ?? second;
    indices[triangle * 3 + 2] = sourceIndices?.[third] ?? third;
  }
  return {value: indices, size: 1};
}
