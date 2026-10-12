// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {get3DTilesSpatialReference} from '@loaders.gl/tiles';
import {
  TileConversionError,
  createBoundedMemoryTileConversionSink,
  createTiles3DConversionSpatialContext
} from '@loaders.gl/tile-converter/v5/core';
import type {BrowserTilesetConversionInspection} from '@loaders.gl/tile-converter/v5/core';
import {createMeshTileset} from './mesh-tileset-sink.js';
import type {MeshTilesetSink} from './mesh-tileset-sink.js';

/** JSON fields requiring explicit qualification before hierarchy preservation. */
type SourceTile = NonNullable<BrowserTilesetConversionInspection['tileset']['root']> & {
  /** Effective refinement; the root must declare this policy. */
  refine?: 'ADD' | 'REPLACE';
  /** Children with the same explicit JSON shape. */
  children?: SourceTile[];
  /** Unsupported source metadata. */
  metadata?: unknown;
  /** Unsupported view-dependent traversal volume. */
  viewerRequestVolume?: unknown;
};

/** Output node with a box in its own frame and relative child placements. */
interface OutputTile {
  /** Placement relative to the parent, absolute at the root. */
  transform: number[];
  /** Conservative box enclosing converted subtree geometry. */
  boundingVolume: {box: number[]};
  /** Scaled source error plus the reconstruction allowance, in meters. */
  geometricError: number;
  /** Explicit effective source refinement. */
  refine: 'ADD' | 'REPLACE';
  /** Converted GLB, absent on contentless source ancestors. */
  content?: {uri: string};
  /** Original immediate children in declaration order. */
  children?: OutputTile[];
}

/** A qualified source tile; indexes retain original child order, including contentless ancestors. */
interface HierarchyNode {
  /** Indexes of this tile's immediate children. */
  readonly children: number[];
  /** Source content placement, absent on contentless ancestors. */
  readonly resourceId?: string;
  /** Source metric error in the baked ECEF frame. */
  readonly geometricError: number;
  /** Effective source refinement, including inheritance. */
  readonly refine: 'ADD' | 'REPLACE';
}

/** A bounded tree with a metric dataset error and no omitted content. */
interface MeshHierarchy {
  /** Parent-before-child nodes in declaration order. */
  readonly nodes: HierarchyNode[];
  /** Dataset-level source error in meters. */
  readonly geometricError: number;
  /** Native source coordinate epoch; outputs must retain this same frame. */
  readonly coordinateEpoch?: number;
}

/** Input and retained-byte policy for complete explicit hierarchy conversion. */
export interface MeshHierarchyTilesetSinkOptions {
  /** Immutable inspection used by the selected mesh source. External documents are unsupported. */
  readonly inspection: BrowserTilesetConversionInspection;
  /** Every inspected content placement, with no duplicates or omissions; at most 64. */
  readonly resourceIds: readonly string[];
  /** Maximum combined GLB and final JSON bytes retained by the sink. */
  readonly maxTotalBytes: number;
  /** Finite nonnegative position error allowance in meters, added to each source error. */
  readonly maxPositionError: number;
}

