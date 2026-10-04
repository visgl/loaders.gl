// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Tiles3DTilesetJSON, Tiles3DTileJSON} from '@loaders.gl/3d-tiles';
import {TileConversionError} from './conversion-api.js';
import type {TileConversionSink} from './conversion-api.js';
import {createBoundedMemoryTileConversionSink} from './browser-sink.js';
import type {BrowserTileConversionFile} from './browser-sink.js';
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
