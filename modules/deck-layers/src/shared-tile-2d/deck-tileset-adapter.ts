// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Viewport} from '@deck.gl/core';
import {Matrix4} from '@math.gl/core';
import type {
  Bounds,
  GeoBoundingBox,
  Tileset2DAdapter,
  Tileset2DTileContext,
  Tileset2DTraversalContext,
  TileBoundingBox,
  TileIndex,
  ZRange
} from '@loaders.gl/tiles';
import {getOSMTileIndices, osmTile2lngLat} from './deck-tile-traversal';

const TILE_SIZE = 512;
const DEFAULT_EXTENT: Bounds = [-Infinity, -Infinity, Infinity, Infinity];

/** Applies a model transform to an axis-aligned bounding box. */
export function transformBox(bbox: Bounds, modelMatrix: Matrix4): Bounds {
  const transformedCoords = [
    modelMatrix.transformAsPoint([bbox[0], bbox[1]]),
    modelMatrix.transformAsPoint([bbox[2], bbox[1]]),
    modelMatrix.transformAsPoint([bbox[0], bbox[3]]),
    modelMatrix.transformAsPoint([bbox[2], bbox[3]])
  ];
  return [
    Math.min(...transformedCoords.map(item => item[0])),
    Math.min(...transformedCoords.map(item => item[1])),
    Math.max(...transformedCoords.map(item => item[0])),
    Math.max(...transformedCoords.map(item => item[1]))
  ];
}

function getBoundingBox(viewport: Viewport, zRange: number[] | null, extent: Bounds): Bounds {
  let bounds;
  if (zRange && zRange.length === 2) {
    const [minZ, maxZ] = zRange;
    const bounds0 = viewport.getBounds({z: minZ});
    const bounds1 = viewport.getBounds({z: maxZ});
    bounds = [
      Math.min(bounds0[0], bounds1[0]),
      Math.min(bounds0[1], bounds1[1]),
      Math.max(bounds0[2], bounds1[2]),
      Math.max(bounds0[3], bounds1[3])
    ];
  } else {
    bounds = viewport.getBounds();
  }

  if (!viewport.isGeospatial) {
    return [
      Math.max(Math.min(bounds[0], extent[2]), extent[0]),
      Math.max(Math.min(bounds[1], extent[3]), extent[1]),
      Math.min(Math.max(bounds[2], extent[0]), extent[2]),
      Math.min(Math.max(bounds[3], extent[1]), extent[3])
    ];
  }

  return [
    Math.max(bounds[0], extent[0]),
    Math.max(bounds[1], extent[1]),
    Math.min(bounds[2], extent[2]),
    Math.min(bounds[3], extent[3])
  ];
}

/** Computes cull bounds in projected/world coordinates for one deck viewport. */
export function getCullBounds({
  viewport,
  z,
  cullRect
}: {
  viewport: Viewport;
  z: ZRange | number | null;
  cullRect: {x: number; y: number; width: number; height: number};
}): [number, number, number, number][] {
  const subViewports = viewport.subViewports || [viewport];
  return subViewports.map(subViewport => getCullBoundsInViewport(subViewport, z || 0, cullRect));
}

function getCullBoundsInViewport(
  viewport: Viewport,
  z: ZRange | number,
  cullRect: {x: number; y: number; width: number; height: number}
): [number, number, number, number] {
  if (!Array.isArray(z)) {
    const x = cullRect.x - viewport.x;
    const y = cullRect.y - viewport.y;
    const {width, height} = cullRect;
    const unprojectOption = {targetZ: z};

    const topLeft = viewport.unproject([x, y], unprojectOption);
    const topRight = viewport.unproject([x + width, y], unprojectOption);
    const bottomLeft = viewport.unproject([x, y + height], unprojectOption);
    const bottomRight = viewport.unproject([x + width, y + height], unprojectOption);

    return [
      Math.min(topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]),
      Math.min(topLeft[1], topRight[1], bottomLeft[1], bottomRight[1]),
      Math.max(topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]),
      Math.max(topLeft[1], topRight[1], bottomLeft[1], bottomRight[1])
    ];
  }

  const bounds0 = getCullBoundsInViewport(viewport, z[0], cullRect);
  const bounds1 = getCullBoundsInViewport(viewport, z[1], cullRect);
  return [
    Math.min(bounds0[0], bounds1[0]),
    Math.min(bounds0[1], bounds1[1]),
    Math.max(bounds0[2], bounds1[2]),
    Math.max(bounds0[3], bounds1[3])
  ];
}