/** Qualifies a complete, single-document explicit tree before any geometry is read. */
export function prepareMeshHierarchy(
  inspection: BrowserTilesetConversionInspection,
  resourceIds: readonly string[]
): MeshHierarchy {
  /** Rejects hierarchy profiles whose semantics cannot be retained. */
  const rejectHierarchy: (message: string) => never = message => {
    throw new TileConversionError('MESH_HIERARCHY_UNSUPPORTED', message);
  };
  if (inspection.documents && inspection.documents.length !== 1)
    rejectHierarchy('Hierarchy preservation currently requires one explicit document');
  if (
    !resourceIds.length ||
    resourceIds.length > 64 ||
    new Set(resourceIds).size !== resourceIds.length ||
    resourceIds.length !== inspection.resources.length ||
    inspection.resources.some(resource => !resourceIds.includes(resource.resourceId))
  )
    rejectHierarchy(
      'Hierarchy preservation requires every content placement, without duplicates (at most 64)'
    );
  const document = inspection.tileset as BrowserTilesetConversionInspection['tileset'] & {
    /** Root with hierarchy qualification fields. */
    root: SourceTile;
    /** Optional dataset-level metric error. */
    geometricError?: number;
    /** Only the already-qualified native CRS extension can be retained. */
    extensions?: Record<string, unknown>;
    /** Required source extensions. */
    extensionsRequired?: string[];
    /** Dataset metadata requires separate authoring policy. */
    metadata?: unknown;
    /** Content groups require separate authoring policy. */
    groups?: unknown;
    /** Feature schemas require separate authoring policy. */
    schema?: unknown;
    /** External feature schemas require separate authoring policy. */
    schemaUri?: unknown;
  };
  if (
    document.metadata ||
    document.groups ||
    document.schema ||
    document.schemaUri ||
    Object.keys(document.extensions ?? {}).some(name => name !== 'EXT_geospatial_crs') ||
    (document.extensionsRequired ?? []).some((name: string) => name !== 'EXT_geospatial_crs')
  )
    rejectHierarchy(
      'Dataset metadata and unmapped extensions require a separate hierarchy profile'
    );
  if (!['1.0', '1.1'].includes(document.asset?.version ?? ''))
    rejectHierarchy('Hierarchy preservation requires a 3D Tiles 1.0 or 1.1 document');
  const spatialReference = createTiles3DConversionSpatialContext(
    get3DTilesSpatialReference(document as Parameters<typeof get3DTilesSpatialReference>[0])
  ).spatialReference;
  if (
    spatialReference.status !== 'native' ||
    spatialReference.sourceCrs !== 'EPSG:4978' ||
    spatialReference.heightReference !== 'ellipsoidal' ||
    spatialReference.axisOrder !== 'xyz' ||
    spatialReference.verticalUnitScale !== 1 ||
    spatialReference.units?.some(unit => unit !== 'meter')
  )
    rejectHierarchy(
      'Hierarchy preservation requires native EPSG:4978 xyz meters and ellipsoidal heights'
    );
  const nodes: HierarchyNode[] = [];
  const stack = [
    {
      tile: document.root,
      path: [] as number[],
      parent: -1,
      transform: new Matrix4(),
      refine: undefined as 'ADD' | 'REPLACE' | undefined
    }
  ];
  while (stack.length) {
    const {tile, path, parent, transform: parentTransform, refine: inheritedRefine} = stack.pop()!;
    if (nodes.length >= 256) rejectHierarchy('Hierarchy preservation supports at most 256 tiles');
    if (
      !tile ||
      typeof tile !== 'object' ||
      Array.isArray(tile) ||
      tile.implicitTiling !== undefined ||
      tile.extensions !== undefined ||
      tile.metadata !== undefined ||
      tile.viewerRequestVolume !== undefined ||
      tile.contents !== undefined ||
      (tile.children !== undefined && !Array.isArray(tile.children))
    )
      rejectHierarchy(
        'Hierarchy tiles require explicit children, one content and no unmapped metadata, extensions or request volumes'
      );
    const refine = tile.refine ?? inheritedRefine;
    if (refine !== 'ADD' && refine !== 'REPLACE')
      rejectHierarchy('Root refinement must be explicit ADD or REPLACE; children may inherit');
    const matrix = tile.transform;
    if (
      matrix !== undefined &&
      (!Array.isArray(matrix) ||
        matrix.length !== 16 ||
        matrix.some((value: unknown) => typeof value !== 'number' || !Number.isFinite(value)) ||
        matrix[3] !== 0 ||
        matrix[7] !== 0 ||
        matrix[11] !== 0 ||
        matrix[15] !== 1)
    )
      rejectHierarchy('Hierarchy transforms must be finite affine matrices');
    const transform = new Matrix4(parentTransform).multiplyRight(matrix ?? new Matrix4());
    const columns = [0, 1, 2].map(column =>
      [0, 1, 2].reduce((sum, row) => sum + Math.abs(transform[column * 4 + row]), 0)
    );
    const rows = [0, 1, 2].map(row =>
      [0, 1, 2].reduce((sum, column) => sum + Math.abs(transform[column * 4 + row]), 0)
    );
    // 1.0 errors are already meters; 1.1 applies the composed transform's largest scale.
    const scale =
      document.asset?.version === '1.0'
        ? 1
        : Math.sqrt(Math.max(...columns)) * Math.sqrt(Math.max(...rows));
    const geometricError = (tile.geometricError ?? NaN) * scale;
    if (
      typeof tile.geometricError !== 'number' ||
      (tile.geometricError ?? -1) < 0 ||
      !Number.isFinite(geometricError) ||
      Array.from(transform).some(value => !Number.isFinite(value))
    )
      rejectHierarchy('Every hierarchy tile must declare a finite nonnegative metric error');
    const resourceId = tile.content
      ? `tile-${path.length ? path.join('-') : 'root'}-content-0`
      : undefined;
    if (
      resourceId &&
      !inspection.resources.some(
        resource =>
          resource.resourceId === resourceId &&
          resource.uri === (tile.content?.uri ?? tile.content?.url) &&
          resource.tilePath.length === path.length &&
          resource.tilePath.every((value, index) => value === path[index])
      )
    )
      rejectHierarchy('Hierarchy content must match the inspected placement');
    const index = nodes.length;
    nodes.push({children: [], resourceId, geometricError, refine});
    if (parent !== -1) nodes[parent].children.push(index);
    if (nodes.length + stack.length + (tile.children?.length ?? 0) > 256)
      rejectHierarchy('Hierarchy preservation supports at most 256 tiles');
    for (let child = (tile.children?.length ?? 0) - 1; child >= 0; child--)
      stack.push({
        tile: tile.children![child],
        path: [...path, child],
        parent: index,
        transform,
        refine
      });
  }
  if (
    nodes.filter(node => node.resourceId).length !== resourceIds.length ||
    nodes.some(node => !node.resourceId && !node.children.length)
  )
    rejectHierarchy('Contentless leaves or unmatched content placements cannot be preserved');
  const geometricError = document.geometricError ?? nodes[0].geometricError;
  if (typeof geometricError !== 'number' || !Number.isFinite(geometricError) || geometricError < 0)
    rejectHierarchy('Dataset geometricError must be finite nonnegative meters');
  return {
    nodes,
    geometricError: Math.max(geometricError, nodes[0].geometricError),
    coordinateEpoch: spatialReference.coordinateEpoch
  };
}

