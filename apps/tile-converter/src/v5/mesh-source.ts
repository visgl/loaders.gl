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
import {validateMeshGeometry} from './mesh.js';
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
}

/**
 * Extracts static untextured GLB/B3DM primitives from a native ECEF 3D Tiles runtime.
 * Shared traversal retains placement identity and unloads content according to the supplied policy.
 * The adapter applies node transforms, glTF up-axis correction, RTC translation, and tile placement
 * once, retaining Float64 absolute positions and inverse-transpose unit normals. Animation, skins,
 * morphs, instancing, textures, unknown extensions, non-affine/mirrored placements, and
 * metadata outside the declared feature profile fail explicitly. Multiple resources can be read;
 * the single-mesh I3S sink rejects a second resource and aborts the entire output.
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
            const resource = extractPrimitive(
              selected.primitive,
              selected.transform,
              `${item.tile.id}/${content.index}/${primitiveIndex++}`
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
function extractPrimitive(
  primitive: GLTFMeshPrimitivePostprocessed,
  transform: Matrix4,
  id: string
): MeshSourceResource {
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
    if (!['POSITION', 'NORMAL', 'COLOR_0'].includes(name))
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
      mode: primitive.mode ?? 4,
      attributes,
      indices: primitive.indices
        ? {value: primitive.indices.value as MeshAttribute['value'], size: 1}
        : undefined
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
    material: mapMaterial(primitive.material)
  };
}

/** Maps supported untextured PBR controls, rejecting all unrepresented rendering semantics. */
function mapMaterial(
  material: GLTFMaterialPostprocessed | undefined
): MeshTileMaterial | undefined {
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
      name => !['baseColorFactor', 'metallicFactor', 'roughnessFactor'].includes(name)
    ) ||
    material.emissiveFactor?.some(value => value !== 0)
  )
    throw new TileConversionError(
      'MESH_SOURCE_MATERIAL_UNSUPPORTED',
      'Only untextured metallic-roughness material factors are supported'
    );
  return {
    baseColorFactor: pbr?.baseColorFactor as [number, number, number, number] | undefined,
    metallicFactor: pbr?.metallicFactor,
    roughnessFactor: pbr?.roughnessFactor,
    alphaMode: material.alphaMode as MeshTileMaterial['alphaMode'],
    ...(material.alphaMode === 'MASK' ? {alphaCutoff: material.alphaCutoff ?? 0.5} : {}),
    doubleSided: material.doubleSided
  };
}
