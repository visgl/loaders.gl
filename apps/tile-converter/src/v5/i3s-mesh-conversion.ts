// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Ellipsoid} from '@math.gl/geospatial';
import {
  encodeI3SMeshLayer,
  encodeI3SMeshLayerWithDraco,
  preloadI3SMeshCompression
} from '@loaders.gl/tiles-3d/i3s';
import type {
  EncodedI3SMeshLayer,
  I3SMeshWriterOptions,
  I3SDracoLibraryOptions
} from '@loaders.gl/tiles-3d/i3s';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {TileConversionCodec, TileConversionSink} from '@loaders.gl/tile-converter/v5/core';
import type {
  Tiles3DConversionSpatialContext,
  I3SConversionSpatialContext
} from '@loaders.gl/tile-converter/v5/core';
import type {MeshSourceResource} from './mesh-source.js';
import {validateMeshGeometry} from './mesh.js';
import {createBoundedMemoryTileConversionSink} from '@loaders.gl/tile-converter/v5/core';
import type {BrowserTileConversionFile} from '@loaders.gl/tile-converter/v5/core';

/** One authored mesh layer, ready for the single-layer sink. */
export interface I3SMeshConversionResource extends EncodedI3SMeshLayer {
  /** Source placement identifier used for diagnostics. */
  readonly id: string;
  /** Whether a source outline was omitted. */
  readonly omittedPrimitiveOutline?: boolean;
  /** Original I3S layer type when authoring from an I3S source. */
  readonly sourceLayerType?: '3DObject' | 'IntegratedMesh';
}

/** Spatial preparation and required authoring limits for the I3S codec. */
export interface I3SMeshConversionCodecOptions
  extends Pick<
    I3SMeshWriterOptions,
    | 'name'
    | 'maxPositionError'
    | 'maxResourceBytes'
    | 'omitFeatureIdAttribute'
    | 'declareEgm2008Heights'
  > {
  /** Shared source-to-ECEF context, applied exactly once before I3S geographic encoding. */
  readonly spatialContext: Tiles3DConversionSpatialContext | I3SConversionSpatialContext;
  /** I3S vector frame when using an I3S context; defaults to earth-centered. */
  readonly normalReferenceFrame?: 'earth-centered' | 'vertex-reference-frame';
  /** Lossless Edge Breaker geometry by default; false retains raw I3S geometry. */
  readonly draco?: boolean;
  /** Share IDs for legacy batch-table rows across parts of one content placement. */
  readonly shareSourceObjectIds?: boolean;
  /** Explicitly authorize IntegratedMesh input to become 3DObject output; omission rejects it. */
  readonly integratedMeshPolicy?: 'as-3d-object';
  /** EGM2008 undulation in meters for a latitude and longitude in degrees. */
  readonly egm2008Geoid?: {getHeight(latitude: number, longitude: number): number};
  /** Full Draco encoder/decoder runtime URLs or injected modules. */
  readonly dracoLibraryOptions?: I3SDracoLibraryOptions;
}

