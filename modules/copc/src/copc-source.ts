// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, Field, DataType} from '@loaders.gl/schema';
import type {
  Source,
  DataSourceOptions,
  TileSource,
  GetTileParameters,
  GetTileDataParameters
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {Proj4Projection} from '@math.gl/proj4';

import {Copc, Hierarchy, Dimension, Getter, Bounds, Key} from 'copc';

const VERSION = '1.0.0';
const COORDINATE_SYSTEM = {
  CARTESIAN: 0,
  METER_OFFSETS: 2,
  LNGLAT_OFFSETS: 3
};

type COPCMetadata = Record<string, unknown>;

type GetNodeParameters = {
  nodeIndex: [depth: number, x: number, y: number, z: number];
  columns?: string[];
  offset?: number;
  limit?: number;
};

export type COPCSourceOptions = DataSourceOptions & {
  copc?: {};
};

/**
 * Creates point cloud tile source for COPC urls or blobs
 */
export const COPCSource = {
  name: 'COPC',
  id: 'copc',
  module: 'copc',
  version: VERSION,
  extensions: ['laz'],
  mimeTypes: ['application/octet-stream'],
  type: 'copc',
  fromUrl: true,
  fromBlob: true,

  defaultOptions: {
    copc: {}
  },

  testURL: (url: string) => /\.copc\.laz($|\?)/i.test(url),
  createDataSource: (url: string | Blob, options: COPCSourceOptions) =>
    new COPCTileSource(url, options)
} as const satisfies Source<COPCTileSource>;

/**
 * A COPC data source
 * @note Can be either a raster or vector tile source depending on the contents of the COPC file.
 */
export class COPCTileSource
  extends DataSource<string | Blob, COPCSourceOptions>
  implements TileSource
{
  mimeType: string | null = null;
  metadata: Promise<COPCMetadata>;
  isReady = false;

  protected _initPromise: Promise<{
    copc: Copc;
    hierarchy: Hierarchy.Subtree;
    rootNode: Hierarchy.Node;
  }>;
  protected _urlOrGetter: string | Getter;
  protected _copc: Copc | null = null;
  protected _projection: Proj4Projection | null = null;
  protected _hierarchy: Hierarchy.Subtree | null = null;
  protected _pageLoadPromises: Map<string, Promise<void>> = new Map();

  constructor(data: string | Blob, options: COPCSourceOptions) {
    super(data, options, COPCSource.defaultOptions);
    // TODO - create a getter if a blob
    this._urlOrGetter = this.url as any;
    this._initPromise = this._initCopc(this.url);
    this.metadata = this.getMetadata();
  }

  async initialize(): Promise<void> {
    await this._initPromise;
  }

  async getSchema(): Promise<Schema> {
    const {copc, rootNode} = await this._initPromise;
    const view = await Copc.loadPointDataView(this._urlOrGetter, copc, rootNode);

    const fields: Field[] = [];
    for (const [name, dimension] of Object.entries(view.dimensions)) {
      if (dimension) {
        const type = getDataTypeFromDimension(dimension);
        fields.push({name, type, nullable: false});
      }
    }

    return {fields, metadata: {}};
  }

  async getMetadata(): Promise<COPCMetadata> {
    const {copc} = await this._initPromise;
    const metadata: COPCMetadata = {
      formatSpecificMetadata: copc
    };
    return metadata;
  }

  async getRootTile(): Promise<{
    id: string;
    level: number;
    pointCount: number;
    geometricError: number;
    boundingVolume: {
      cartographicBounds: [number[], number[]];
      center: number[];
      radius: number;
    };
  }> {
    const {rootNode} = await this._initPromise;
    return this.getTileHeader('0-0-0-0', rootNode);
  }

  async getChildren(tile: {id: string}): Promise<
    {
      id: string;
      level: number;
      pointCount: number;
      geometricError: number;
      boundingVolume: {
        cartographicBounds: [number[], number[]];
        center: number[];
        radius: number;
      };
    }[]
  > {
    await this.initialize();
    await this.ensureHierarchyLoaded(tile.id);

    const childKeys = this.getChildKeys(tile.id);
    const children = await Promise.all(
      childKeys.map(async (childKey) => {
        const node = await this.getNodeById(childKey);
        return node ? this.getTileHeader(childKey, node) : null;
      })
    );

    return children.filter(Boolean) as {
      id: string;
      level: number;
      pointCount: number;
      geometricError: number;
      boundingVolume: {
        cartographicBounds: [number[], number[]];
        center: number[];
        radius: number;
      };
    }[];
  }

  getViewState(): {
    boundingVolume: {
      cartographicBounds: [number[], number[]];
      center: number[];
      radius: number;
    };
    cartographicCenter: number[];
  } {
    const boundingVolume = this.getBoundingVolume('0-0-0-0');
    return {
      boundingVolume,
      cartographicCenter: boundingVolume.center
    };
  }

  async getTile(tileParams: GetTileParameters): Promise<number[] | null> {
    const nodeIndex: [number, number, number, number] = [
      0,
      tileParams.x,
      tileParams.y,
      tileParams.z
    ];
    return this.getPoints({nodeIndex});
  }

  async getTileData(parameters: GetTileDataParameters): Promise<unknown | null> {
    throw new Error('Not implemented');
  }

  async getPoints(parameters: GetNodeParameters) {
    const {copc} = await this._initPromise;
    const node = await this.getNode(parameters);
    const view = node && (await Copc.loadPointDataView(this._urlOrGetter, copc, node));
    if (!view) {
      return null;
    }

    // console.log('Dimensions:', view.dimensions);

    const schema = await this.getSchema();
    const columnNames = schema.fields.map((field) => field.name);
    const columnGetters = columnNames.map((name) => view.getter(name));

    // const offset = parameters.offset || 0;
    // const limit = Math.min(parameters.limit ?? view.pointCount, view.pointCount - offset);
    // const ArrayType = getArrayTypeFromDataType(limit);

    function getXyzi(index: number): number[] {
      return columnGetters.map((get) => get(index));
    }
    const point = getXyzi(0);
    // console.log('Point:', point);
    return point;
  }

  async getNode(parameters: GetNodeParameters): Promise<Hierarchy.Node | undefined> {
    return await this.getNodeById(Key.toString(parameters.nodeIndex));
  }

  async loadTileContent(tile: {id: string}) {
    const {copc} = await this._initPromise;
    const node = await this.getNodeById(tile.id);
    if (!node) {
      return null;
    }

    const view = await Copc.loadPointDataView(this._urlOrGetter, copc, node);
    const pointCount = view.pointCount;
    const positions = new Float32Array(pointCount * 3);
    const origin = this.getTileCenter(tile.id);
    const colors = this.createColorArray(view, pointCount);

    this.populateTileAttributes(view, positions, colors, origin);

    return this.createTileContentResult(pointCount, positions, colors, origin);
  }

  async _initCopc(url: string) {
    const copc = await Copc.create(this._urlOrGetter);
    const hierarchy = await Copc.loadHierarchyPage(this._urlOrGetter, copc.info.rootHierarchyPage);
    const {['0-0-0-0']: rootNode} = hierarchy.nodes;
    if (!rootNode) {
      throw new Error(`Failed to load COPC hierarchy root node ${url}`);
    }
    this._copc = copc;
    this._hierarchy = hierarchy;
    this._projection = createProjection(copc.wkt);
    this.isReady = true;
    return {copc, hierarchy, rootNode};
  }

  protected async getNodeById(tileId: string): Promise<Hierarchy.Node | undefined> {
    await this.initialize();

    if (!this._hierarchy) {
      return undefined;
    }

    if (this._hierarchy.nodes[tileId]) {
      return this._hierarchy.nodes[tileId];
    }

    const parentKeys = this.getAncestorKeys(tileId);
    for (const parentKey of parentKeys) {
      await this.ensureHierarchyLoaded(parentKey);
      if (this._hierarchy.nodes[tileId]) {
        return this._hierarchy.nodes[tileId];
      }
    }

    return this._hierarchy.nodes[tileId];
  }

  protected createColorArray(
    view: Awaited<ReturnType<typeof Copc.loadPointDataView>>,
    pointCount: number
  ) {
    const hasColors =
      Boolean(view.dimensions.Red) &&
      Boolean(view.dimensions.Green) &&
      Boolean(view.dimensions.Blue);
    return hasColors ? new Uint16Array(pointCount * 3) : null;
  }

  protected populateTileAttributes(
    view: Awaited<ReturnType<typeof Copc.loadPointDataView>>,
    positions: Float32Array,
    colors: Uint16Array | null,
    origin: number[]
  ): void {
    const getX = view.getter('X');
    const getY = view.getter('Y');
    const getZ = view.getter('Z');
    const getRed = colors ? view.getter('Red') : null;
    const getGreen = colors ? view.getter('Green') : null;
    const getBlue = colors ? view.getter('Blue') : null;

    for (let index = 0; index < view.pointCount; index++) {
      const targetIndex = index * 3;
      this.writePositionValues(
        positions,
        targetIndex,
        [getX(index), getY(index), getZ(index)],
        origin
      );
      if (colors && getRed && getGreen && getBlue) {
        this.writeColorValues(colors, targetIndex, getRed(index), getGreen(index), getBlue(index));
      }
    }
  }

  protected writePositionValues(
    positions: Float32Array,
    targetIndex: number,
    nativePosition: [number, number, number],
    origin: number[]
  ): void {
    const projectedPosition = this.projectPoint(nativePosition);
    positions[targetIndex] = projectedPosition[0] - origin[0];
    positions[targetIndex + 1] = projectedPosition[1] - origin[1];
    positions[targetIndex + 2] = projectedPosition[2] - origin[2];
  }

  protected writeColorValues(
    colors: Uint16Array,
    targetIndex: number,
    red: number,
    green: number,
    blue: number
  ): void {
    colors[targetIndex] = red;
    colors[targetIndex + 1] = green;
    colors[targetIndex + 2] = blue;
  }

  protected createTileContentResult(
    pointCount: number,
    positions: Float32Array,
    colors: Uint16Array | null,
    origin: number[]
  ) {
    const positionsAttribute = {value: positions, size: 3};
    const colorsAttribute = colors ? {value: colors, size: 3, normalized: true} : undefined;

    return {
      attributes: {
        positions: positionsAttribute,
        POSITION: positionsAttribute,
        colors: colorsAttribute,
        COLOR_0: colorsAttribute
      },
      pointCount,
      cartographicOrigin: origin,
      coordinateSystem: this._projection
        ? COORDINATE_SYSTEM.LNGLAT_OFFSETS
        : COORDINATE_SYSTEM.METER_OFFSETS
    };
  }

  protected async ensureHierarchyLoaded(tileId: string): Promise<void> {
    await this.initialize();

    if (!this._hierarchy) {
      return;
    }

    const page = this._hierarchy.pages[tileId];
    if (!page) {
      return;
    }

    if (!this._pageLoadPromises.has(tileId)) {
      const loadPromise = this.loadHierarchyPage(tileId, page);
      this._pageLoadPromises.set(tileId, loadPromise);
    }

    await this._pageLoadPromises.get(tileId);
  }

  protected async loadHierarchyPage(tileId: string, page: Hierarchy.Page): Promise<void> {
    if (!this._hierarchy) {
      return;
    }

    const subtree = await Copc.loadHierarchyPage(this._urlOrGetter, page);
    this._hierarchy.nodes = {
      ...this._hierarchy.nodes,
      ...subtree.nodes
    };
    this._hierarchy.pages = {
      ...this._hierarchy.pages,
      ...subtree.pages
    };
    delete this._hierarchy.pages[tileId];
  }

  protected getTileHeader(
    tileId: string,
    node: Hierarchy.Node
  ): {
    id: string;
    level: number;
    pointCount: number;
    geometricError: number;
    boundingVolume: {
      cartographicBounds: [number[], number[]];
      center: number[];
      radius: number;
    };
  } {
    const [depth] = Key.parse(tileId);
    return {
      id: tileId,
      level: depth,
      pointCount: node.pointCount,
      geometricError: this.getGeometricError(depth),
      boundingVolume: this.getBoundingVolume(tileId)
    };
  }

  protected getBoundingVolume(tileId: string): {
    cartographicBounds: [number[], number[]];
    center: number[];
    radius: number;
  } {
    const [minBounds, maxBounds] = this.getCartographicBounds(tileId);
    const center = [
      (minBounds[0] + maxBounds[0]) / 2,
      (minBounds[1] + maxBounds[1]) / 2,
      (minBounds[2] + maxBounds[2]) / 2
    ];
    const radius = Math.sqrt(
      Math.pow(maxBounds[0] - center[0], 2) +
        Math.pow(maxBounds[1] - center[1], 2) +
        Math.pow(maxBounds[2] - center[2], 2)
    );

    return {
      cartographicBounds: [minBounds, maxBounds] as [number[], number[]],
      center,
      radius
    };
  }

  protected getTileCenter(tileId: string): number[] {
    return this.getBoundingVolume(tileId).center;
  }

  protected getCartographicBounds(tileId: string): [number[], number[]] {
    const {copc} = this.unwrapState();
    const nativeBounds = Bounds.stepTo(copc.info.cube, Key.parse(tileId));
    const minPoint = this.projectPoint([nativeBounds[0], nativeBounds[1], nativeBounds[2]]);
    const maxPoint = this.projectPoint([nativeBounds[3], nativeBounds[4], nativeBounds[5]]);

    return [
      [
        Math.min(minPoint[0], maxPoint[0]),
        Math.min(minPoint[1], maxPoint[1]),
        Math.min(minPoint[2], maxPoint[2])
      ],
      [
        Math.max(minPoint[0], maxPoint[0]),
        Math.max(minPoint[1], maxPoint[1]),
        Math.max(minPoint[2], maxPoint[2])
      ]
    ];
  }

  protected getGeometricError(depth: number): number {
    const {copc} = this.unwrapState();
    return copc.info.spacing / Math.pow(2, depth);
  }

  protected projectPoint(point: number[]): number[] {
    if (!this._projection) {
      return [...point];
    }

    const [x, y] = this._projection.project(point);
    return [x, y, point[2]];
  }

  protected getChildKeys(tileId: string): string[] {
    const key = Key.parse(tileId);
    const result: string[] = [];

    for (let childX = 0; childX < 2; childX++) {
      for (let childY = 0; childY < 2; childY++) {
        for (let childZ = 0; childZ < 2; childZ++) {
          result.push(
            Key.toString([
              key[0] + 1,
              key[1] * 2 + childX,
              key[2] * 2 + childY,
              key[3] * 2 + childZ
            ])
          );
        }
      }
    }

    return result;
  }

  protected getAncestorKeys(tileId: string): string[] {
    const key = Key.parse(tileId);
    const result: string[] = [];

    for (let depth = key[0] - 1; depth >= 0; depth--) {
      result.push(
        Key.toString([
          depth,
          key[1] >> (key[0] - depth),
          key[2] >> (key[0] - depth),
          key[3] >> (key[0] - depth)
        ])
      );
    }

    return result;
  }

  protected unwrapState(): {
    copc: Copc;
    hierarchy: Hierarchy.Subtree;
  } {
    if (!this._copc || !this._hierarchy) {
      throw new Error('COPC source is not initialized');
    }

    return {
      copc: this._copc,
      hierarchy: this._hierarchy
    };
  }

  /*
  async getTile(tileParams: GetTileParameters): Promise<ArrayBuffer | null> {
    const {x, y, z} = tileParams;
    const rangeResponse = await this.pmtiles.getZxy(z, x, y);
    const arrayBuffer = rangeResponse?.data;
    if (!arrayBuffer) {
      // console.error('No arrayBuffer', tileParams);
      return null;
    }
    return arrayBuffer;
  }

  // Tile Source interface implementation: deck.gl compatible API
  // TODO - currently only handles image tiles, not vector tiles

  async getTileData(tileParams: GetTileDataParameters): Promise<any> {
    const {x, y, z} = tileParams.index;
    const metadata = await this.metadata;
    switch (metadata.tileMIMEType) {
      case 'application/vnd.mapbox-vector-tile':
        return await this.getVectorTile({x, y, z, layers: []});
      default:
        return await this.getImageTile({x, y, z, layers: []});
    }
  }
  */
}

function getDataTypeFromDimension(dimension: Dimension): DataType {
  const {type, size} = dimension;
  switch (type) {
    case 'unsigned':
      return size === 1 ? 'uint8' : size === 2 ? 'uint16' : size === 4 ? 'uint32' : 'uint64';
    case 'signed':
      return size === 1 ? 'int8' : size === 2 ? 'int16' : size === 4 ? 'int32' : 'int64';
    case 'float':
      return size === 4 ? 'float32' : 'float64';
    default:
      return 'null';
  }
}

function createProjection(projectionData?: string): Proj4Projection | null {
  if (!projectionData) {
    return null;
  }

  try {
    return new Proj4Projection({
      from: projectionData,
      to: 'WGS84'
    });
  } catch {
    return null;
  }
}
