// loaders.gl
// SPDX-License-Identifier: MIT AND ISC
// Copyright (c) vis.gl contributors
// Based on https://github.com/mapbox/geojson-vt under compatible ISC license

import type {
  VectorTileSourceProps,
  GetTileDataParameters,
  GetTileParameters
} from '@loaders.gl/loader-utils';
import {VectorTileSource, log} from '@loaders.gl/loader-utils';
import {Schema, GeoJSONTable, Feature, BinaryFeatureCollection} from '@loaders.gl/schema';
import {deduceTableSchema} from '@loaders.gl/schema';
import {Stats, Stat} from '@probe.gl/stats';

import type {TableTile, TableTileFeature} from './lib/vector-tiler/tile';
import {convert} from './lib/vector-tiler/convert'; // GeoJSON conversion and preprocessing
import {clip} from './lib/vector-tiler/clip'; // stripe clipping algorithm
import {wrap} from './lib/vector-tiler/wrap'; // date line processing
import {transformTile} from './lib/vector-tiler/transform'; // coordinate transformation
import {createTile} from './lib/vector-tiler/tile'; // final simplified tile generation

import {projectToLngLat} from './lib/utils/geometry-utils';
import {convertToLocalCoordinates} from './lib/utils/geometry-utils';

/** Options to configure tiling */
export type TableTileSourceProps = VectorTileSourceProps & {
  coordinates: 'local' | 'wgs84' | 'EPSG:4326';
  /** max zoom to preserve detail on */
  maxZoom?: number;
  /** max zoom in the tile index */
  indexMaxZoom?: number;
  /** max number of points per tile in the tile index */
  maxPointsPerTile?: number;
  /** simplification tolerance (higher means simpler) */
  tolerance?: number;
  /** tile extent */
  extent?: number;
  /** tile buffer on each side */
  buffer?: number;
  /** name of a feature property to be promoted to feature.id */
  promoteId?: string;
  /** whether to generate feature ids. Cannot be used with promoteId */
  generateId?: boolean;
  /** logging level (0, 1 or 2) */
  debug?: number;
  /** whether to calculate line metrics */
  lineMetrics?: boolean;
};

/**
 * Dynamically vector tiles a table (the table needs a geometry column)
 * - Tiles are generated when requested.
 * - Each tile contains a tables of clipped features.
 *
 * @note - Currently only accepts `GeoJSONTable` tables
 * @note - Currently only outputs `GeoJSONTable`
 * @note - (can be initialized with a promise that resolves to GeoJSONTable).
 *
 * @todo - metadata should scan all rows to determine schema
 * @todo - metadata scan all rows to determine tilestats (field values[] etc).
 * @todo - handle binary input tables
 * @todo - generate binary output tables
 * @todo - how does TileSourceLayer specify coordinates / decided which layer to render with
 */
export class TableTileSource implements VectorTileSource<any> {
  static defaultProps: Required<TableTileSourceProps> = {
    coordinates: 'wgs84', // coordinates in tile coordinates or lng/lat
    maxZoom: 14, // max zoom to preserve detail on
    indexMaxZoom: 5, // max zoom in the tile index
    maxPointsPerTile: 100000, // max number of points per tile in the tile index
    tolerance: 3, // simplification tolerance (higher means simpler)
    extent: 4096, // tile extent
    buffer: 64, // tile buffer on each side
    lineMetrics: false, // whether to calculate line metrics
    // @ts-expect-error
    promoteId: undefined, // name of a feature property to be promoted to feature.id
    generateId: false, // whether to generate feature ids. Cannot be used with promoteId
    debug: 0 // logging level (0, 1 or 2)
  };

  /** Global stats for all TableTileSources */
  static stats = new Stats({
    id: 'table-tile-source-all',
    stats: [new Stat('count', 'tiles'), new Stat('count', 'features')]
  });

  /** Stats for this TableTileSource */
  stats = new Stats({
    id: 'table-tile-source',
    stats: [new Stat('tiles', 'count'), new Stat('features', 'count')]
  });

  /** MIME type of the tiles emitted by this tile source */
  readonly mimeType = 'application/vnd.mapbox-vector-tile';
  readonly localCoordinates = true;

  /** The props that this tile source was created with */
  props: Required<TableTileSourceProps>;

  /* Schema of the data */
  schema: Schema | null = null;

  /** Map of generated tiles, indexed by stringified tile coordinates */
  tiles: Record<string, TableTile> = {};
  /** Array of tile coordinates */
  tileCoords: {x: number; y: number; z: number}[] = [];

  /** Input data has loaded, initial top-level tiling is done, sync methods can now be called */
  ready: Promise<void>;
  /** Metadata for the tile source (generated TileJSON/tilestats */
  metadata: Promise<unknown>;

