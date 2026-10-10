// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DataSource, type CoreAPI, type SourceLoader} from '@loaders.gl/loader-utils';
import {
  PointCloudTiler,
  convertMeshToTable,
  type PointCloudTilerNode
} from '@loaders.gl/schema-utils';
import type {
  PointCloudTileContent,
  PointCloudTileHeader,
  PointCloudTilesetSource
} from './point-cloud/types';
import {PointCloudTileSourceLoader} from './point-cloud-tile-source-loader-types';
import type {
  PointCloudTileSourceInput,
  PointCloudTileSourceOptions
} from './point-cloud-tile-source-types';

const {
  preload: _preload,
  createDataSource: _createDataSource,
  ...metadata
} = PointCloudTileSourceLoader;

/** Parser-bearing source factory for decoded point Mesh/Arrow data. */
export const PointCloudTileSourceLoaderWithParser = {
  ...metadata,
  /** Creates a native-coordinate source with deferred child indexing. */
  createDataSource(
    input: PointCloudTileSourceInput | string | Blob,
    options: PointCloudTileSourceOptions = {},
    coreApi?: CoreAPI
  ): PointCloudTileSource {
    if (typeof input === 'string' || input instanceof Blob)
      throw new Error('PointCloudTileSourceLoader requires decoded Mesh/Arrow input');
    return new PointCloudTileSource(input, options, coreApi);
  }
} as const satisfies SourceLoader<PointCloudTileSource>;

/**
 * Dynamic counterpart to vector table tiling, usable by PointCloudTileset and converter traversal.
 * Each point belongs to one additive node. It retains native coordinates and explicit CRS metadata.
 * Geometry stays in memory; output tiles are gathered on request and are not cached by this source.
 */
export class PointCloudTileSource
  extends DataSource<null, PointCloudTileSourceOptions>
  implements PointCloudTilesetSource<null, PointCloudTileSourceOptions>
{
  /** Resolves after the root is indexed. */
  readonly ready: Promise<void>;
  /** Whether root indexing has completed successfully. */
  isReady = false;
  /** Shared portable index and ownership implementation. */
  private readonly tiler: PointCloudTiler;

  /** Creates a source from decoded points, without fetching or reprojecting input. */
  constructor(
    input: PointCloudTileSourceInput,
    options: PointCloudTileSourceOptions = {},
    coreApi?: CoreAPI
  ) {
    super(null, options, {pointCloudTiler: {}}, coreApi);
    this.tiler = new PointCloudTiler(input, options.pointCloudTiler);
    this.ready = this.tiler.getRootNode().then(() => {
      this.isReady = true;
    });
  }

  /** Waits for one shared indexing operation. */
  async initialize(): Promise<void> {
    await this.tiler.getRootNode();
  }

  /** Reports exact source count and the additive ownership contract. */
  async getMetadata(): Promise<{pointCount: number; refinement: 'ADD'}> {
    await this.initialize();
    return {pointCount: this.tiler.pointCount, refinement: 'ADD'};
  }

  /** Returns the sampled root and its native bounds. */
  async getRootTile(): Promise<PointCloudTileHeader> {
    return this.createHeader(await this.tiler.getRootNode());
  }

  /** Discovers only the requested node's immediate children. */
  async getChildren(tile: PointCloudTileHeader): Promise<PointCloudTileHeader[]> {
    return (await this.tiler.getChildNodes(tile.id)).map(node => this.createHeader(node));
  }

  /** Gathers the requested point rows into a fresh Arrow tile, preserving attribute types. */
  async loadTileContent(tile: PointCloudTileHeader): Promise<PointCloudTileContent | null> {
    const mesh = await this.tiler.getTileMesh(tile.id);
    if (!mesh.header!.vertexCount) return null;
    return {
      data: convertMeshToTable(mesh, 'arrow-table'),
      pointCount: mesh.header!.vertexCount,
      cartographicOrigin: [0, 0, 0],
      coordinateSystem: 'cartesian',
      spatialReference: this.options.pointCloudTiler.spatialReference,
      spatialBoundingVolume: this.createHeader(await this.tiler.getNodeMetadata(tile.id))
        .boundingVolume
    };
  }

  /** Releases the input table, attributes and index; safe to repeat. */
  close(): void {
    this.tiler.close();
    this.isReady = false;
  }

  /** Creates a conservative native-coordinate header without renderer projection math. */
  private createHeader(node: PointCloudTilerNode): PointCloudTileHeader {
    const center = node.bounds[0].map((value, axis) => value + (node.bounds[1][axis] - value) / 2);
    const boundingVolume = {
      cartographicBounds: node.bounds.map(corner => [...corner]) as [number[], number[]],
      center,
      radius: Math.hypot(...center.map((value, axis) => node.bounds[1][axis] - value)),
      coordinateFrame: 'cartesian' as const
    };
    return {
      id: node.id,
      level: node.level,
      pointCount: node.pointCount,
      geometricError: node.geometricError,
      boundingVolume,
      spatialBoundingVolume: boundingVolume
    };
  }
}
