// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Tiles3DTilesetJSON, Tiles3DTileJSON} from '@loaders.gl/3d-tiles';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {TileConversionSink} from '@loaders.gl/tile-converter/v5/core';
import {createBoundedMemoryTileConversionSink} from '@loaders.gl/tile-converter/v5/core';
import type {BrowserTileConversionFile} from '@loaders.gl/tile-converter/v5/core';
import type {EncodedMeshConversionResource} from './mesh-conversion.js';

/** Limits and fidelity policy for one ECEF mesh tileset. */
export interface SingleMeshTilesetSinkOptions {
  /** Maximum combined UTF-8 tileset JSON and GLB Blob bytes retained by the sink. */
  readonly maxTotalBytes: number;
  /** Explicit geometric error in meters, including source error and position rounding. */
  readonly geometricError: number;
}

/** A single-tile output package retained as two named browser-native Blobs. */
export interface SingleMeshTilesetSink extends TileConversionSink<EncodedMeshConversionResource> {
  /** Returns mesh.glb and tileset.json only after successful finalization; empty after abort. */
  getFiles(): readonly BrowserTileConversionFile[];
}

/**
 * Packages exactly one `createMeshConversionCodec` output as a 3D Tiles 1.1 tileset.
 *
 * Requires resolved EPSG:4978 output identified by the compact string, with ellipsoidal heights.
 * The tile transform cancels the standard glTF y-up to z-up rotation and adds the ECEF origin.
 * Bounds come from encoded local vertices, avoiding subtraction of large absolute coordinates.
 * Fixed relative names keep the package deterministic. Save both files together or pass them to
 * createSingleMeshTilesetArchive for 3TZ packaging. Applications own downloads, workers, and
 * source-scene extraction.
 * The byte limit bounds retained Blobs, not peak conversion/serialization memory. Input GLB and
 * local bounds must be unmodified codec outputs; this sink does not independently validate GLB.
 *
 * @param options - Required retained-output budget and geometric error in meters.
 * @returns A bounded sink that exposes files on finalization and clears them on abort.
 */
export function createSingleMeshTilesetSink(
  options: SingleMeshTilesetSinkOptions
): SingleMeshTilesetSink {
  const {geometricError} = options;
  if (!Number.isFinite(geometricError) || geometricError < 0) {
    throw new TileConversionError(
      'MESH_GEOMETRIC_ERROR_INVALID',
      'geometricError must be finite and nonnegative, in meters'
    );
  }
  const memorySink = createBoundedMemoryTileConversionSink(options);
  let state: 'empty' | 'writing' | 'written' | 'closed' = 'empty';
  let completed = false;

  return {
    getFiles() {
      return completed ? memorySink.getFiles() : [];
    },
    async write(resource, signal) {
      signal?.throwIfAborted();
      if (state !== 'empty') {
        throw new TileConversionError(
          'SINGLE_MESH_SINK_UNAVAILABLE',
          'The sink accepts exactly one mesh before finalization or abort'
        );
      }
      const json = JSON.stringify(createMeshTileset(resource, geometricError));
      state = 'writing';
      await memorySink.write(
        {resourceId: 'mesh.glb', parts: [resource.glb], contentType: 'model/gltf-binary'},
        signal
      );
      await memorySink.write(
        {resourceId: 'tileset.json', parts: [json], contentType: 'application/json'},
        signal
      );
      state = 'written';
    },
    async finalize(report) {
      if (state !== 'written') {
        throw new TileConversionError(
          'SINGLE_MESH_SINK_INCOMPLETE',
          'Finalization requires exactly one successfully written mesh'
        );
      }
      await memorySink.finalize(report);
      state = 'closed';
      completed = true;
    },
    async abort(error) {
      state = 'closed';
      completed = false;
      await memorySink.abort(error);
    }
  };
}

/** Builds placement and local bounds for a trusted single-mesh codec output. */
function createMeshTileset(
  resource: EncodedMeshConversionResource,
  geometricError: number
): Omit<Tiles3DTilesetJSON, 'root'> & {root: Omit<Tiles3DTileJSON, 'children'>} {
  const reference = resource.spatialReference;
  const outputCrs = reference.targetCrs || reference.sourceCrs;
  const heightReference =
    reference.targetHeightReference === 'native'
      ? reference.heightReference
      : reference.targetHeightReference;
  if (
    !['native', 'transformed'].includes(reference.status) ||
    outputCrs !== 'EPSG:4978' ||
    heightReference !== 'ellipsoidal' ||
    (reference.status === 'native' &&
      (reference.coordinateFrame !== 'geocentric' ||
        reference.axisOrder !== 'xyz' ||
        reference.verticalUnitScale !== 1 ||
        reference.units?.some(unit => unit !== 'meter')))
  ) {
    throw new TileConversionError(
      'MESH_TILESET_FRAME_UNSUPPORTED',
      'Single-mesh tilesets require resolved EPSG:4978 xyz coordinates in meters with ellipsoidal heights'
    );
  }
  if (
    !Number.isFinite(resource.maximumPositionError) ||
    resource.maximumPositionError < 0 ||
    resource.maximumPositionError > geometricError
  ) {
    throw new TileConversionError(
      'MESH_GEOMETRIC_ERROR_INVALID',
      'geometricError must include the measured position reconstruction error'
    );
  }
  const origin = [...resource.origin];
  const [minimum, maximum] = resource.localBoundingBox.map(bound => [...bound]);
  if (
    origin.length !== 3 ||
    minimum.length !== 3 ||
    maximum.length !== 3 ||
    [...origin, ...minimum, ...maximum].some(value => !Number.isFinite(value)) ||
    minimum.some((value, axis) => value > maximum[axis])
  ) {
    throw new TileConversionError(
      'MESH_TILESET_BOUNDS_INVALID',
      'Origin and local bounds must be finite xyz coordinates with ordered bounds'
    );
  }
  const center = minimum.map((value, axis) => value / 2 + maximum[axis] / 2);
  const halfSize = minimum.map((value, axis) => maximum[axis] / 2 - value / 2);
  return {
    asset: {version: '1.1'},
    geometricError,
    root: {
      // 3D Tiles applies y-up -> z-up to GLB content before the tile transform.
      transform: [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, ...origin, 1],
      boundingVolume: {
        // Bounds use the same y-up -> z-up rotation before the inverse tile rotation.
        box: [
          center[0],
          -center[2],
          center[1],
          halfSize[0],
          0,
          0,
          0,
          0,
          halfSize[1],
          0,
          -halfSize[2],
          0
        ]
      },
      geometricError,
      refine: 'REPLACE',
      content: {uri: 'mesh.glb'}
    }
  };
}