  constructor(table: GeoJSONTable | Promise<GeoJSONTable>, props?: TableTileSourceProps) {
    this.props = {...TableTileSource.defaultProps, ...props};
    this.getTileData = this.getTileData.bind(this);
    this.ready = this.initializeTilesAsync(table);
    this.metadata = this.getMetadata();
  }

  async initializeTilesAsync(tablePromise: GeoJSONTable | Promise<GeoJSONTable>): Promise<void> {
    const table = await tablePromise;
    this.schema = deduceTableSchema(table);
    this.createRootTiles(table);
  }

  async getMetadata(): Promise<unknown> {
    await this.ready;
    return {schema: this.schema, minZoom: 0, maxZoom: this.props.maxZoom};
  }

  async getSchema(): Promise<Schema> {
    await this.ready;
    return this.schema!;
  }

  /**
   * Get a tile at the specified index
   * @param tileIndex z, x, y of tile
   * @returns
   */
  async getVectorTile(tileIndex: GetTileParameters): Promise<GeoJSONTable | null> {
    await this.ready;
    const table = this.getTileSync(tileIndex);
    log.info(2, 'getVectorTile', tileIndex, table)();
    return table;
  }

  async getTile(tileIndex: {z: number; x: number; y: number}): Promise<GeoJSONTable | null> {
    await this.ready;
    return this.getTileSync(tileIndex);
  }

  async getTileData(
    tileParams: GetTileDataParameters
  ): Promise<Feature[] | BinaryFeatureCollection> {
    const {x, y, z} = tileParams.index;
    const tile = await this.getVectorTile({x, y, z});
    return tile?.features || [];
  }

  // Implementation

  /**
   * Synchronously request a tile
   * @note Application must await `source.ready` before calling sync methods.
   */
  getTileSync(tileIndex: {z: number; x: number; y: number}): GeoJSONTable | null {
    const rawTile = this.getRawTile(tileIndex);
    if (!rawTile) {
      return null;
    }

    return convertToGeoJSONTable(rawTile, {
      coordinates: this.props.coordinates,
      tileIndex,
      extent: this.props.extent
    });
  }

  /**
   * Create the initial tiles
   * @note the tiles stores all the features together with additional data
   */
  createRootTiles(table: GeoJSONTable): void {
    if (this.props.maxZoom < 0 || this.props.maxZoom > 24) {
      throw new Error('maxZoom should be in the 0-24 range');
    }
    if (this.props.promoteId && this.props.generateId) {
      throw new Error('promoteId and generateId cannot be used together.');
    }

    log.log(1, 'TableTileSource creating root tiles', this.props)();

    // projects and adds simplification info
    log.time(1, 'preprocess table')();
    let features = convert(table, this.props);
    log.timeEnd(1, 'preprocess table')();

    // wraps features (ie extreme west and extreme east)
    log.time(1, 'generate tiles')();

    features = wrap(features, this.props);

    // start slicing from the top tile down
    if (features.length === 0) {
      log.log(1, 'TableTileSource: no features generated')();
      return;
    }

    this.splitTile(features, 0, 0, 0);

    const rootTile = this.tiles[0];
    log.log(1, `root tile features: ${rootTile.numFeatures}, points: ${rootTile.numPoints}`)();

    log.timeEnd(1, 'generate tiles')();
    log.log(1, `TableTileSource: tiles generated: ${this.stats.get('total').count}`, this.stats)();
  }

  /**
   * Return geojsonvt-style "half formed" vector tile
   * @note Application must await `source.ready` before calling sync methods.
   */
  // eslint-disable-next-line complexity, max-statements
  getRawTile(tileIndex: {z: number; x: number; y: number}): TableTile | null {
    const {z, y} = tileIndex;
    let {x} = tileIndex;
    // z = +z;
    // x = +x;
    // y = +y;

    const {extent} = this.props;

    if (z < 0 || z > 24) {
      return null;
    }

    const z2 = 1 << z;
    x = (x + z2) & (z2 - 1); // wrap tile x coordinate

    const id = toID(z, x, y);
    if (this.tiles[id]) {
      return transformTile(this.tiles[id], extent);
    }

    log.log(log, 'drilling down to z%d-%d-%d', z, x, y)();

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
    log.log(1, 'found parent tile z%d-%d-%d', z0, x0, y0)();
    log.time(1, 'drilling down')();

    this.splitTile(parent.source, z0, x0, y0, z, x, y);

    log.timeEnd(1, 'drilling down')();

    return this.tiles[id] ? transformTile(this.tiles[id], extent) : null;
  }