function getIndexingCoords(
  bbox: Bounds,
  scale: number,
  modelMatrixInverse?: Matrix4 | null
): Bounds {
  if (modelMatrixInverse) {
    return transformBox(bbox, modelMatrixInverse).map(item => (item * scale) / TILE_SIZE) as Bounds;
  }
  return bbox.map(item => (item * scale) / TILE_SIZE) as Bounds;
}

function getScale(z: number, tileSize: number): number {
  return (Math.pow(2, z) * TILE_SIZE) / tileSize;
}

function tile2XY(x: number, y: number, z: number, tileSize: number): [number, number] {
  const scale = getScale(z, tileSize);
  return [(x / scale) * TILE_SIZE, (y / scale) * TILE_SIZE];
}

function tileToBoundingBox(
  viewport: Viewport,
  x: number,
  y: number,
  z: number,
  tileSize: number = TILE_SIZE
): TileBoundingBox {
  if (viewport.isGeospatial) {
    const [west, north] = osmTile2lngLat(x, y, z);
    const [east, south] = osmTile2lngLat(x + 1, y + 1, z);
    return {west, north, east, south};
  }
  const [left, top] = tile2XY(x, y, z, tileSize);
  const [right, bottom] = tile2XY(x + 1, y + 1, z, tileSize);
  return {left, top, right, bottom};
}

function getIdentityTileIndices(
  viewport: Viewport,
  z: number,
  tileSize: number,
  extent: Bounds,
  modelMatrixInverse?: Matrix4 | null
): TileIndex[] {
  const bbox = getBoundingBox(viewport, null, extent);
  const scale = getScale(z, tileSize);
  const [minX, minY, maxX, maxY] = getIndexingCoords(bbox, scale, modelMatrixInverse);
  const indices: TileIndex[] = [];

  for (let x = Math.floor(minX); x < maxX; x++) {
    for (let y = Math.floor(minY); y < maxY; y++) {
      indices.push({x, y, z});
    }
  }
  return indices;
}

function getTileZoomForViewport(viewport: Viewport, tileSize: number, zoomOffset: number): number {
  return viewport.isGeospatial
    ? Math.round(viewport.zoom + Math.log2(TILE_SIZE / tileSize)) + zoomOffset
    : Math.ceil(viewport.zoom) + zoomOffset;
}

function applyZoomBounds(
  z: number,
  minZoom: number | undefined,
  maxZoom: number | undefined,
  extent?: Bounds | null
): number | null {
  if (typeof minZoom === 'number' && Number.isFinite(minZoom) && z < minZoom) {
    if (!extent) {
      return null;
    }
    z = minZoom;
  }
  if (typeof maxZoom === 'number' && Number.isFinite(maxZoom) && z > maxZoom) {
    z = maxZoom;
  }
  return z;
}

function getDeckTileIndices(context: Tileset2DTraversalContext<Viewport>): TileIndex[] {
  const {
    viewState: viewport,
    maxZoom,
    minZoom,
    zRange = null,
    extent,
    tileSize = TILE_SIZE,
    modelMatrix,
    modelMatrixInverse,
    zoomOffset = 0
  } = context;
  const zoom = applyZoomBounds(
    getTileZoomForViewport(viewport, tileSize, zoomOffset),
    minZoom,
    maxZoom,
    extent
  );
  if (zoom === null) {
    return [];
  }

  let transformedExtent = extent || undefined;
  if (modelMatrix && modelMatrixInverse && extent && !viewport.isGeospatial) {
    transformedExtent = transformBox(extent, modelMatrix);
  }

  return viewport.isGeospatial
    ? getOSMTileIndices(viewport, zoom, zRange, extent || undefined)
    : getIdentityTileIndices(
        viewport,
        zoom,
        tileSize,
        transformedExtent || DEFAULT_EXTENT,
        modelMatrixInverse
      );
}

function getDeckTileBoundingBox(
  context: Tileset2DTileContext<Viewport>,
  index: TileIndex
): TileBoundingBox {
  return tileToBoundingBox(context.viewState, index.x, index.y, index.z, context.tileSize);
}

/** Deck.gl adapter used by {@link Tileset2D} for viewport traversal and tile bounds. */
export const sharedTile2DDeckAdapter: Tileset2DAdapter<Viewport> = {
  getTileIndices: getDeckTileIndices,
  getTileBoundingBox: getDeckTileBoundingBox
};

/** Type guard for geographic tile bounds. */
export function isGeoBoundingBox(value: any): value is GeoBoundingBox {
  return (
    Number.isFinite(value.west) &&
    Number.isFinite(value.north) &&
    Number.isFinite(value.east) &&
    Number.isFinite(value.south)
  );
}