/** Creates a portable source-mesh to I3S layer codec with explicit precision and feature diagnostics. */
export function createI3SMeshConversionCodec<TInspection = unknown>(
  options: I3SMeshConversionCodecOptions
): TileConversionCodec<TInspection, MeshSourceResource, I3SMeshConversionResource> {
  if (
    options.integratedMeshPolicy !== undefined &&
    options.integratedMeshPolicy !== 'as-3d-object'
  ) {
    throw new TileConversionError(
      'I3S_LAYER_TYPE_POLICY_INVALID',
      'Unknown IntegratedMesh conversion policy'
    );
  }
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
  /** Each content placement owns its own legacy row namespace. */
  const objectIdsByContent = new Map<string, Map<number, number>>();
  return {
    /** Places a source mesh in ECEF and authors one layer without modifying source arrays. */
    async *convert(resource, _inspection, signal) {
      signal?.throwIfAborted();
      if (
        resource.sourceLayerType === 'IntegratedMesh' &&
        options.integratedMeshPolicy !== 'as-3d-object'
      ) {
        throw new TileConversionError(
          'I3S_LAYER_TYPE_CHANGE_REQUIRED',
          'IntegratedMesh to 3DObject conversion requires integratedMeshPolicy=as-3d-object'
        );
      }
      const mesh = validateMeshGeometry(resource.mesh, true);
      const positions = mesh.attributes.POSITION.value;
      const context = options.spatialContext;
      const transformed =
        'transformGeometryAsync' in context
          ? await context.transformGeometryAsync(
              positions,
              mesh.attributes.NORMAL?.value,
              resource.normalReferenceFrame ?? options.normalReferenceFrame
            )
          : {
              positions: context.transformPositions(positions),
              normals: mesh.attributes.NORMAL
                ? context.transformNormals(mesh.attributes.NORMAL.value, positions)
                : undefined
            };
      signal?.throwIfAborted();
      mesh.attributes.POSITION = {
        value: options.egm2008Geoid
          ? subtractEgm2008Undulation(transformed.positions, options.egm2008Geoid)
          : transformed.positions,
        size: 3
      };
      if (mesh.attributes.NORMAL) mesh.attributes.NORMAL = {value: transformed.normals!, size: 3};
      let layer: EncodedI3SMeshLayer;
      try {
        await preloadI3SMeshCompression();
        /** Original row indices retain identity when each primitive selects a different subset. */
        const rows = resource.features?.sourceBatchRows;
        /** Selection supplies a distinct identifier even for repeated payload URLs. */
        const contentId = resource.contentResourceId;
        /** Explicit row-to-ID mapping for the current primitive. */
        let objectIds: number[] | undefined;
        if (options.shareSourceObjectIds && contentId && rows) {
          /** Persistent row mapping for the current placement. */
          const contentIds = objectIdsByContent.get(contentId) ?? new Map<number, number>();
          objectIdsByContent.set(contentId, contentIds);
          objectIds = rows.map(row => {
            /** Reuse an allocated ID even when the current node has a different row order. */
            const existing = contentIds.get(row);
            if (existing !== undefined) return existing;
            /** This row has never appeared in the conversion. */
            const id = objectIdOffset++;
            contentIds.set(row, id);
            return id;
          });
        } else {
          objectIds = Array.from(
            {
              length:
                resource.features?.batches.reduce((total, batch) => total + batch.numRows, 0) ?? 1
            },
            () => objectIdOffset++
          );
        }
        const writerOptions = {
          ...options,
          declareEgm2008Heights: Boolean(options.egm2008Geoid) || options.declareEgm2008Heights,
          material: resource.material,
          features: resource.features,
          objectIds
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
      yield {
        id: resource.id,
        ...layer,
        sourceLayerType: resource.sourceLayerType,
        omittedPrimitiveOutline: resource.omittedPrimitiveOutline
      };
    },
    /** Reports measured precision and explicitly authorized integer representation changes. */
    async validateOutput(resource) {
      return [
        ...(resource.omittedPrimitiveOutline
          ? [
              {
                code: 'MESH_PRIMITIVE_OUTLINE_OMITTED',
                message: 'The target mesh profile does not retain CESIUM_primitive_outline',
                severity: 'warning' as const,
                resourceId: resource.id
              }
            ]
          : []),
        ...(resource.sourceLayerType === 'IntegratedMesh'
          ? [
              {
                code: 'I3S_LAYER_TYPE_CHANGED',
                message:
                  'Explicitly authored IntegratedMesh geometry as I3S 1.7 3DObject; integrated surface layer semantics and source LOD are not preserved',
                severity: 'warning' as const,
                resourceId: resource.id
              }
            ]
          : []),
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

/** Returns ECEF-like positions whose derived height is orthometric, leaving input data intact. */
function subtractEgm2008Undulation(
  positions: Float64Array | Float32Array,
  geoid: NonNullable<I3SMeshConversionCodecOptions['egm2008Geoid']>
): Float64Array {
  const corrected = new Float64Array(positions.length);
  for (let offset = 0; offset < positions.length; offset += 3) {
    const geographic = Ellipsoid.WGS84.cartesianToCartographic(
      positions.subarray(offset, offset + 3)
    );
    const undulation = geoid.getHeight(geographic[1], geographic[0]);
    if (!Number.isFinite(undulation))
      throw new TileConversionError(
        'INVALID_EGM2008_GRID',
        'EGM2008 grid returned an invalid height'
      );
    geographic[2] -= undulation;
    corrected.set(Ellipsoid.WGS84.cartographicToCartesian(geographic), offset);
  }
  return corrected;
}