  /**
   * splits features from a parent tile to sub-tiles.
   * @param z, x, and y are the coordinates of the parent tile
   * @param cz, cx, and cy are the coordinates of the target tile
   *
   * If no target tile is specified, splitting stops when we reach the maximum
   * zoom or the number of points is low as specified in the props.
   */
  // eslint-disable-next-line max-params, max-statements, complexity
  splitTile(
    features: TableTileFeature[],
    z: number,
    x: number,
    y: number,
    cz?: number,
    cx?: number,
    cy?: number
  ): void {
    const stack: any[] = [features, z, x, y];

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
        log.time(2, 'tile creation')();

        tile = this.tiles[id] = createTile(features, z, x, y, this.props);
        this.tileCoords.push({z, x, y});

        const key = `z${z}`;
        let stat = this.stats.get(key, 'count');
        stat.incrementCount();

        stat = this.stats.get('total');
        stat.incrementCount();

        stat = TableTileSource.stats.get(key, 'count');
        stat.incrementCount();

        stat = TableTileSource.stats.get('total');
        stat.incrementCount();

        log.log(
          2,
          'tile z%d-%d-%d (features: %d, points: %d, simplified: %d)',
          z,
          x,
          y,
          tile.numFeatures,
          tile.numPoints,
          tile.numSimplified
        )();
        log.timeEnd(2, 'tile creation')();
      }

      // save reference to original geometry in tile so that we can drill down later if we stop now
      tile.source = features;

      /** eslint-disable no-continue */

      // if it's the first-pass tiling
      if (cz === undefined) {
        // stop tiling if we reached max zoom, or if the tile is too simple
        if (z === this.props.indexMaxZoom || tile.numPoints <= this.props.maxPointsPerTile) {
          continue;
        }
        // if a drilldown to a specific tile
      } else if (z === this.props.maxZoom || z === cz) {
        // stop tiling if we reached base zoom or our target tile zoom
        continue;
      } else if (cz !== undefined) {
        // stop tiling if it's not an ancestor of the target tile
        const zoomSteps = cz - z;
        // @ts-expect-error TODO fix the types of cx cy
        if (x !== cx >> zoomSteps || y !== cy >> zoomSteps) {
          continue;
        }
      }

      // if we slice further down, no need to keep source geometry
      tile.source = null;

      if (features.length === 0) continue;

      log.time(2, 'clipping tile')();

      // values we'll use for clipping
      const k1 = (0.5 * this.props.buffer) / this.props.extent;
      const k2 = 0.5 - k1;
      const k3 = 0.5 + k1;
      const k4 = 1 + k1;

      let tl: TableTileFeature[] | null = null;
      let bl: TableTileFeature[] | null = null;
      let tr: TableTileFeature[] | null = null;
      let br: TableTileFeature[] | null = null;

      let left = clip(features, z2, x - k1, x + k3, 0, tile.minX, tile.maxX, this.props);
      let right = clip(features, z2, x + k2, x + k4, 0, tile.minX, tile.maxX, this.props);

      // @ts-expect-error - unclear why this is needed?
      features = null;

      if (left) {
        tl = clip(left, z2, y - k1, y + k3, 1, tile.minY, tile.maxY, this.props);
        bl = clip(left, z2, y + k2, y + k4, 1, tile.minY, tile.maxY, this.props);
        left = null;
      }

      if (right) {
        tr = clip(right, z2, y - k1, y + k3, 1, tile.minY, tile.maxY, this.props);
        br = clip(right, z2, y + k2, y + k4, 1, tile.minY, tile.maxY, this.props);
        right = null;
      }

      log.timeEnd(2, 'clipping tile')();

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

// eslint-disable-next-line max-statements, complexity
function convertToGeoJSONTable(
  vtTile: TableTile,
  props: {
    coordinates: 'local' | 'wgs84' | 'EPSG:4326';
    tileIndex: {x: number; y: number; z: number};
    extent: number;
  }
): GeoJSONTable | null {
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

    switch (props.coordinates) {
      case 'EPSG:4326':
      case 'wgs84':
        projectToLngLat(coordinates, props.tileIndex, props.extent);
        break;

      case 'local':
        convertToLocalCoordinates(coordinates, props.extent);
        break;

      default:
        throw new Error(`Unsupported CRS ${props.coordinates}`);
    }

    const feature: Feature = {
      type: 'Feature',
      geometry: {
        type,
        coordinates
      },
      properties: rawFeature.tags || {},
      id: rawFeature.id
    };

    features.push(feature);
  }

  if (features.length === 0) {
    return null;
  }

  const table: GeoJSONTable = {
    shape: 'geojson-table',
    type: 'FeatureCollection',
    features
  };

  return table;
}
