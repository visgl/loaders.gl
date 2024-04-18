// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

/* eslint-disable no-console, no-continue */

import {
  VectorTileSource,
  VectorTileSourceProps,
  TileLoadParameters
} from '@loaders.gl/loader-utils';
import {Feature, GeoJSONTable} from '@loaders.gl/schema';

import type {GeoJSONTile, GeoJSONTileFeature} from './lib/geojson-tiler/tile';
import {convert} from './lib/geojson-tiler/convert'; // GeoJSON conversion and preprocessing
import {clip} from './lib/geojson-tiler/clip'; // stripe clipping algorithm
import {wrap} from './lib/geojson-tiler/wrap'; // date line processing
import {transformTile} from './lib/geojson-tiler/transform'; // coordinate transformation
import {createTile} from './lib/geojson-tiler/tile'; // final simplified tile generation

/** Options to configure tiling */
export type GeoJSONTileSourceOptions = VectorTileSourceProps & {
  maxZoom?: number /** max zoom to preserve detail on */;
  indexMaxZoom?: number /** max zoom in the tile index */;
  indexMaxPoints?: number /** max number of points per tile in the tile index */;
  tolerance?: number /** simplification tolerance (higher means simpler) */;
  extent?: number /** tile extent */;
  buffer?: number /** tile buffer on each side */;
  lineMetrics?: boolean /** whether to calculate line metrics */;
  promoteId?: string /** name of a feature property to be promoted to feature.id */;
  generateId?: boolean /** whether to generate feature ids. Cannot be used with promoteId */;
  debug?: number /** logging level (0, 1 or 2) */;
};

export class GeoJSONTileSource implements VectorTileSource<any> {
  static defaultOptions: Required<GeoJSONTileSourceOptions> = {
    maxZoom: 14, // max zoom to preserve detail on
    indexMaxZoom: 5, // max zoom in the tile index
    indexMaxPoints: 100000, // max number of points per tile in the tile index
    tolerance: 3, // simplification tolerance (higher means simpler)
    extent: 4096, // tile extent
    buffer: 64, // tile buffer on each side
    lineMetrics: false, // whether to calculate line metrics
    // @ts-expect-error
    promoteId: undefined, // name of a feature property to be promoted to feature.id
    generateId: false, // whether to generate feature ids. Cannot be used with promoteId
    debug: 0 // logging level (0, 1 or 2)
  };

  mimeType = 'application/vnd.mapbox-vector-tile';

  options: Required<GeoJSONTileSourceOptions>;

  // tiles and tileCoords are part of the public API
  tiles: Record<string, GeoJSONTile> = {};
  tileCoords: {x: number; y: number; z: number}[] = [];

  stats: Record<string, number> = {};
  total: number = 0;

  /** Resolves when the input data promise has been resolved and the top-level tiling is done */
  ready: Promise<void>;

  constructor(data: GeoJSONTable | Promise<GeoJSONTable>, options?: GeoJSONTileSourceOptions) {
    this.options = {...GeoJSONTileSource.defaultOptions, ...options};
    this.getTileData = this.getTileData.bind(this);

    this.ready = this.initializeTilesAsync(data);
  }

  async initializeTilesAsync(dataPromise: GeoJSONTable | Promise<GeoJSONTable>): Promise<void> {
    const data = await dataPromise;
    this.initializeTilesSync(data);
  }

  initializeTilesSync(data: GeoJSONTable): void {
    const options = this.options;
    const debug = options.debug;

    if (debug) console.time('preprocess data');

    if (this.options.maxZoom < 0 || this.options.maxZoom > 24) {
      throw new Error('maxZoom should be in the 0-24 range');
    }
    if (options.promoteId && this.options.generateId) {
      throw new Error('promoteId and generateId cannot be used together.');
    }

    // projects and adds simplification info
    let features = convert(data, options);

    if (debug) {
      console.timeEnd('preprocess data');
      console.log(
        'index: maxZoom: %d, maxPoints: %d',
        options.indexMaxZoom,
        options.indexMaxPoints
      );
      console.time('generate tiles');
    }

    // wraps features (ie extreme west and extreme east)
    features = wrap(features, this.options);

    // start slicing from the top tile down
    if (features.length) {
      this.splitTile(features, 0, 0, 0);
    }

    if (debug) {
      if (features.length) {
        console.log('features: %d, points: %d', this.tiles[0].numFeatures, this.tiles[0].numPoints);
      }
      console.timeEnd('generate tiles');
      console.log('tiles generated:', this.total, JSON.stringify(this.stats));
    }
  }