/** Limits for an explicit collection of independent ECEF mesh leaves. */
export interface MeshTilesetSinkOptions extends SingleMeshTilesetSinkOptions {
  /** Maximum mesh placements, including repeated content at distinct source placements. */
  readonly maxMeshes: number;
}

/** Atomic mesh package with a contentless root and independently placed GLB leaves. */
export interface MeshTilesetSink extends TileConversionSink<EncodedMeshConversionResource> {
  /** Returns deterministically named GLBs and tileset JSON only after finalization. */
  getFiles(): readonly BrowserTileConversionFile[];
}

/**
 * Packages independent codec outputs as a bounded 3D Tiles 1.1 leaf collection.
 * Each leaf retains its ECEF placement and encoded bounds; the contentless ADD root encloses
 * all leaves. This authors a flat partial dataset, not the source LOD hierarchy. Callers must
 * exclude overlapping parent/descendant LOD representations and provide a conservative error.
 * Resource IDs identify placements, never output paths. Retained bytes include final JSON;
 * maxMeshes bounds hierarchy metadata, while neither limit bounds peak conversion memory.
 */
export function createMeshTilesetSink(options: MeshTilesetSinkOptions): MeshTilesetSink {
  const {geometricError, maxMeshes} = options;
  if (
    !Number.isFinite(geometricError) ||
    geometricError < 0 ||
    !Number.isSafeInteger(maxMeshes) ||
    maxMeshes < 1
  ) {
    throw new TileConversionError(
      'MESH_TILESET_OPTIONS_INVALID',
      'A leaf collection requires finite nonnegative geometricError and positive maxMeshes'
    );
  }
  const memory = createBoundedMemoryTileConversionSink(options);
  const children: ReturnType<typeof createMeshTileset>['root'][] = [];
  const identifiers = new Set<string>();
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  let state: 'open' | 'writing' | 'closed' = 'open';
  let completed = false;
  return {
    /** Exposes the complete package atomically. */
    getFiles: () => (completed ? memory.getFiles() : []),
    /** Retains one placement and its corresponding encoded GLB. */
    async write(resource, signal) {
      signal?.throwIfAborted();
      if (state !== 'open')
        throw new TileConversionError(
          'MESH_TILESET_SINK_UNAVAILABLE',
          'The mesh sink is busy or closed'
        );
      if (children.length >= maxMeshes || identifiers.has(resource.id))
        throw new TileConversionError(
          'MESH_TILESET_PLACEMENT_INVALID',
          'Mesh count exceeds maxMeshes or a placement identifier is repeated'
        );
      const tile = createMeshTileset(resource, geometricError).root;
      const lower = resource.localBoundingBox[0].map(
        (value, axis) => value + resource.origin[axis]
      );
      const upper = resource.localBoundingBox[1].map(
        (value, axis) => value + resource.origin[axis]
      );
      if ([...lower, ...upper].some(value => !Number.isFinite(value)))
        throw new TileConversionError(
          'MESH_TILESET_BOUNDS_INVALID',
          'Absolute bounds must be finite'
        );
      const resourceId = `meshes/${children.length}.glb`;
      tile.content = {uri: resourceId};
      state = 'writing';
      await memory.write(
        {resourceId, parts: [resource.glb], contentType: 'model/gltf-binary'},
        signal
      );
      children.push(tile);
      identifiers.add(resource.id);
      for (let axis = 0; axis < 3; axis++) {
        minimum[axis] = Math.min(minimum[axis], lower[axis]);
        maximum[axis] = Math.max(maximum[axis], upper[axis]);
      }
      state = 'open';
    },
    /** Writes the enclosing root only when every leaf has completed. */
    async finalize(report) {
      if (state !== 'open' || !children.length)
        throw new TileConversionError(
          'MESH_TILESET_SINK_INCOMPLETE',
          'Finalization requires written mesh leaves'
        );
      state = 'writing';
      const center = minimum.map((value, axis) => value / 2 + maximum[axis] / 2);
      const halfSize = minimum.map((value, axis) => maximum[axis] / 2 - value / 2);
      const json = JSON.stringify({
        asset: {version: '1.1'},
        geometricError,
        root: {
          boundingVolume: {
            box: [
              center[0],
              center[1],
              center[2],
              halfSize[0],
              0,
              0,
              0,
              halfSize[1],
              0,
              0,
              0,
              halfSize[2]
            ]
          },
          geometricError,
          refine: 'ADD',
          children
        }
      });
      await memory.write({
        resourceId: 'tileset.json',
        parts: [json],
        contentType: 'application/json'
      });
      await memory.finalize(report);
      state = 'closed';
      completed = true;
    },
    /** Discards files and hierarchy metadata on failure or cancellation. */
    async abort(error) {
      state = 'closed';
      completed = false;
      children.length = 0;
      identifiers.clear();
      await memory.abort(error);
    }
  };
}
