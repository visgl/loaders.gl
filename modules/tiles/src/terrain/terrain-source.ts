// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GetTileDataParameters,
  GetTileParameters,
  TileSource,
  TileSourceMetadata
} from '@loaders.gl/core/loader-utils';
import {
  HeightField,
  HeightFieldGeometry,
  HeightFieldMinMax,
  createTerrainMesh,
  type HeightFieldProps,
  type TerrainGridMesh
} from '@math.gl/geospatial/terrain';
import {Tileset2D, type Tileset2DProps} from '../tileset-2d';

/** A decoded source tile with its immutable, metric terrain samples. */
export type TerrainSourceTile = {
  /** Height samples and their affine transform, registration, validity and height reference. */
  readonly field: HeightField;
  /** Retained height and mask bytes for shared tileset accounting. */
  readonly byteLength: number;
  /** Build a detached regular mesh in this tile's metric coordinate frame. */
  createMesh(): TerrainGridMesh;
  /** Build render-oriented geometry, including texture coordinates and normals. */
  createGeometry(): HeightFieldGeometry;
  /** Build a conservative min/max hierarchy for terrain queries and culling. */
  createBounds(): HeightFieldMinMax;
};

/** Tile address and optional renderer-provided metadata passed to the terrain provider. */
export type TerrainSourceRequest = GetTileParameters & {
  /** Cache identifier supplied by the traversal adapter, if available. */
  readonly id?: string;
  /** Tile bounds from the active traversal adapter, if requested through a tileset. */
  readonly bbox?: GetTileDataParameters['bbox'];
  /** Resolved template URL, if supplied by the consumer. */
  readonly url?: string | null;
  /** Resolved numeric zoom, if supplied by the consumer. */
  readonly zoom?: number;
  /** Logical pixel dimensions advertised by the tile adapter. */
  readonly tileSize?: readonly [number, number];
  /** Consumer-provided tile metadata. */
  readonly userData?: Record<string, any>;
};

/** A decoded tile with an explicit metric frame, sample registration and height reference. */
export type TerrainSourceTileInput = HeightFieldProps &
  Required<
    Pick<HeightFieldProps, 'origin' | 'columnStep' | 'rowStep' | 'registration' | 'heightReference'>
  >;

/** Configuration for one shareable terrain source and its shared tile cache. */
export type TerrainSourceOptions<ViewStateT = unknown> = {
  /** Provider metadata, including an explicit tile grid when known. */
  readonly metadata: TileSourceMetadata | Promise<TileSourceMetadata>;
  /** Load and decode a tile in a local metric frame; return null when it is unavailable. */
  readonly loadTile: (parameters: TerrainSourceRequest) => Promise<TerrainSourceTileInput | null>;
  /** Shared cache, scheduling and traversal options. Views retain independent selections. */
  readonly tileset?: Omit<
    Tileset2DProps<TerrainSourceTile, ViewStateT>,
    'getTileData' | 'tileSource'
  >;
};

/**
 * A provider-neutral terrain tile source with one shared Tileset2D.
 * The provider loads decoded heights; math.gl owns their sampling semantics. Pass the same
 * `tileset` to multiple consumers and keep view traversal, seams and GPU resources outside
 * this source. Positions and height units must be supplied by the provider in meters.
 */
export class TerrainSource<ViewStateT = unknown> implements TileSource {
  /** Shared tile cache and scheduler; consumers must detach before finalization. */
  readonly tileset: Tileset2D<TerrainSourceTile, ViewStateT>;
  private readonly metadata: Promise<TileSourceMetadata>;
  private readonly loadTile: TerrainSourceOptions<ViewStateT>['loadTile'];

  /** Create a source using a decoded terrain provider and optional shared cache settings. */
  constructor(options: TerrainSourceOptions<ViewStateT>) {
    this.metadata = Promise.resolve(options.metadata);
    this.loadTile = options.loadTile;
    this.tileset = new Tileset2D<TerrainSourceTile, ViewStateT>({
      ...options.tileset,
      tileSource: this
    });
  }

  /** Return the source's tile metadata. */
  getMetadata(): Promise<TileSourceMetadata> {
    return this.metadata;
  }

  /** Load one decoded tile; callers sharing views should use the shared tileset cache. */
  async getTile(parameters: TerrainSourceRequest): Promise<TerrainSourceTile | null> {
    parameters.signal?.throwIfAborted();
    const input = await this.loadTile(parameters);
    parameters.signal?.throwIfAborted();
    if (!input) return null;
    if (
      !input.origin ||
      !input.columnStep ||
      !input.rowStep ||
      !input.registration ||
      typeof input.heightReference !== 'string'
    ) {
      throw new Error('Terrain tiles require explicit frame, registration and height reference');
    }
    const field = new HeightField(input);
    const byteLength = input.width * input.height * (input.heights.BYTES_PER_ELEMENT + 1);
    return {
      field,
      byteLength,
      createMesh: () => createTerrainMesh(field),
      createGeometry: () => new HeightFieldGeometry(field),
      createBounds: () => new HeightFieldMinMax(field)
    };
  }

  /** Adapt deck.gl and Tileset2D tile requests to the provider's flat tile address. */
  getTileData(parameters: GetTileDataParameters): Promise<TerrainSourceTile | null> {
    const tileMatrix =
      parameters.tileMatrix ?? (parameters.index as {tileMatrix?: string}).tileMatrix;
    const {id, bbox, url, zoom, userData, signal} = parameters;
    const {crs, tileSize} = parameters as GetTileDataParameters &
      Pick<TerrainSourceRequest, 'crs' | 'tileSize'>;
    return this.getTile({
      ...parameters.index,
      tileMatrix,
      signal,
      id,
      bbox,
      url,
      zoom,
      userData,
      crs,
      tileSize
    });
  }

  /** Release all cached tiles and pending tileset requests. */
  finalize(): void {
    this.tileset.finalize();
  }
}