  async getMetadata(): Promise<unknown> {
    return {};
  }

  /**
   * Get a tile at the specified index
   * @param z
   * @param x
   * @param y
   * @returns
   */
  async getVectorTile(tileIndex: {
    zoom: number;
    x: number;
    y: number;
  }): Promise<GeoJSONTable | null> {
    await this.ready;
    const table = this.getTileSync(tileIndex);
    console.log('getTileSync', tileIndex, table);
    return table;
  }

  async getTile(tileIndex: {zoom: number; x: number; y: number}): Promise<GeoJSONTable | null> {
    await this.ready;
    return this.getTileSync(tileIndex);
  }

  async getTileData(tileParams: TileLoadParameters): Promise<unknown | null> {
    const {x, y, z} = tileParams.index;
    return await this.getVectorTile({x, y, zoom: z});
  }

  // Implementation

  /**
   * Synchronously request a tile
   * @note Application must await `source.ready` before calling sync methods.
   */
  getTileSync(tileIndex: {zoom: number; x: number; y: number}): GeoJSONTable | null {
    const rawTile = this.getRawTile(tileIndex);
    if (!rawTile) {
      return null;
    }

    return convertToGeoJSONTable(rawTile, this.options.extent);
  }

  /**
   * Return geojsonvt-style "half formed" vector tile
   * @note Application must await `source.ready` before calling sync methods.
   */
  // eslint-disable-next-line complexity, max-statements
  getRawTile(tileIndex: {zoom: number; x: number; y: number}): GeoJSONTile | null {
    const {zoom: z, y} = tileIndex;
    let {x} = tileIndex;
    // z = +z;
    // x = +x;
    // y = +y;

    const {extent, debug} = this.options;

    if (z < 0 || z > 24) {
      return null;
    }

    const z2 = 1 << z;
    x = (x + z2) & (z2 - 1); // wrap tile x coordinate

    const id = toID(z, x, y);
    if (this.tiles[id]) {
      return transformTile(this.tiles[id], extent);
    }

    if (debug > 1) console.log('drilling down to z%d-%d-%d', z, x, y);

    let z0 = z;
    let x0 = x;
    let y0 = y;
    let parent;

    while (!parent && z0 > 0) {
      z0--;
      x0 = x0 >> 1;
      y0 = y0 >> 1;
      parent = this.tiles[toID(z0, x0, y0)];
    }

    if (!parent || !parent.source) {
      return null;
    }

    // if we found a parent tile containing the original geometry, we can drill down from it
    if (debug > 1) {
      console.log('found parent tile z%d-%d-%d', z0, x0, y0);
      console.time('drilling down');
    }
    this.splitTile(parent.source, z0, x0, y0, z, x, y);
    if (debug > 1) {
      console.timeEnd('drilling down');
    }

    return this.tiles[id] ? transformTile(this.tiles[id], extent) : null;
  }

