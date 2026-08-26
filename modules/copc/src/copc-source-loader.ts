// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, Field, DataType, Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import type {
  CoreAPI,
  SourceLoader,
  DataSourceOptions,
  TileSource,
  TileSourceMetadata,
  GetTileParameters,
  GetTileDataParameters
} from '@loaders.gl/loader-utils';
import {
  createLAZChunkDecoderCursor,
  createLAZChunkDecoder,
  DataSource,
  concatenateArrayBuffersFromArray,
  decodeLAZChunkInBatches
} from '@loaders.gl/loader-utils';
import {Proj4Projection} from '@math.gl/proj4';

import {Copc, Las, Hierarchy, Dimension, Getter, Bounds, Key} from 'copc';

const VERSION = '1.0.0';
const COORDINATE_SYSTEM = {
  CARTESIAN: 'cartesian',
  LNGLAT_OFFSETS: 'lnglat-offsets'
} as const;

type COPCViewState = {
  boundingVolume: {
    cartographicBounds: [number[], number[]];
    center: number[];
    radius: number;
  };
  cartographicCenter: number[];
  zoom: number;
};

type COPCMetadata = TileSourceMetadata & {
  formatSpecificMetadata: Copc;
  viewState: COPCViewState;
};

type GetNodeParameters = {
  nodeIndex: [depth: number, x: number, y: number, z: number];
  columns?: string[];
  offset?: number;
  limit?: number;
};

import {COPCFormat} from './copc-format';

export type COPCSourceLoaderOptions = DataSourceOptions & {
  copc?: {
    /** Decoder backend for compressed COPC LAZ node chunks. */
    decoder?: 'laz-perf' | 'typescript-laz';
    sourceCoordinateSystem?: string;
    /** Default byte size for progressive COPC node range requests. */
    rangeChunkSize?: number;
  };
};

/** Options for progressive COPC point batches. */
export type COPCTileContentBatchOptions = {
  /** Maximum number of points in each yielded Arrow table. */
  batchSize?: number;
  /** Optional cancellation signal for the range request and decode loop. */
  signal?: AbortSignal;
  /** Arrow attributes to populate. POSITION is always included. */
  columns?: readonly ('POSITION' | 'COLOR_0')[];
  /** Byte size for progressive node range requests. */
  rangeChunkSize?: number;
};

/** Options for progressive COPC hierarchy page loading. */
export type COPCHierarchyBatchOptions = {
  /** Cancel hierarchy page requests and traversal. */
  signal?: AbortSignal;
  /** Stop after loading this many hierarchy pages. */
  maxPages?: number;
};

/** One hierarchy page and the nodes/pages discovered in it. */
export type COPCHierarchyBatch = {
  pageId: string;
  page: Hierarchy.Page;
  nodes: Hierarchy.Node.Map;
  pages: Hierarchy.Page.Map;
};

/** Arrow table content returned for one COPC tile batch. */
export type COPCTileContent = {
  data: MeshArrowTable;
  pointCount: number;
  cartographicOrigin: number[];
  coordinateSystem: (typeof COORDINATE_SYSTEM)[keyof typeof COORDINATE_SYSTEM];
};

/**
 * Creates point cloud tile source for COPC urls or blobs
 */
export const COPCSourceLoader = {
  ...COPCFormat,
  dataType: null as unknown as COPCTileSource,
  batchType: null as never,
  name: 'COPC',
  id: 'copc',
  module: 'copc',
  version: VERSION,
  encoding: 'binary',
  format: 'copc',
  extensions: ['laz'],
  mimeTypes: ['application/octet-stream'],
  type: 'copc',
  fromUrl: true,
  fromBlob: true,

  options: {
    copc: {}
  },

  defaultOptions: {
    copc: {}
  },

  testURL: (url: string) => /\.copc\.laz($|\?)/i.test(url),
  createDataSource: (url: string | Blob, options: COPCSourceLoaderOptions, coreApi?: CoreAPI) =>
    new COPCTileSource(url, options, coreApi)
} as const satisfies SourceLoader<COPCTileSource>;

/**
 * A COPC data source
 * @note Can be either a raster or vector tile source depending on the contents of the COPC file.
 */
