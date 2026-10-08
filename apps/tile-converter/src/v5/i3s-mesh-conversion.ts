// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encodeI3SMeshLayer, encodeI3SMeshLayerWithDraco} from '@loaders.gl/i3s';
import type {
  EncodedI3SMeshLayer,
  I3SMeshWriterOptions,
  I3SDracoLibraryOptions
} from '@loaders.gl/i3s';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {TileConversionCodec, TileConversionSink} from '@loaders.gl/tile-converter/v5/core';
import type {Tiles3DConversionSpatialContext} from '@loaders.gl/tile-converter/v5/core';
import type {MeshSourceResource} from './mesh-source.js';
import {validateMeshGeometry} from './mesh.js';
import {createBoundedMemoryTileConversionSink} from '@loaders.gl/tile-converter/v5/core';
import type {BrowserTileConversionFile} from '@loaders.gl/tile-converter/v5/core';

/** One authored mesh layer, ready for the single-layer sink. */
export interface I3SMeshConversionResource extends EncodedI3SMeshLayer {
  /** Source placement identifier used for diagnostics. */
  readonly id: string;
}

/** Spatial preparation and required authoring limits for the I3S codec. */
export interface I3SMeshConversionCodecOptions
  extends Pick<I3SMeshWriterOptions, 'name' | 'maxPositionError' | 'maxResourceBytes'> {
  /** Shared source-to-ECEF context, applied exactly once before I3S geographic encoding. */
  readonly spatialContext: Tiles3DConversionSpatialContext;
  /** Lossless Edge Breaker geometry by default; false retains raw I3S geometry. */
  readonly draco?: boolean;
  /** Full Draco encoder/decoder runtime URLs or injected modules. */
  readonly dracoLibraryOptions?: I3SDracoLibraryOptions;
}

/** Creates a portable source-mesh to I3S layer codec with explicit precision and feature diagnostics. */
export function createI3SMeshConversionCodec<TInspection = unknown>(
  options: I3SMeshConversionCodecOptions
): TileConversionCodec<TInspection, MeshSourceResource, I3SMeshConversionResource> {
  const reference = options.spatialContext.spatialReference;
  const height =
    reference.targetHeightReference === 'native'
      ? reference.heightReference
      : reference.targetHeightReference;
  if (
    !['native', 'transformed'].includes(reference.status) ||
    (reference.targetCrs || reference.sourceCrs) !== 'EPSG:4978' ||
    height !== 'ellipsoidal' ||
    (reference.status === 'native' &&
      (!['xyz', 'unknown'].includes(reference.axisOrder) ||
        reference.verticalUnitScale !== 1 ||
        reference.units?.some(unit => unit !== 'meter')))
  )
    throw new TileConversionError(
      'I3S_MESH_FRAME_UNSUPPORTED',
      'I3S mesh authoring requires resolved ECEF coordinates and ellipsoidal heights'
    );
  let objectIdOffset = 0;
  return {
    /** Places a source mesh in ECEF and authors one layer without modifying source arrays. */
    async *convert(resource, _inspection, signal) {
      signal?.throwIfAborted();
      const mesh = validateMeshGeometry(resource.mesh, true);
      const positions = mesh.attributes.POSITION.value;
      mesh.attributes.POSITION = {
        value: options.spatialContext.transformPositions(positions),
        size: 3
      };
      if (mesh.attributes.NORMAL)
        mesh.attributes.NORMAL = {
          value: options.spatialContext.transformNormals(mesh.attributes.NORMAL.value, positions),
          size: 3
        };
      let layer: EncodedI3SMeshLayer;
      try {
        const writerOptions = {
          ...options,
          material: resource.material,
          features: resource.features,
          objectIdOffset
        };
        layer =
          options.draco === false
            ? encodeI3SMeshLayer(mesh, writerOptions)
            : await encodeI3SMeshLayerWithDraco(mesh, writerOptions, options.dracoLibraryOptions);
      } catch (error) {
        throw new TileConversionError(
          'I3S_MESH_PROFILE_UNSUPPORTED',
          error instanceof Error ? error.message : String(error)
        );
      }
      signal?.throwIfAborted();
      objectIdOffset +=
        resource.features?.batches.reduce((total, batch) => total + batch.data.numRows, 0) ?? 1;
      yield {id: resource.id, ...layer};
    },
    /** Reports measured precision and explicitly authorized integer representation changes. */
    async validateOutput(resource) {
      return [
        ...(resource.maximumPositionError > 0
          ? [
              {
                code: 'I3S_MESH_POSITION_ROUNDING',
                message: `I3S positions have up to ${resource.maximumPositionError} meters reconstruction error`,
                severity: 'info' as const,
                resourceId: resource.id
              }
            ]
          : []),
        ...resource.decimalStringFields.map(field => ({
          code: 'I3S_INTEGER_DECIMAL_STRING',
          message: `Explicitly represented 64-bit integer field ${field} as exact decimal text`,
          severity: 'info' as const,
          resourceId: resource.id
        }))
      ];
    }
  };
}

/** Atomic bounded output for one authored I3S layer. */
export interface SingleMeshI3SSink extends TileConversionSink<I3SMeshConversionResource> {
  /** Archive-relative geometry, metadata and images visible only after successful finalization. */
  getFiles(): readonly BrowserTileConversionFile[];
}

/** Creates an atomic bounded single-mesh I3S sink; pass finalized files to createTileConversionArchive. */
export function createSingleMeshI3SSink(options: {
  /** Maximum retained compressed resource bytes; not peak conversion memory. */ readonly maxTotalBytes: number;
}): SingleMeshI3SSink {
  const memory = createBoundedMemoryTileConversionSink(options);
  let state: 'empty' | 'writing' | 'written' | 'closed' = 'empty';
  let completed = false;
  return {
    /** Exposes resources only after successful finalization. */
    getFiles: () => (completed ? memory.getFiles() : []),
    /** Writes exactly one layer within the retained-resource budget. */
    async write(resource, signal) {
      signal?.throwIfAborted();
      if (state !== 'empty')
        throw new TileConversionError(
          'SINGLE_I3S_MESH_UNAVAILABLE',
          'The initial I3S sink accepts exactly one mesh layer'
        );
      state = 'writing';
      for (const [resourceId, bytes] of Object.entries(resource.files))
        await memory.write(
          {
            resourceId,
            parts: [bytes],
            contentType: resourceId.endsWith('.png')
              ? 'image/png'
              : resourceId.endsWith('.jpg')
                ? 'image/jpeg'
                : 'application/gzip'
          },
          signal
        );
      state = 'written';
    },
    /** Commits a complete single-layer result. */
    async finalize(report) {
      if (state !== 'written')
        throw new TileConversionError(
          'SINGLE_I3S_MESH_INCOMPLETE',
          'Finalization requires exactly one successfully written layer'
        );
      await memory.finalize(report);
      state = 'closed';
      completed = true;
    },
    /** Discards all resources after any conversion failure. */
    async abort(error) {
      completed = false;
      state = 'closed';
      await memory.abort(error);
    }
  };
}