/**
 * Writes a complete explicit 3D Tiles 1.1 hierarchy, preserving child order and ADD/REPLACE.
 * Pair with createSelectedMeshConversionSource({preserveHierarchy: true}) and the mesh codec.
 * One primitive per content is required. Source placements are baked by extraction; relative
 * output transforms place rebased GLBs exactly once. Bounds enclose all converted subtree
 * vertices. Source volumes, request volumes and unmapped metadata are not silently carried over.
 * Errors follow source-version transform semantics plus the position allowance.
 * Limits bound retained bytes and 256 tree nodes, not peak decoding or serialization memory.
 */
export function createMeshHierarchyTilesetSink(
  options: MeshHierarchyTilesetSinkOptions
): MeshTilesetSink {
  const hierarchy = prepareMeshHierarchy(options.inspection, options.resourceIds);
  const extensions = structuredClone(
    (options.inspection.tileset as {extensions?: Record<string, unknown>}).extensions
  );
  const extensionsRequired = structuredClone(
    (options.inspection.tileset as {extensionsRequired?: string[]}).extensionsRequired
  );
  const {maxPositionError} = options;
  if (
    !Number.isFinite(maxPositionError) ||
    maxPositionError < 0 ||
    hierarchy.nodes.some(node => !Number.isFinite(node.geometricError + maxPositionError)) ||
    !Number.isFinite(hierarchy.geometricError + maxPositionError)
  )
    throw new TileConversionError(
      'MESH_GEOMETRIC_ERROR_INVALID',
      'Hierarchy position allowance and resulting errors must be finite nonnegative meters'
    );
  const memory = createBoundedMemoryTileConversionSink(options);
  const placements = new Map<
    string,
    {
      /** Validated absolute placement for rebased GLB content. */
      readonly transform: readonly number[];
      /** Snapshot of the target origin. */
      readonly origin: readonly number[];
      /** Snapshot of encoded local bounds; payload buffers belong only to the memory sink. */
      readonly localBoundingBox: readonly (readonly number[])[];
      /** Stable relative output name. */
      readonly uri: string;
    }
  >();
  let state: 'open' | 'writing' | 'closed' = 'open';
  let completed = false;
  return {
    /** Exposes files only after complete finalization. */
    getFiles: () => (completed ? memory.getFiles() : []),
    /** Retains one trusted codec output for each original content placement. */
    async write(resource, signal) {
      signal?.throwIfAborted();
      const identifier = resource.contentResourceId;
      if (
        state !== 'open' ||
        !identifier ||
        placements.has(identifier) ||
        !hierarchy.nodes.some(node => node.resourceId === identifier)
      )
        throw new TileConversionError(
          'MESH_HIERARCHY_PLACEMENT_INVALID',
          'Hierarchy writes require one output per declared content before close'
        );
      if (resource.spatialReference.coordinateEpoch !== hierarchy.coordinateEpoch)
        throw new TileConversionError(
          'MESH_SOURCE_EPOCH_MISMATCH',
          'Hierarchy output coordinate epoch must match its source'
        );
      // Reuse the owning sink's frame, precision and bounds qualification.
      const tile = createMeshTileset(resource, maxPositionError).root;
      const uri = `meshes/${hierarchy.nodes.findIndex(node => node.resourceId === identifier)}.glb`;
      state = 'writing';
      await memory.write(
        {resourceId: uri, parts: [resource.glb], contentType: 'model/gltf-binary'},
        signal
      );
      placements.set(identifier, {
        transform: [...tile.transform!],
        origin: [...resource.origin],
        localBoundingBox: resource.localBoundingBox.map(bound => [...bound]),
        uri
      });
      state = 'open';
    },
    /** Publishes original topology only after every source content has completed. */
    async finalize(report) {
      if (
        state !== 'open' ||
        placements.size !== hierarchy.nodes.filter(node => node.resourceId).length
      )
        throw new TileConversionError(
          'MESH_HIERARCHY_INCOMPLETE',
          'Finalization requires every declared hierarchy content'
        );
      state = 'writing';
      const tiles: OutputTile[] = new Array(hierarchy.nodes.length);
      const bounds: number[][][] = new Array(hierarchy.nodes.length);
      const transforms = hierarchy.nodes.map(node => {
        const placement = node.resourceId ? placements.get(node.resourceId)! : undefined;
        return placement ? new Matrix4(placement.transform) : new Matrix4();
      });
      for (let index = hierarchy.nodes.length - 1; index >= 0; index--) {
        const node = hierarchy.nodes[index];
        const placement = node.resourceId ? placements.get(node.resourceId)! : undefined;
        const minimum = [Infinity, Infinity, Infinity];
        const maximum = [-Infinity, -Infinity, -Infinity];
        const contributors = node.children.map(child => bounds[child]);
        if (placement)
          contributors.push(
            placement.localBoundingBox.map((bound, boundIndex) =>
              bound.map((value, axis) => {
                // Outward padding covers ECEF addition and later origin subtraction, including
                // sub-ULP local extents that would otherwise collapse to an empty absolute box.
                const padding =
                  8 *
                  Number.EPSILON *
                  Math.max(
                    1,
                    Math.abs(placement.origin[axis]),
                    ...placement.localBoundingBox.map(limit => Math.abs(limit[axis]))
                  );
                return value + placement.origin[axis] + (boundIndex ? padding : -padding);
              })
            )
          );
        for (const [lower, upper] of contributors)
          for (let axis = 0; axis < 3; axis++) {
            minimum[axis] = Math.min(minimum[axis], lower[axis]);
            maximum[axis] = Math.max(maximum[axis], upper[axis]);
          }
        if ([...minimum, ...maximum].some(value => !Number.isFinite(value)))
          throw new TileConversionError(
            'MESH_TILESET_BOUNDS_INVALID',
            'Hierarchy absolute bounds must remain finite'
          );
        bounds[index] = [minimum, maximum];
        const inverse = new Matrix4(transforms[index]).invert();
        const center = Array.from(
          inverse.transformAsPoint(minimum.map((value, axis) => value / 2 + maximum[axis] / 2))
        );
        const halfSize = minimum.map((value, axis) => maximum[axis] / 2 - value / 2);
        const halfAxes = [0, 1, 2].flatMap(axis =>
          Array.from(
            inverse.transformAsVector(
              halfSize.map((value, coordinate) => (coordinate === axis ? value : 0))
            )
          )
        );
        if ([...center, ...halfAxes].some(value => !Number.isFinite(value)))
          throw new TileConversionError(
            'MESH_TILESET_BOUNDS_INVALID',
            'Hierarchy local bounds must remain finite'
          );
        tiles[index] = {
          transform: Array.from(transforms[index]),
          boundingVolume: {box: [...center, ...halfAxes]},
          geometricError: node.geometricError + maxPositionError,
          refine: node.refine,
          ...(placement ? {content: {uri: placement.uri}} : {}),
          ...(node.children.length
            ? {
                children: node.children.map(child => {
                  tiles[child].transform = Array.from(
                    new Matrix4(inverse).multiplyRight(transforms[child])
                  );
                  if (tiles[child].transform.some(value => !Number.isFinite(value)))
                    throw new TileConversionError(
                      'MESH_TILESET_BOUNDS_INVALID',
                      'Relative hierarchy transforms must remain finite'
                    );
                  return tiles[child];
                })
              }
            : {})
        };
      }
      const json = JSON.stringify({
        asset: {version: '1.1'},
        ...(extensions && Object.keys(extensions).length
          ? {extensions, extensionsUsed: Object.keys(extensions)}
          : {}),
        ...(extensionsRequired?.length ? {extensionsRequired} : {}),
        geometricError: hierarchy.geometricError + maxPositionError,
        root: tiles[0]
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
    /** Discards retained resources and hides all files after failure. */
    async abort(error) {
      state = 'closed';
      completed = false;
      placements.clear();
      await memory.abort(error);
    }
  };
}