export class COPCTileSource
  extends DataSource<string | Blob, COPCSourceLoaderOptions>
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

  constructor(data: string | Blob, options: COPCSourceLoaderOptions, coreApi?: CoreAPI) {
    super(data, options, COPCSourceLoader.defaultOptions, coreApi);
    this._urlOrGetter = createCOPCGetter(data, this.url);
    this._initPromise = this._initCopc(this.url || 'Blob');
    this.metadata = this.getMetadata();
  }

  async initialize(): Promise<void> {
    await this._initPromise;
  }

  async getSchema(): Promise<Schema> {
    const {copc, rootNode} = await this._initPromise;
    const view = await this.loadPointDataView(copc, rootNode);

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
    const viewState = this.getInferredViewState();
    const [minBounds, maxBounds] = viewState.boundingVolume.cartographicBounds;
    const metadata: COPCMetadata = {
      format: 'copc',
      boundingBox: [
        [minBounds[0], minBounds[1]],
        [maxBounds[0], maxBounds[1]]
      ],
      formatSpecificMetadata: copc,
      viewState
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
    return {
      id: '0-0-0-0',
      level: 0,
      pointCount: rootNode.pointCount,
      geometricError: this.getGeometricError(0),
      boundingVolume: this.getDataBoundingVolume()
    };
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
      childKeys.map(async childKey => {
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

  getViewState(): COPCViewState {
    return this.getInferredViewState();
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
    const view = node && (await this.loadPointDataView(copc, node));
    if (!view) {
      return null;
    }

    // console.log('Dimensions:', view.dimensions);

    const schema = await this.getSchema();
    const columnNames = schema.fields.map(field => field.name);
    const columnGetters = columnNames.map(name => view.getter(name));

    // const offset = parameters.offset || 0;
    // const limit = Math.min(parameters.limit ?? view.pointCount, view.pointCount - offset);
    // const ArrayType = getArrayTypeFromDataType(limit);

    function getXyzi(index: number): number[] {
      return columnGetters.map(get => get(index));
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

    const nativeOrigin = this.getNativeTileCenter(tile.id);
    const cartographicOrigin = this.projectPoint(nativeOrigin);

    if (
      this.options.copc?.decoder === 'typescript-laz' &&
      supportsDirectCOPCPointDataOutput(copc.header.pointDataRecordFormat)
    ) {
      return await this.loadTypeScriptTileContent(copc, node, nativeOrigin, cartographicOrigin);
    }

    const view = await this.loadPointDataView(copc, node);
    const pointCount = view.pointCount;
    const positions = new Float32Array(pointCount * 3);
    const colors = this.createColorArray(view, pointCount);

    this.populateTileAttributes(view, positions, colors, nativeOrigin, cartographicOrigin);

    return this.createTileContentResult(pointCount, positions, colors, cartographicOrigin);
  }

  /**
   * Yield TypeScript-decoded COPC tile content as Arrow batches.
   *
   * The compressed node range is currently fetched as one range request. Once
   * it is available, point batches are decoded and yielded without building a
   * full decoded node table first. The existing `loadTileContent` method
   * remains the compatibility API for callers that need one table.
   */
  async *loadTileContentInBatches(
    tile: {id: string},
    options: COPCTileContentBatchOptions = {}
  ): AsyncIterable<COPCTileContent> {
    const {copc} = await this._initPromise;
    const node = await this.getNodeById(tile.id);
    if (!node) {
      return;
    }
    if (
      this.options.copc?.decoder !== 'typescript-laz' ||
      !supportsDirectCOPCPointDataOutput(copc.header.pointDataRecordFormat)
    ) {
      throw new Error('COPC progressive batches require the TypeScript LAZ decoder for PDRF 6-8');
    }

    if (options.signal?.aborted) {
      throw new Error('COPC progressive tile decode was aborted');
    }
    const batchSize = options.batchSize ?? 65536;
    if (!Number.isSafeInteger(batchSize) || batchSize < 1) {
      throw new Error('COPC progressive tile batchSize must be a positive integer');
    }
    const nativeOrigin = this.getNativeTileCenter(tile.id);
    const cartographicOrigin = this.projectPoint(nativeOrigin);
    const colors =
      pointFormatHasColor(copc.header.pointDataRecordFormat) &&
      (options.columns ? options.columns.includes('COLOR_0') : true);
    const rangeChunkSize = options.rangeChunkSize ?? this.options.copc?.rangeChunkSize ?? 65536;
    if (!Number.isSafeInteger(rangeChunkSize) || rangeChunkSize < 1) {
      throw new Error('COPC progressive rangeChunkSize must be a positive integer');
    }

    if (!colors) {
      yield* this.loadPositionOnlyTileContentInBatches(
        copc,
        node,
        nativeOrigin,
        cartographicOrigin,
        batchSize,
        rangeChunkSize,
        options.signal
      );
      return;
    }

    const compressed = await Copc.loadCompressedPointDataBuffer(this._urlOrGetter, node);
    const cursor = createLAZChunkDecoderCursor(compressed, {
      pointCount: node.pointCount,
      pointDataRecordFormat: copc.header.pointDataRecordFormat,
      pointDataRecordLength: copc.header.pointDataRecordLength
    });

    while (cursor.remainingPointCount > 0) {
      if (options.signal?.aborted) {
        throw new Error('COPC progressive tile decode was aborted');
      }
      const pointCount = Math.min(batchSize, cursor.remainingPointCount);
      const nativePositions = new Float64Array(pointCount * 3);
      const positions = new Float32Array(pointCount * 3);
      const batchColors = colors ? new Uint16Array(pointCount * 3) : null;
      const decodedPointCount = cursor.decodeIntoPointData(
        {
          positions: nativePositions,
          rawColors: batchColors,
          pointOffset: 0,
          scale: copc.header.scale,
          offset: copc.header.offset
        },
        pointCount
      );
      if (decodedPointCount !== pointCount) {
        throw new Error(
          `COPC TypeScript LAZ decoder produced ${decodedPointCount} points; expected ${pointCount}`
        );
      }

      this.transformTilePositions(nativePositions, positions, nativeOrigin, cartographicOrigin);
      yield this.createTileContentResult(pointCount, positions, batchColors, cartographicOrigin);
    }
  }

  /** Yield position-only batches while the node range is still arriving. */
  protected async *loadPositionOnlyTileContentInBatches(
    copc: Copc,
    node: Hierarchy.Node,
    nativeOrigin: number[],
    cartographicOrigin: number[],
    batchSize: number,
    rangeChunkSize: number,
    signal?: AbortSignal
  ): AsyncIterable<COPCTileContent> {
    const decoder = createLAZChunkDecoder({
      pointCount: node.pointCount,
      pointDataRecordFormat: copc.header.pointDataRecordFormat,
      pointDataRecordLength: copc.header.pointDataRecordLength
    });
    let decodedPointCount = 0;

    for await (const compressedChunk of this.loadCOPCNodeRangeChunks(
      node,
      rangeChunkSize,
      signal
    )) {
      decoder.feed(compressedChunk);
      yield* this.readPositionOnlyBatches(
        decoder,
        copc,
        node.pointCount,
        nativeOrigin,
        cartographicOrigin,
        batchSize,
        decodedPointCount
      );
      decodedPointCount = node.pointCount - decoder.remainingPointCount;
    }

    decoder.close();
    if (decodedPointCount < node.pointCount) {
      yield* this.readPositionOnlyBatches(
        decoder,
        copc,
        node.pointCount,
        nativeOrigin,
        cartographicOrigin,
        batchSize,
        decodedPointCount
      );
      decodedPointCount = node.pointCount - decoder.remainingPointCount;
    }
    if (decodedPointCount !== node.pointCount) {
      throw new Error(
        `COPC TypeScript LAZ position decoder produced ${decodedPointCount} points; expected ${node.pointCount}`
      );
    }
  }

  /** Read all currently available position-only batches from a feedable decoder. */
  protected *readPositionOnlyBatches(
    decoder: ReturnType<typeof createLAZChunkDecoder>,
    copc: Copc,
    nodePointCount: number,
    nativeOrigin: number[],
    cartographicOrigin: number[],
    batchSize: number,
    decodedPointCount: number
  ): Iterable<COPCTileContent> {
    while (decodedPointCount < nodePointCount) {
      const pointCount = Math.min(batchSize, nodePointCount - decodedPointCount);
      const nativePositions = new Float64Array(pointCount * 3);
      const positions = new Float32Array(pointCount * 3);
      const decoded = decoder.readPositionDataBatch(
        {
          positions: nativePositions,
          pointOffset: 0,
          scale: copc.header.scale,
          offset: copc.header.offset
        },
        pointCount
      );
      if (decoded === null) {
        return;
      }
      if (decoded === 0) {
        return;
      }
      this.transformTilePositions(nativePositions, positions, nativeOrigin, cartographicOrigin);
      yield this.createTileContentResult(pointCount, positions, null, cartographicOrigin);
      decodedPointCount += decoded;
    }
  }

  /** Yield hierarchy pages as they are fetched, merging them into the cache. */
  async *loadHierarchyInBatches(
    options: COPCHierarchyBatchOptions = {}
  ): AsyncIterable<COPCHierarchyBatch> {
    const {copc} = await this._initPromise;
    const rootPage = copc.info.rootHierarchyPage;
    const pending: Array<[string, Hierarchy.Page]> = [['root', rootPage]];
    const visited = new Set<string>();
    let loadedPageCount = 0;

    while (pending.length > 0) {
      if (options.signal?.aborted) {
        throw new Error('COPC hierarchy loading was aborted');
      }
      if (options.maxPages !== undefined && loadedPageCount >= options.maxPages) {
        return;
      }
      const [pageId, page] = pending.shift()!;
      const pageKey = `${page.pageOffset}:${page.pageLength}`;
      if (visited.has(pageKey)) {
        continue;
      }
      visited.add(pageKey);
      const subtree =
        pageId === 'root' && this._hierarchy
          ? this._hierarchy
          : await Copc.loadHierarchyPage(this._urlOrGetter, page);
      if (this._hierarchy) {
        this._hierarchy.nodes = {...this._hierarchy.nodes, ...subtree.nodes};
        this._hierarchy.pages = {...this._hierarchy.pages, ...subtree.pages};
      }
      loadedPageCount++;
      yield {pageId, page, nodes: subtree.nodes, pages: subtree.pages};
      for (const [childPageId, childPage] of Object.entries(subtree.pages)) {
        if (childPage) {
          pending.push([childPageId, childPage]);
        }
      }
    }
  }

  /** Fetch a COPC node range in sequential chunks. */
  protected async *loadCOPCNodeRangeChunks(
    node: Hierarchy.Node,
    rangeChunkSize: number,
    signal?: AbortSignal
  ): AsyncIterable<Uint8Array> {
    const get = Getter.create(this._urlOrGetter);
    const rangeEnd = node.pointDataOffset + node.pointDataLength;
    for (let begin = node.pointDataOffset; begin < rangeEnd; begin += rangeChunkSize) {
      if (signal?.aborted) {
        throw new Error('COPC progressive tile range request was aborted');
      }
      const end = Math.min(begin + rangeChunkSize, rangeEnd);
      yield await get(begin, end);
    }
  }

  /** Decode a COPC node directly into the typed attributes used for rendering. */
  protected async loadTypeScriptTileContent(
    copc: Copc,
    node: Hierarchy.Node,
    nativeOrigin: number[],
    cartographicOrigin: number[]
  ) {
    const pointCount = node.pointCount;
    const compressed = await Copc.loadCompressedPointDataBuffer(this._urlOrGetter, node);
    const nativePositions = new Float64Array(pointCount * 3);
    const positions = new Float32Array(pointCount * 3);
    const colors = pointFormatHasColor(copc.header.pointDataRecordFormat)
      ? new Uint16Array(pointCount * 3)
      : null;
    const cursor = createLAZChunkDecoderCursor(compressed, {
      pointCount,
      pointDataRecordFormat: copc.header.pointDataRecordFormat,
      pointDataRecordLength: copc.header.pointDataRecordLength
    });

    const decodedPointCount = cursor.decodeIntoPointData(
      {
        positions: nativePositions,
        rawColors: colors,
        pointOffset: 0,
        scale: copc.header.scale,
        offset: copc.header.offset
      },
      pointCount
    );
    if (decodedPointCount !== pointCount) {
      throw new Error(
        `COPC TypeScript LAZ decoder produced ${decodedPointCount} points; expected ${pointCount}`
      );
    }

    this.transformTilePositions(nativePositions, positions, nativeOrigin, cartographicOrigin);
    return this.createTileContentResult(pointCount, positions, colors, cartographicOrigin);
  }

  /** Transform decoded native positions into tile-relative render coordinates. */
  protected transformTilePositions(
    nativePositions: Float64Array,
    positions: Float32Array,
    nativeOrigin: number[],
    cartographicOrigin: number[]
  ): void {
    if (!this._projection) {
      for (let index = 0; index < nativePositions.length; index += 3) {
        positions[index] = nativePositions[index] - nativeOrigin[0];
        positions[index + 1] = nativePositions[index + 1] - nativeOrigin[1];
        positions[index + 2] = nativePositions[index + 2] - nativeOrigin[2];
      }
      return;
    }

    for (let index = 0; index < nativePositions.length; index += 3) {
      const nativeZ = nativePositions[index + 2];
      // projectPoint clones its input because proj4 mutates arrays. This temporary is already owned.
      const cartographicPosition = this._projection.project([
        nativePositions[index],
        nativePositions[index + 1],
        nativeZ
      ]);
      positions[index] = cartographicPosition[0] - cartographicOrigin[0];
      positions[index + 1] = cartographicPosition[1] - cartographicOrigin[1];
      positions[index + 2] = nativeZ - nativeOrigin[2];
    }
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
    this._projection = createProjection(copc.wkt || this.options.copc?.sourceCoordinateSystem);
    this.isReady = true;
    return {copc, hierarchy, rootNode};
  }

  protected async loadPointDataView(copc: Copc, node: Hierarchy.Node) {
    if (this.options.copc?.decoder !== 'typescript-laz') {
      return await Copc.loadPointDataView(this._urlOrGetter, copc, node);
    }

    const compressed = await Copc.loadCompressedPointDataBuffer(this._urlOrGetter, node);
    const metadata = {
      pointCount: node.pointCount,
      pointDataRecordFormat: copc.header.pointDataRecordFormat,
      pointDataRecordLength: copc.header.pointDataRecordLength
    };
    const batches: Uint8Array[] = [];
    for await (const batch of decodeLAZChunkInBatches([compressed], metadata, {
      batchSize: node.pointCount
    })) {
      batches.push(batch);
    }
    const pointData = new Uint8Array(concatenateArrayBuffersFromArray(batches));
    return Las.View.create(pointData, copc.header, copc.eb);
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
    nativeOrigin: number[],
    cartographicOrigin: number[]
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
        nativeOrigin,
        cartographicOrigin
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
    nativeOrigin: number[],
    cartographicOrigin: number[]
  ): void {
    if (this._projection) {
      const cartographicPosition = this.projectPoint(nativePosition);
      positions[targetIndex] = cartographicPosition[0] - cartographicOrigin[0];
      positions[targetIndex + 1] = cartographicPosition[1] - cartographicOrigin[1];
      positions[targetIndex + 2] = nativePosition[2] - nativeOrigin[2];
      return;
    }

    positions[targetIndex] = nativePosition[0] - nativeOrigin[0];
    positions[targetIndex + 1] = nativePosition[1] - nativeOrigin[1];
    positions[targetIndex + 2] = nativePosition[2] - nativeOrigin[2];
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
  ): COPCTileContent {
    const positionsAttribute = {value: positions, size: 3};
    const colorsAttribute = colors ? {value: colors, size: 3, normalized: true} : undefined;
    const data = this.createTileContentTable(pointCount, positionsAttribute, colorsAttribute);

    return {
      data,
      pointCount,
      cartographicOrigin: origin,
      coordinateSystem: this._projection
        ? COORDINATE_SYSTEM.LNGLAT_OFFSETS
        : COORDINATE_SYSTEM.CARTESIAN
    };
  }

  protected createTileContentTable(
    pointCount: number,
    positions: {value: Float32Array; size: number},
    colors?: {value: Uint16Array; size: number; normalized: boolean}
  ): MeshArrowTable {
    const attributes: Mesh['attributes'] = {
      POSITION: positions
    };
    if (colors) {
      attributes.COLOR_0 = colors;
    }

    return convertMeshToTable(
      {
        topology: 'point-list',
        mode: 0,
        header: {vertexCount: pointCount},
        schema: {
          fields: [],
          metadata: {}
        },
        attributes
      },
      'arrow-table'
    );
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

  protected getInferredViewState(): COPCViewState {
    const boundingVolume = this.getDataBoundingVolume();
    return {
      boundingVolume,
      cartographicCenter: boundingVolume.center,
      zoom: this.estimateZoom(boundingVolume)
    };
  }

  protected getDataBoundingVolume(): {
    cartographicBounds: [number[], number[]];
    center: number[];
    radius: number;
  } {
    const {copc} = this.unwrapState();
    const [minBounds, maxBounds] = this.projectBounds([
      [copc.header.min[0], copc.header.min[1], copc.header.min[2] ?? 0],
      [copc.header.max[0], copc.header.max[1], copc.header.max[2] ?? 0]
    ]);

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
      cartographicBounds: [minBounds, maxBounds],
      center,
      radius
    };
  }

  protected getNativeTileCenter(tileId: string): number[] {
    const [minBounds, maxBounds] = this.getNativeTileBounds(tileId);
    return [
      (minBounds[0] + maxBounds[0]) / 2,
      (minBounds[1] + maxBounds[1]) / 2,
      (minBounds[2] + maxBounds[2]) / 2
    ];
  }

  protected getCartographicBounds(tileId: string): [number[], number[]] {
    return this.projectBounds(this.getNativeTileBounds(tileId));
  }

  protected getGeometricError(depth: number): number {
    const {copc} = this.unwrapState();
    return copc.info.spacing / Math.pow(2, depth);
  }

  protected estimateZoom(boundingVolume: {cartographicBounds: [number[], number[]]}): number {
    const [minBounds, maxBounds] = boundingVolume.cartographicBounds;
    const longitudeSpan = Math.max(Math.abs(maxBounds[0] - minBounds[0]), 0.000001);
    return Math.max(1, Math.round(Math.log2(360 / longitudeSpan)));
  }

  protected projectPoint(point: number[]): number[] {
    if (!this._projection) {
      return [...point];
    }

    const projectedPoint = this._projection.project([...point]);
    return [projectedPoint[0], projectedPoint[1], projectedPoint[2] ?? point[2] ?? 0];
  }

  protected projectBounds(bounds: [number[], number[]]): [number[], number[]] {
    const [minBounds, maxBounds] = bounds;
    const corners = [
      [minBounds[0], minBounds[1], minBounds[2] || 0],
      [minBounds[0], minBounds[1], maxBounds[2] || 0],
      [minBounds[0], maxBounds[1], minBounds[2] || 0],
      [minBounds[0], maxBounds[1], maxBounds[2] || 0],
      [maxBounds[0], minBounds[1], minBounds[2] || 0],
      [maxBounds[0], minBounds[1], maxBounds[2] || 0],
      [maxBounds[0], maxBounds[1], minBounds[2] || 0],
      [maxBounds[0], maxBounds[1], maxBounds[2] || 0]
    ].map(corner => this.projectPoint(corner));

    return [
      [
        Math.min(...corners.map(corner => corner[0])),
        Math.min(...corners.map(corner => corner[1])),
        Math.min(...corners.map(corner => corner[2] ?? 0))
      ],
      [
        Math.max(...corners.map(corner => corner[0])),
        Math.max(...corners.map(corner => corner[1])),
        Math.max(...corners.map(corner => corner[2] ?? 0))
      ]
    ];
  }

  protected getNativeTileBounds(tileId: string): [number[], number[]] {
    const {copc} = this.unwrapState();
    const nativeBounds = Bounds.stepTo(copc.info.cube, Key.parse(tileId));
    const dataMin = copc.header.min;
    const dataMax = copc.header.max;

    return [
      [
        Math.max(nativeBounds[0], dataMin[0]),
        Math.max(nativeBounds[1], dataMin[1]),
        Math.max(nativeBounds[2], dataMin[2] ?? nativeBounds[2])
      ],
      [
        Math.min(nativeBounds[3], dataMax[0]),
        Math.min(nativeBounds[4], dataMax[1]),
        Math.min(nativeBounds[5], dataMax[2] ?? nativeBounds[5])
      ]
    ];
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
      from: normalizeProjectionDefinition(projectionData),
      to: 'WGS84'
    });
  } catch {
    return null;
  }
}

function normalizeProjectionDefinition(projectionData: string): string {
  const horizontalWktMatch =
    projectionData.match(/(PROJCS\[[\s\S]*\])(?:,VERT_CS\[[\s\S]*\])\]$/) ||
    projectionData.match(/(GEOGCS\[[\s\S]*\])(?:,VERT_CS\[[\s\S]*\])\]$/);

  return horizontalWktMatch?.[1] || projectionData;
}

/** Return whether a valid COPC point format supports direct typed point-data output. */
function supportsDirectCOPCPointDataOutput(pointDataRecordFormat: number): boolean {
  return pointDataRecordFormat >= 6 && pointDataRecordFormat <= 8;
}

/** Return whether a LAS point format contains RGB channels. */
function pointFormatHasColor(pointDataRecordFormat: number): boolean {
  return pointDataRecordFormat === 7 || pointDataRecordFormat === 8;
}

/** Create the COPC package byte-range getter for URL/path and Blob inputs. */
function createCOPCGetter(data: string | Blob, url: string): string | Getter {
  if (typeof data === 'string') {
    return url;
  }

  return async (begin: number, end: number): Promise<Uint8Array> => {
    if (begin < 0 || end < 0 || begin > end) {
      throw new Error('Invalid range');
    }

    const arrayBuffer = await data.slice(begin, end).arrayBuffer();
    return new Uint8Array(arrayBuffer);
  };
}
