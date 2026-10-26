// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getTileBounds} from '@math.gl/geospatial/tile-matrix';
import type {TileSource, GetTileParameters, GetTileDataParameters, TileGrid} from './tile-source';
import type {ImageSource, ImageSourceMetadata} from './image-source';
import {getRequestedTileMatrix, validateTileGrid, resolveTileGridTile} from './tile-grid';

/** Converts image-window requests into tiles in a configured grid, or legacy geographic XYZ. */
export class TileSourceAdapter<ImageSourceT extends ImageSource> implements TileSource {
  /** Image-window source used to fulfill tile requests. */
  readonly viewportSource: ImageSourceT;
  /** Explicit geometry and availability; never inferred from image dataset bounds. */
  readonly tileGrid?: TileGrid;

  /** Wraps an image source, optionally using an authoritative matrix set. */
  constructor(source: ImageSourceT, tileGrid?: TileGrid) {
    if (tileGrid && (!tileGrid.tileMatrixSet?.crs || !tileGrid.tileMatrixSet.matrices.length))
      throw new Error('TileSourceAdapter requires complete tile matrix geometry.');
    if (tileGrid) validateTileGrid(tileGrid);
    this.viewportSource = source;
    this.tileGrid = tileGrid;
  }

  /** Returns source metadata plus the explicitly configured tile grid. */
  async getMetadata(): Promise<ImageSourceMetadata & {tileGrid?: TileGrid}> {
    const metadata = await this.viewportSource.getMetadata();
    return this.tileGrid ? {...metadata, tileGrid: this.tileGrid} : metadata;
  }

  /** Requests native matrix bounds and pixel dimensions without reprojection. */
  getTile(parameters: GetTileParameters): Promise<unknown | null> {
    let width = 512;
    let height = 512;
    let coordinateReferenceSystem = 'EPSG:4326';
    const set = this.tileGrid?.tileMatrixSet;
    if (set) {
      if (parameters.crs && parameters.crs !== set.crs)
        throw new Error('TileSourceAdapter does not support reprojection.');
      const matrix = getRequestedTileMatrix(set.matrices, level => level.id, parameters);
      if (!matrix) return Promise.resolve(null);
      const resolved = resolveTileGridTile(this.tileGrid, parameters);
      if (!resolved) return Promise.resolve(null);
      parameters = resolved;
      [width, height] = matrix.tileSize;
      coordinateReferenceSystem = set.crs;
    } else if (parameters.tileMatrix !== undefined) {
      throw new RangeError('Explicit tile matrix selection requires a configured grid.');
    }
    const boundingBox = this.getTileBoundingBox(parameters);
    return this.viewportSource.getImage({
      boundingBox,
      layers: parameters.layers || [],
      width,
      height,
      crs: coordinateReferenceSystem,
      styles: parameters.styles,
      format: parameters.format,
      signal: parameters.signal
    });
  }

  /** Preserves matrix identity and cancellation from deck.gl-compatible requests. */
  getTileData(parameters: GetTileDataParameters): Promise<unknown | null> {
    return this.getTile({
      ...parameters.index,
      tileMatrix: parameters.tileMatrix,
      signal: parameters.signal
    });
  }

  /** Returns native configured bounds, or longitude/latitude bounds for legacy XYZ requests. */
  protected getTileBoundingBox(
    parameters: GetTileParameters
  ): [min: [number, number], max: [number, number]] {
    const set = this.tileGrid?.tileMatrixSet;
    if (set) {
      const matrix = getRequestedTileMatrix(set.matrices, level => level.id, parameters);
      if (!matrix) throw new RangeError('No tile matrix for request.');
      const [minimumX, minimumY, maximumX, maximumY] = getTileBounds(
        matrix,
        parameters.x,
        parameters.y
      );
      return [
        [minimumX, minimumY],
        [maximumX, maximumY]
      ];
    }
    if (parameters.crs && parameters.crs !== 'EPSG:4326')
      throw new Error('Legacy XYZ image bounds require EPSG:4326.');
    const {x, y, z} = parameters;
    if (
      !Number.isInteger(z) ||
      z < 0 ||
      z > 30 ||
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x >= 2 ** z ||
      y >= 2 ** z
    )
      throw new RangeError('Invalid XYZ tile index.');
    return [this.getTileLowerLeftCorner(x, y, z), this.getTileLowerLeftCorner(x + 1, y - 1, z)];
  }

  /** Returns a longitude/latitude lower-left corner of a canonical XYZ tile. */
  getTileLowerLeftCorner(x: number, y: number, zoom: number): [number, number] {
    const count = 2 ** zoom;
    return [
      (x / count) * 360 - 180,
      (180 / Math.PI) * Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / count)))
    ];
  }
}