  /**
   * splits features from a parent tile to sub-tiles.
   * @param z, x, and y are the coordinates of the parent tile
   * @param cz, cx, and cy are the coordinates of the target tile
   *
   * If no target tile is specified, splitting stops when we reach the maximum
   * zoom or the number of points is low as specified in the options.
   */
  // eslint-disable-next-line max-params, max-statements, complexity
  splitTile(
    features: GeoJSONTileFeature[],
    z: number,
    x: number,
    y: number,
    cz?: number,
    cx?: number,
    cy?: number
  ): void {
    const stack: any[] = [features, z, x, y];
    const options = this.options;
    const debug = options.debug;

    // avoid recursion by using a processing queue
    while (stack.length) {
      y = stack.pop();
      x = stack.pop();
      z = stack.pop();
      features = stack.pop();

      const z2 = 1 << z;
      const id = toID(z, x, y);
      let tile = this.tiles[id];

      if (!tile) {
        if (debug > 1) {
          console.time('creation');
        }

        tile = this.tiles[id] = createTile(features, z, x, y, options);
        this.tileCoords.push({z, x, y});

        if (debug) {
          if (debug > 1) {
            console.log(
              'tile z%d-%d-%d (features: %d, points: %d, simplified: %d)',
              z,
              x,
              y,
              tile.numFeatures,
              tile.numPoints,
              tile.numSimplified
            );
            console.timeEnd('creation');
          }
          const key = `z${z}`;
          this.stats[key] = (this.stats[key] || 0) + 1;
          this.total++;
        }
      }

      // save reference to original geometry in tile so that we can drill down later if we stop now
      tile.source = features;

      // if it's the first-pass tiling
      if (cz === undefined) {
        // stop tiling if we reached max zoom, or if the tile is too simple
        if (z === options.indexMaxZoom || tile.numPoints <= options.indexMaxPoints) continue;
        // if a drilldown to a specific tile
      } else if (z === options.maxZoom || z === cz) {
        // stop tiling if we reached base zoom or our target tile zoom
        continue;
      } else if (cz !== undefined) {
        // stop tiling if it's not an ancestor of the target tile
        const zoomSteps = cz - z;
        // @ts-expect-error TODO fix the types of cx cy
        if (x !== cx >> zoomSteps || y !== cy >> zoomSteps) continue;
      }

      // if we slice further down, no need to keep source geometry
      tile.source = null;

      if (features.length === 0) continue;

      if (debug > 1) console.time('clipping');

      // values we'll use for clipping
      const k1 = (0.5 * options.buffer) / options.extent;
      const k2 = 0.5 - k1;
      const k3 = 0.5 + k1;
      const k4 = 1 + k1;

      let tl: GeoJSONTileFeature[] | null = null;
      let bl: GeoJSONTileFeature[] | null = null;
      let tr: GeoJSONTileFeature[] | null = null;
      let br: GeoJSONTileFeature[] | null = null;

      let left = clip(features, z2, x - k1, x + k3, 0, tile.minX, tile.maxX, options);
      let right = clip(features, z2, x + k2, x + k4, 0, tile.minX, tile.maxX, options);

      // @ts-expect-error - unclear why this is needed?
      features = null;

      if (left) {
        tl = clip(left, z2, y - k1, y + k3, 1, tile.minY, tile.maxY, options);
        bl = clip(left, z2, y + k2, y + k4, 1, tile.minY, tile.maxY, options);
        left = null;
      }

      if (right) {
        tr = clip(right, z2, y - k1, y + k3, 1, tile.minY, tile.maxY, options);
        br = clip(right, z2, y + k2, y + k4, 1, tile.minY, tile.maxY, options);
        right = null;
      }

      if (debug > 1) console.timeEnd('clipping');

      stack.push(tl || [], z + 1, x * 2, y * 2);
      stack.push(bl || [], z + 1, x * 2, y * 2 + 1);
      stack.push(tr || [], z + 1, x * 2 + 1, y * 2);
      stack.push(br || [], z + 1, x * 2 + 1, y * 2 + 1);
    }
  }
}

function toID(z, x, y): number {
  return ((1 << z) * y + x) * 32 + z;
}

function convertToGeoJSONTable(vtTile: GeoJSONTile, extent: number): GeoJSONTable {
  const features: Feature[] = [];
  for (const rawFeature of vtTile.features) {
    if (!rawFeature || !rawFeature.geometry) {
      continue;
    }

    let type:
      | 'Point'
      | 'MultiPoint'
      | 'LineString'
      | 'MultiLineString'
      | 'Polygon'
      | 'MultiPolygon';

    let coordinates: any;

    // raw geometry
    switch (rawFeature.type) {
      case 1:
        if (rawFeature.geometry.length === 1) {
          type = 'Point';
          coordinates = rawFeature.geometry[0];
        } else {
          type = 'MultiPoint';
          coordinates = rawFeature.geometry;
        }
        break;
      case 2:
        if (rawFeature.geometry.length === 1) {
          type = 'LineString';
          coordinates = rawFeature.geometry[0];
        } else {
          type = 'MultiLineString';
          coordinates = rawFeature.geometry;
        }
        break;
      case 3:
        if (rawFeature.geometry.length > 1) {
          type = 'MultiPolygon';
          coordinates = [rawFeature.geometry];
        } else {
          type = 'Polygon';
          coordinates = rawFeature.geometry;
        }
        break;
      default:
        continue;
    }

    coordinates = toLngLat(coordinates, extent);

    const feature: Feature = {
      type: 'Feature',
      geometry: {
        type,
        coordinates
      },
      properties: rawFeature.tags || {}
    };

    features.push(feature);
  }

  const table: GeoJSONTable = {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features
  };

  return table;
}

function toLngLat(coords: any, extent: number): any {
  if (Array.isArray(coords[0])) {
    return coords.map((c) => toLngLat(c, extent));
  }
  return [coords[0] / extent, coords[1] / extent];
}
