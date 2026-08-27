// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, Field, Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import type {
  CoreAPI,
  SourceLoader,
  DataSourceOptions,
  StrictLoaderOptions,
  TileSource,
  TileSourceMetadata,
  GetTileParameters,
  GetTileDataParameters
} from '@loaders.gl/loader-utils';
import {
  canParseWithWorker,
  createLAZChunkDecoderCursor,
  createLAZChunkDecoder,
  BlobFile,
  DataSource,
  HttpFile,
  isBrowser,
  NodeFile,
  parseWithWorker,
  type ReadableFile
} from '@loaders.gl/loader-utils';
import {
  createScanQueryMetadata,
  validatePointCloudQueryOptions,
  type PointCloudQueryCapabilities,
  type PointCloudQueryBounds,
  type PointCloudQueryOptions
} from '@loaders.gl/loader-utils';
import {Proj4Projection, type Proj4CRSDefinition} from '@math.gl/proj4';
import {
  createLASTypedExtraBytesAttributes,
  LASLoader,
  populateLASTypedExtraBytes,
  type LASTypedExtraBytesAttribute
} from '@loaders.gl/las';

const VERSION = '1.0.0';
const COPC_PREFIX_CACHE_LENGTH = 65536;
const COPC_RANGE_CACHE_MAX_BYTES = 32 * 1024 * 1024;
const COORDINATE_SYSTEM = {
  CARTESIAN: 'cartesian',
  LNGLAT_OFFSETS: 'lnglat-offsets'
} as const;

/** Infers a query-panel semantic role from a COPC dimension name. */
function inferCOPCColumnRole(
  name: string
): 'attribute' | 'x' | 'y' | 'z' | 'intensity' | 'classification' | 'color' {
  const normalizedName = name.toLowerCase();
  if (normalizedName === 'x') return 'x';
  if (normalizedName === 'y') return 'y';
  if (normalizedName === 'z') return 'z';
  if (normalizedName.includes('intensity')) return 'intensity';
  if (normalizedName.includes('classification')) return 'classification';
  if (normalizedName.includes('color') || normalizedName.includes('red')) return 'color';
  return 'attribute';
}

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
  formatSpecificMetadata: COPCFile;
  viewState: COPCViewState;
};

type GetNodeParameters = {
  nodeIndex: [depth: number, x: number, y: number, z: number];
  columns?: string[];
  offset?: number;
  limit?: number;
};

export type COPCPointColumn =
  | 'POSITION'
  | 'COLOR_0'
  | 'NIR'
  | 'intensity'
  | 'classification'
  | 'synthetic'
  | 'keyPoint'
  | 'withheld'
  | 'overlap'
  | 'GPS_TIME'
  | 'scanAngle'
  | 'userData'
  | 'pointSourceId'
  | 'returnNumber'
  | 'numberOfReturns'
  | 'scannerChannel'
  | 'scanDirectionFlag'
  | 'edgeOfFlightLine'
  | 'EXTRA_BYTES';

type COPCPointSelection = {
  colors: boolean;
  nir: boolean;
  intensity: boolean;
  classification: boolean;
  synthetic: boolean;
  keyPoint: boolean;
  withheld: boolean;
  overlap: boolean;
  gpsTime: boolean;
  scanAngle: boolean;
  userData: boolean;
  pointSourceId: boolean;
  returnNumber: boolean;
  numberOfReturns: boolean;
  scannerChannel: boolean;
  scanDirectionFlag: boolean;
  edgeOfFlightLine: boolean;
  extraBytes: boolean;
};

/** Options for scanning COPC point data with hierarchy pushdown. */
export type COPCScanOptions = PointCloudQueryOptions & {
  /** Maximum number of points yielded in one Arrow batch. */
  batchSize?: number;
  /** Byte size for progressive node range requests. */
  rangeChunkSize?: number;
  /** Maximum number of node ranges fetched ahead of decode. */
  rangeConcurrency?: number;
};

type COPCPointDataArrays = {
  batchIntensities: Uint16Array | null;
  batchClassifications: Uint8Array | null;
  batchSyntheticFlags: Uint8Array | null;
  batchKeyPointFlags: Uint8Array | null;
  batchWithheldFlags: Uint8Array | null;
  batchOverlapFlags: Uint8Array | null;
  batchGpsTimes: Float64Array | null;
  batchScanAngles: Int16Array | null;
  batchUserData: Uint8Array | null;
  batchPointSourceIds: Uint16Array | null;
  batchReturnNumbers: Uint8Array | null;
  batchNumberOfReturns: Uint8Array | null;
  batchScannerChannels: Uint8Array | null;
  batchScanDirectionFlags: Uint8Array | null;
  batchEdgeOfFlightLines: Uint8Array | null;
  typedExtraBytes: LASTypedExtraBytesAttribute[];
};

import {COPCFormat} from './copc-format';
import {
  formatCOPCKey,
  getCOPCKeyBounds,
  loadCOPCHierarchyPage,
  loadCOPCNodeData,
  openCOPC,
  parseCOPCKey,
  type COPCFile,
  type COPCHeader,
  type COPCHierarchy,
  type COPCHierarchyNode,
  type COPCHierarchyPage,
  type COPCRangeReader
} from './lib/copc-reader';

export type COPCSourceLoaderOptions = DataSourceOptions & {
  copc?: {
    sourceCoordinateSystem?: Proj4CRSDefinition;
    /** Default byte size for progressive COPC node range requests. */
    rangeChunkSize?: number;
    /** Maximum number of COPC node ranges fetched ahead of decode. */
    rangeConcurrency?: number;
    /** Maximum number of complete COPC nodes fetched and decoded concurrently. */
    decodeConcurrency?: number;
  };
};

/** Options for one complete COPC tile-content load. */
export type COPCTileContentLoadOptions = {
  /** Cancel a queued range request or active worker decode. */
  signal?: AbortSignal;
  /** Arrow attributes to populate. POSITION is always included. */
  columns?: readonly COPCPointColumn[];
};

/** Options for progressive COPC point batches. */
export type COPCTileContentBatchOptions = {
  /** Maximum number of points in each yielded Arrow table. */
  batchSize?: number;
  /** Maximum number of points to yield before closing the iterator. */
  limit?: number;
  /** Optional cancellation signal for the range request and decode loop. */
  signal?: AbortSignal;
  /** Arrow attributes to populate. POSITION is always included. */
  columns?: readonly (
    | 'POSITION'
    | 'COLOR_0'
    | 'NIR'
    | 'intensity'
    | 'classification'
    | 'synthetic'
    | 'keyPoint'
    | 'withheld'
    | 'overlap'
    | 'GPS_TIME'
    | 'scanAngle'
    | 'userData'
    | 'pointSourceId'
    | 'returnNumber'
    | 'numberOfReturns'
    | 'scannerChannel'
    | 'scanDirectionFlag'
    | 'edgeOfFlightLine'
    | 'EXTRA_BYTES'
  )[];
  /** Byte size for progressive node range requests. */
  rangeChunkSize?: number;
  /** Maximum number of node ranges fetched ahead of decode. Defaults to 1. */
  rangeConcurrency?: number;
  /** Optional source-coordinate bounds for exact point-level filtering. */
  bounds?: PointCloudQueryBounds;
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
  page: COPCHierarchyPage;
  nodes: COPCHierarchy['nodes'];
  pages: COPCHierarchy['pages'];
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
  /** Common point-cloud scan capabilities exposed by COPC. */
  readonly pointCloudQueryCapabilities: PointCloudQueryCapabilities = Object.freeze({
    projection: 'pushdown',
    predicate: 'unsupported',
    limit: 'pushdown+residual',
    streaming: true,
    cancellation: true,
    bounds: 'pushdown',
    levelOfDetail: 'pushdown',
    spacing: 'pushdown'
  });
  mimeType: string | null = null;
  metadata: Promise<COPCMetadata>;
  isReady = false;

  protected _initPromise: Promise<{
    copc: COPCFile;
    hierarchy: COPCHierarchy;
    rootNode: COPCHierarchyNode;
  }>;
  protected _readableFile: ReadableFile;
  protected _readRange: COPCRangeReader;
  protected _copc: COPCFile | null = null;
  protected _projection: Proj4Projection | null = null;
  protected _hierarchy: COPCHierarchy | null = null;
  protected _pageLoadPromises: Map<string, Promise<void>> = new Map();
  protected _closePromise: Promise<void> | null = null;
  /** Bounds complete node fetches and worker decodes to control peak memory. */
  protected readonly _nodeDecodeSemaphore: AsyncSemaphore;

  constructor(data: string | Blob, options: COPCSourceLoaderOptions, coreApi?: CoreAPI) {
    super(data, options, COPCSourceLoader.defaultOptions, coreApi);
    this._readableFile = createCOPCReadableFile(data, this.url, this.fetch);
    this._readRange = createCachedCOPCRangeReader(this._readableFile);
    const decodeConcurrency =
      this.options.copc?.decodeConcurrency ?? this.loadOptions.core?.maxConcurrency ?? 3;
    if (!Number.isSafeInteger(decodeConcurrency) || decodeConcurrency < 1) {
      throw new Error('COPC decodeConcurrency must be a positive integer');
    }
    this._nodeDecodeSemaphore = new AsyncSemaphore(decodeConcurrency);
    this._initPromise = this._initCopc(this.url || 'Blob');
    this.metadata = this.getMetadata();
  }

  async initialize(): Promise<void> {
    await this._initPromise;
  }

  /** Release the underlying random-access file handle. */
  close(): Promise<void> {
    this._closePromise ||= this._readableFile.close();
    return this._closePromise;
  }

  async getSchema(): Promise<Schema> {
    const {copc} = await this._initPromise;
    return getCOPCHeaderSchema(copc);
  }

  /** Discovers point attributes and spatial bounds without decoding point rows. */
  async getQueryMetadata() {
    const {copc} = await this._initPromise;
    const schema = getCOPCScanSchema(copc);
    const roles = Object.fromEntries(
      schema.fields.map(field => [field.name, inferCOPCColumnRole(field.name)])
    );
    return createScanQueryMetadata({
      sourceType: 'copc',
      queryType: 'point-cloud',
      schema,
      capabilities: {
        table: this.pointCloudQueryCapabilities,
        bounds: 'pushdown',
        levelOfDetail: 'pushdown'
      },
      columnRoles: roles,
      spatial: {
        bounds: {minimum: copc.header.min, maximum: copc.header.max},
        coordinateReferenceSystems: copc.wkt
          ? [copc.wkt]
          : typeof this.options.copc?.sourceCoordinateSystem === 'string'
            ? [this.options.copc.sourceCoordinateSystem]
            : undefined
      },
      statistics: {rowCount: copc.header.pointCount}
    });
  }

  /**
   * Scan COPC points using hierarchy-level spatial and resolution pushdown.
   *
   * Bounds and level constraints are applied before node byte ranges are
   * requested. The optional limit is exact and stops decoding once enough
   * rows have been yielded. Predicate evaluation is intentionally rejected
   * until a zero-copy Arrow residual filter is available.
   */
  async *scan(options: COPCScanOptions = {}): AsyncIterable<COPCTileContent> {
    const {copc} = await this._initPromise;
    const sourceColumns = getCOPCScanColumns(copc);
    validatePointCloudQueryOptions(sourceColumns, options);
    if (options.predicate) {
      throw new Error('COPC scan predicates are not supported yet');
    }
    if (options.signal?.aborted) {
      throw new Error('COPC scan was aborted');
    }

    // Load only hierarchy pages and keep point-data ranges deferred until the
    // spatial and LOD filters have selected concrete nodes.
    for await (const _page of this.loadHierarchyInBatches({signal: options.signal})) {
      // Traversal updates the source hierarchy cache as pages arrive.
    }

    const selectedColumns = options.columns
      ? ([
          'POSITION',
          ...options.columns.filter(column => column !== 'POSITION')
        ] as COPCPointColumn[])
      : getCOPCScanColumns(copc);
    const selectedNodes = Object.entries(this._hierarchy?.nodes || {})
      .filter(
        ([tileId, node]) =>
          node !== undefined && isCOPCScanNodeSelected(copc, tileId, node, options)
      )
      .sort(([firstTileId], [secondTileId]) => compareCOPCScanNodes(firstTileId, secondTileId));

    let remaining = options.limit ?? Number.MAX_SAFE_INTEGER;
    if (remaining === 0) {
      return;
    }
    for (const [tileId] of selectedNodes) {
      if (remaining <= 0) {
        return;
      }
      if (options.signal?.aborted) {
        throw new Error('COPC scan was aborted');
      }
      // Keep the caller's preferred batch size while capping each node at the
      // remaining limit. The progressive decoder emits a smaller final batch.
      const nodeBatchSize = Math.min(remaining, options.batchSize ?? 65536);
      for await (const batch of this.loadTileContentInBatches(
        {id: tileId},
        {
          batchSize: nodeBatchSize,
          limit: remaining,
          columns: selectedColumns,
          bounds: options.bounds,
          rangeChunkSize: options.rangeChunkSize,
          rangeConcurrency: options.rangeConcurrency,
          signal: options.signal
        }
      )) {
        yield batch;
        remaining -= batch.pointCount;
        if (remaining === 0) {
          return;
        }
      }
    }
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
    return await this.loadTileContent({id: parameters.id}, {signal: parameters.signal});
  }

  async getPoints(parameters: GetNodeParameters) {
    const {copc} = await this._initPromise;
    const node = await this.getNode(parameters);
    if (!node || node.pointCount === 0) {
      return null;
    }
    const compressed = await loadCOPCNodeData(this._readRange, node);
    const pointData = new Uint8Array(copc.header.pointDataRecordLength);
    const cursor = createLAZChunkDecoderCursor(
      compressed,
      getCOPCLAZChunkMetadata(copc, node.pointCount)
    );
    cursor.decodeInto(pointData, 0, 1);
    return readCOPCPointValues(pointData, copc.header);
  }

  async getNode(parameters: GetNodeParameters): Promise<COPCHierarchyNode | undefined> {
    return await this.getNodeById(formatCOPCKey(parameters.nodeIndex));
  }

  /** Load one complete COPC node, using the shared LAS worker pool when available. */
  async loadTileContent(tile: {id: string}, options: COPCTileContentLoadOptions = {}) {
    const release = await this._nodeDecodeSemaphore.acquire(options.signal);
    try {
      throwIfCOPCLoadAborted(options.signal);
      const {copc} = await this._initPromise;
      const node = await this.getNodeById(tile.id);
      if (!node) {
        return null;
      }

      const nativeOrigin = this.getNativeTileCenter(tile.id);
      const cartographicOrigin = this.projectPoint(nativeOrigin);

      return await this.loadTypeScriptTileContent(
        copc,
        node,
        nativeOrigin,
        cartographicOrigin,
        options.signal,
        options.columns
      );
    } finally {
      release();
    }
  }

  /**
   * Yield TypeScript-decoded COPC tile content as Arrow batches.
   *
   * The compressed node range is fetched in bounded chunks. Chunks may be
   * prefetched, but point batches are decoded and yielded in range order
   * without building a full decoded node table first. The existing
   * `loadTileContent` method remains the compatibility API for callers that
   * need one table.
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
    if (options.signal?.aborted) {
      throw new Error('COPC progressive tile decode was aborted');
    }
    const batchSize = options.batchSize ?? 65536;
    if (!Number.isSafeInteger(batchSize) || batchSize < 1) {
      throw new Error('COPC progressive tile batchSize must be a positive integer');
    }
    if (
      options.limit !== undefined &&
      (!Number.isSafeInteger(options.limit) || options.limit < 0)
    ) {
      throw new Error('COPC progressive tile limit must be a non-negative integer');
    }
    if (options.limit === 0) {
      return;
    }
    const nativeOrigin = this.getNativeTileCenter(tile.id);
    const cartographicOrigin = this.projectPoint(nativeOrigin);
    const selection = getCOPCPointSelection(copc, options.columns);
    const rangeChunkSize = options.rangeChunkSize ?? this.options.copc?.rangeChunkSize ?? 65536;
    if (!Number.isSafeInteger(rangeChunkSize) || rangeChunkSize < 1) {
      throw new Error('COPC progressive rangeChunkSize must be a positive integer');
    }
    const rangeConcurrency = options.rangeConcurrency ?? this.options.copc?.rangeConcurrency ?? 1;
    if (!Number.isSafeInteger(rangeConcurrency) || rangeConcurrency < 1) {
      throw new Error('COPC progressive rangeConcurrency must be a positive integer');
    }

    if (options.columns?.includes('NIR') && copc.header.pointDataRecordFormat !== 8) {
      throw new Error('COPC NIR output requires PDRF 8');
    }
    if (selection.extraBytes && !copc.extraBytes) {
      throw new Error('COPC typed Extra Bytes output requires an Extra Bytes VLR');
    }

    yield* this.loadProgressiveTileContentInBatches(
      copc,
      node,
      nativeOrigin,
      cartographicOrigin,
      batchSize,
      rangeChunkSize,
      rangeConcurrency,
      options.signal,
      selection,
      options.bounds,
      options.limit
    );
  }

  /** Yield selectively requested batches while the node range is still arriving. */
  protected async *loadProgressiveTileContentInBatches(
    copc: COPCFile,
    node: COPCHierarchyNode,
    nativeOrigin: number[],
    cartographicOrigin: number[],
    batchSize: number,
    rangeChunkSize: number,
    rangeConcurrency: number,
    signal: AbortSignal | undefined,
    selection: COPCPointSelection,
    bounds?: PointCloudQueryBounds,
    limit?: number
  ): AsyncIterable<COPCTileContent> {
    const decoder = createLAZChunkDecoder(getCOPCLAZChunkMetadata(copc, node.pointCount));
    let decodedPointCount = 0;
    const remainingPointCount = {value: limit ?? Number.MAX_SAFE_INTEGER};

    for await (const compressedChunk of this.loadCOPCNodeRangeChunks(
      node,
      rangeChunkSize,
      rangeConcurrency,
      signal
    )) {
      decoder.feed(compressedChunk);
      yield* this.readProgressiveBatches(
        decoder,
        copc,
        node.pointCount,
        nativeOrigin,
        cartographicOrigin,
        batchSize,
        decodedPointCount,
        selection,
        bounds,
        remainingPointCount
      );
      decodedPointCount = node.pointCount - decoder.remainingPointCount;
      if (remainingPointCount.value <= 0) {
        return;
      }
    }

    decoder.close();
    if (decodedPointCount < node.pointCount) {
      yield* this.readProgressiveBatches(
        decoder,
        copc,
        node.pointCount,
        nativeOrigin,
        cartographicOrigin,
        batchSize,
        decodedPointCount,
        selection,
        bounds,
        remainingPointCount
      );
      decodedPointCount = node.pointCount - decoder.remainingPointCount;
      if (remainingPointCount.value <= 0) {
        return;
      }
    }
    if (decodedPointCount !== node.pointCount) {
      throw new Error(
        `COPC TypeScript LAZ point-data decoder produced ${decodedPointCount} points; expected ${node.pointCount}`
      );
    }
  }

  /** Read all currently available selectively requested batches from a feedable decoder. */
  protected *readProgressiveBatches(
    decoder: ReturnType<typeof createLAZChunkDecoder>,
    copc: COPCFile,
    nodePointCount: number,
    nativeOrigin: number[],
    cartographicOrigin: number[],
    batchSize: number,
    decodedPointCount: number,
    selection: COPCPointSelection,
    bounds: PointCloudQueryBounds | undefined,
    remainingPointCount: {value: number}
  ): Iterable<COPCTileContent> {
    while (decodedPointCount < nodePointCount && remainingPointCount.value > 0) {
      const pointCount = Math.min(
        batchSize,
        nodePointCount - decodedPointCount,
        remainingPointCount.value
      );
      const directRelativePositions = !this._projection && !bounds;
      const nativePositions = directRelativePositions ? null : new Float64Array(pointCount * 3);
      const positions = new Float32Array(pointCount * 3);
      const batchColors = selection.colors ? new Uint16Array(pointCount * 3) : null;
      const batchNir = selection.nir ? new Uint16Array(pointCount) : null;
      const batchIntensities = selection.intensity ? new Uint16Array(pointCount) : null;
      const batchClassifications = selection.classification ? new Uint8Array(pointCount) : null;
      const batchSyntheticFlags = selection.synthetic ? new Uint8Array(pointCount) : null;
      const batchKeyPointFlags = selection.keyPoint ? new Uint8Array(pointCount) : null;
      const batchWithheldFlags = selection.withheld ? new Uint8Array(pointCount) : null;
      const batchOverlapFlags = selection.overlap ? new Uint8Array(pointCount) : null;
      const batchGpsTimes = selection.gpsTime ? new Float64Array(pointCount) : null;
      const batchScanAngles = selection.scanAngle ? new Int16Array(pointCount) : null;
      const batchUserData = selection.userData ? new Uint8Array(pointCount) : null;
      const batchPointSourceIds = selection.pointSourceId ? new Uint16Array(pointCount) : null;
      const batchReturnNumbers = selection.returnNumber ? new Uint8Array(pointCount) : null;
      const batchNumberOfReturns = selection.numberOfReturns ? new Uint8Array(pointCount) : null;
      const batchScannerChannels = selection.scannerChannel ? new Uint8Array(pointCount) : null;
      const batchScanDirectionFlags = selection.scanDirectionFlag
        ? new Uint8Array(pointCount)
        : null;
      const batchEdgeOfFlightLines = selection.edgeOfFlightLine ? new Uint8Array(pointCount) : null;
      const extraByteCount = getCOPCExtraByteCount(copc.header);
      const batchExtraBytes = selection.extraBytes
        ? new Uint8Array(pointCount * extraByteCount)
        : null;
      const decoded = decoder.readPointDataBatch(
        {
          positions: directRelativePositions ? positions : nativePositions!,
          positionOrigin: directRelativePositions
            ? (nativeOrigin as [number, number, number])
            : undefined,
          rawColors: batchColors,
          nir: batchNir,
          intensities: batchIntensities,
          classifications: batchClassifications,
          syntheticFlags: batchSyntheticFlags,
          keyPointFlags: batchKeyPointFlags,
          withheldFlags: batchWithheldFlags,
          overlapFlags: batchOverlapFlags,
          gpsTimes: batchGpsTimes,
          scanAngles: batchScanAngles,
          userData: batchUserData,
          pointSourceIds: batchPointSourceIds,
          returnNumbers: batchReturnNumbers,
          numberOfReturns: batchNumberOfReturns,
          scannerChannels: batchScannerChannels,
          scanDirectionFlags: batchScanDirectionFlags,
          edgeOfFlightLines: batchEdgeOfFlightLines,
          extraBytes: batchExtraBytes,
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
      decodedPointCount += decoded;
      const selectedPointIndices = bounds
        ? getCOPCPointIndicesWithinBounds(nativePositions!, decoded, bounds)
        : null;
      if (selectedPointIndices && selectedPointIndices.length === 0) {
        continue;
      }
      const filteredPointCount = selectedPointIndices?.length ?? decoded;
      remainingPointCount.value -= filteredPointCount;
      const filteredNativePositions = bounds
        ? (selectCOPCPointArray(nativePositions!, selectedPointIndices!, 3) as Float64Array)
        : nativePositions;
      const filteredPositions = directRelativePositions
        ? positions
        : new Float32Array(filteredPointCount * 3);
      const filteredColors = bounds
        ? selectCOPCPointArray(batchColors, selectedPointIndices!, 3)
        : batchColors;
      const filteredNir = bounds
        ? selectCOPCPointArray(batchNir, selectedPointIndices!, 1)
        : batchNir;
      const filteredPointData = bounds
        ? filterCOPCPointData(
            {
              batchIntensities,
              batchClassifications,
              batchSyntheticFlags,
              batchKeyPointFlags,
              batchWithheldFlags,
              batchOverlapFlags,
              batchGpsTimes,
              batchScanAngles,
              batchUserData,
              batchPointSourceIds,
              batchReturnNumbers,
              batchNumberOfReturns,
              batchScannerChannels,
              batchScanDirectionFlags,
              batchEdgeOfFlightLines,
              typedExtraBytes: []
            },
            selectedPointIndices!
          )
        : {
            batchIntensities,
            batchClassifications,
            batchSyntheticFlags,
            batchKeyPointFlags,
            batchWithheldFlags,
            batchOverlapFlags,
            batchGpsTimes,
            batchScanAngles,
            batchUserData,
            batchPointSourceIds,
            batchReturnNumbers,
            batchNumberOfReturns,
            batchScannerChannels,
            batchScanDirectionFlags,
            batchEdgeOfFlightLines,
            typedExtraBytes: []
          };
      const filteredExtraBytes = bounds
        ? selectCOPCPointArray(batchExtraBytes, selectedPointIndices!, extraByteCount)
        : batchExtraBytes;
      const typedExtraBytes = filteredExtraBytes
        ? createLASTypedExtraBytesAttributes(
            filteredPointCount,
            copc.extraBytesDescriptors,
            extraByteCount
          )
        : [];
      if (filteredExtraBytes) {
        populateLASTypedExtraBytes(
          filteredExtraBytes,
          filteredPointCount,
          extraByteCount,
          typedExtraBytes
        );
      }
      if (!directRelativePositions) {
        this.transformTilePositions(
          filteredNativePositions!,
          filteredPositions,
          nativeOrigin,
          cartographicOrigin
        );
      }
      yield this.createTileContentResult(
        filteredPointCount,
        filteredPositions,
        filteredColors,
        cartographicOrigin,
        filteredNir,
        {
          ...filteredPointData,
          typedExtraBytes
        }
      );
    }
  }

  /** Yield hierarchy pages as they are fetched, merging them into the cache. */
  async *loadHierarchyInBatches(
    options: COPCHierarchyBatchOptions = {}
  ): AsyncIterable<COPCHierarchyBatch> {
    const {copc} = await this._initPromise;
    const rootPage = copc.info.rootHierarchyPage;
    const pending: Array<[string, COPCHierarchyPage]> = [['root', rootPage]];
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
          : await loadCOPCHierarchyPage(this._readRange, page, options.signal);
      if (this._hierarchy) {
        this._hierarchy.nodes = {...this._hierarchy.nodes, ...subtree.nodes};
        this._hierarchy.pages = {...this._hierarchy.pages, ...subtree.pages};
        delete this._hierarchy.pages[pageId];
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

  /** Fetch a COPC node range in bounded parallel chunks while preserving order. */
  protected async *loadCOPCNodeRangeChunks(
    node: COPCHierarchyNode,
    rangeChunkSize: number,
    rangeConcurrency: number,
    signal?: AbortSignal
  ): AsyncIterable<Uint8Array> {
    const rangeEnd = node.pointDataOffset + node.pointDataLength;
    const rangeCount = Math.ceil(node.pointDataLength / rangeChunkSize);
    type RangeResult = {chunk: Uint8Array; error?: never} | {chunk?: never; error: unknown};
    const pending = new Map<number, Promise<RangeResult>>();
    let nextToSchedule = 0;
    try {
      for (let nextToYield = 0; nextToYield < rangeCount; nextToYield++) {
        if (signal?.aborted) {
          throw new Error('COPC progressive tile range request was aborted');
        }
        while (nextToSchedule < rangeCount && pending.size < rangeConcurrency) {
          const begin = node.pointDataOffset + nextToSchedule * rangeChunkSize;
          const end = Math.min(begin + rangeChunkSize, rangeEnd);
          pending.set(
            nextToSchedule,
            this._readRange(begin, end, signal).then(
              chunk => ({chunk}),
              error => ({error})
            )
          );
          nextToSchedule++;
        }
        const result = await pending.get(nextToYield)!;
        pending.delete(nextToYield);
        if ('error' in result) {
          throw result.error;
        }
        if (signal?.aborted) {
          throw new Error('COPC progressive tile range request was aborted');
        }
        yield result.chunk;
      }
    } finally {
      // Promises are handled at creation, so abandoned prefetches cannot reject globally.
      pending.clear();
    }
  }

  /** Decode a COPC node directly into the typed attributes used for rendering. */
  protected async loadTypeScriptTileContent(
    copc: COPCFile,
    node: COPCHierarchyNode,
    nativeOrigin: number[],
    cartographicOrigin: number[],
    signal?: AbortSignal,
    columns?: readonly COPCPointColumn[]
  ) {
    const pointCount = node.pointCount;
    const compressed = await loadCOPCNodeData(this._readRange, node, signal);
    const workerPointData = await this.decodeNodeOnWorker(copc, node, compressed, signal, columns);
    if (workerPointData) {
      this.transformTilePositions(
        workerPointData.nativePositions,
        workerPointData.positions,
        nativeOrigin,
        cartographicOrigin
      );
      return this.createTileContentResult(
        pointCount,
        workerPointData.positions,
        workerPointData.colors,
        cartographicOrigin
      );
    }

    if (columns?.includes('NIR') && copc.header.pointDataRecordFormat !== 8) {
      throw new Error('COPC NIR output requires PDRF 8');
    }
    if (columns?.includes('EXTRA_BYTES') && !copc.extraBytes) {
      throw new Error('COPC typed Extra Bytes output requires an Extra Bytes VLR');
    }
    const selection = getCOPCPointSelection(copc, columns);
    const nativePositions = new Float64Array(pointCount * 3);
    const positions = new Float32Array(pointCount * 3);
    const colors = selection.colors ? new Uint16Array(pointCount * 3) : null;
    const nir = selection.nir ? new Uint16Array(pointCount) : null;
    const batchIntensities = selection.intensity ? new Uint16Array(pointCount) : null;
    const batchClassifications = selection.classification ? new Uint8Array(pointCount) : null;
    const batchSyntheticFlags = selection.synthetic ? new Uint8Array(pointCount) : null;
    const batchKeyPointFlags = selection.keyPoint ? new Uint8Array(pointCount) : null;
    const batchWithheldFlags = selection.withheld ? new Uint8Array(pointCount) : null;
    const batchOverlapFlags = selection.overlap ? new Uint8Array(pointCount) : null;
    const batchGpsTimes = selection.gpsTime ? new Float64Array(pointCount) : null;
    const batchScanAngles = selection.scanAngle ? new Int16Array(pointCount) : null;
    const batchUserData = selection.userData ? new Uint8Array(pointCount) : null;
    const batchPointSourceIds = selection.pointSourceId ? new Uint16Array(pointCount) : null;
    const batchReturnNumbers = selection.returnNumber ? new Uint8Array(pointCount) : null;
    const batchNumberOfReturns = selection.numberOfReturns ? new Uint8Array(pointCount) : null;
    const batchScannerChannels = selection.scannerChannel ? new Uint8Array(pointCount) : null;
    const batchScanDirectionFlags = selection.scanDirectionFlag ? new Uint8Array(pointCount) : null;
    const batchEdgeOfFlightLines = selection.edgeOfFlightLine ? new Uint8Array(pointCount) : null;
    const extraByteCount = getCOPCExtraByteCount(copc.header);
    const batchExtraBytes = selection.extraBytes
      ? new Uint8Array(pointCount * extraByteCount)
      : null;
    const decoder = createLAZChunkDecoder(getCOPCLAZChunkMetadata(copc, pointCount));
    decoder.feed(compressed);
    decoder.close();
    const decodedPointCount = decoder.readPointDataBatch(
      {
        positions: nativePositions,
        rawColors: colors,
        nir,
        intensities: batchIntensities,
        classifications: batchClassifications,
        syntheticFlags: batchSyntheticFlags,
        keyPointFlags: batchKeyPointFlags,
        withheldFlags: batchWithheldFlags,
        overlapFlags: batchOverlapFlags,
        gpsTimes: batchGpsTimes,
        scanAngles: batchScanAngles,
        userData: batchUserData,
        pointSourceIds: batchPointSourceIds,
        returnNumbers: batchReturnNumbers,
        numberOfReturns: batchNumberOfReturns,
        scannerChannels: batchScannerChannels,
        scanDirectionFlags: batchScanDirectionFlags,
        edgeOfFlightLines: batchEdgeOfFlightLines,
        extraBytes: batchExtraBytes,
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

    const typedExtraBytes = batchExtraBytes
      ? createLASTypedExtraBytesAttributes(pointCount, copc.extraBytesDescriptors, extraByteCount)
      : [];
    if (batchExtraBytes) {
      populateLASTypedExtraBytes(batchExtraBytes, pointCount, extraByteCount, typedExtraBytes);
    }
    this.transformTilePositions(nativePositions, positions, nativeOrigin, cartographicOrigin);
    return this.createTileContentResult(pointCount, positions, colors, cartographicOrigin, nir, {
      batchIntensities,
      batchClassifications,
      batchSyntheticFlags,
      batchKeyPointFlags,
      batchWithheldFlags,
      batchOverlapFlags,
      batchGpsTimes,
      batchScanAngles,
      batchUserData,
      batchPointSourceIds,
      batchReturnNumbers,
      batchNumberOfReturns,
      batchScannerChannels,
      batchScanDirectionFlags,
      batchEdgeOfFlightLines,
      typedExtraBytes
    });
  }

  /** Decode one complete node in the shared LAS worker pool when workers are available. */
  protected async decodeNodeOnWorker(
    copc: COPCFile,
    node: COPCHierarchyNode,
    compressed: Uint8Array,
    signal?: AbortSignal,
    columns?: readonly COPCPointColumn[]
  ): Promise<{
    nativePositions: Float64Array;
    positions: Float32Array;
    colors: Uint16Array | null;
  } | null> {
    if (columns?.some(column => column !== 'POSITION' && column !== 'COLOR_0')) {
      return null;
    }
    const workerOptions = this.getNodeWorkerOptions(copc, node, columns);
    if (!this.hasCoreApi || !canParseWithWorker(LASLoader, workerOptions)) {
      return null;
    }
    const input = getStandaloneArrayBuffer(compressed);
    const mesh = (await parseWithWorker(
      LASLoader,
      input,
      workerOptions,
      undefined,
      undefined,
      signal
    )) as Mesh;
    const nativePositions = mesh.attributes.POSITION?.value;
    const colors = mesh.attributes.COLOR_0?.value || null;
    if (
      !(nativePositions instanceof Float64Array) ||
      nativePositions.length !== node.pointCount * 3
    ) {
      throw new Error('COPC LAS worker returned invalid positions');
    }
    if (
      colors !== null &&
      (!(colors instanceof Uint16Array) || colors.length !== node.pointCount * 3)
    ) {
      throw new Error('COPC LAS worker returned invalid colors');
    }
    return {
      nativePositions,
      positions: new Float32Array(node.pointCount * 3),
      colors
    };
  }

  /** Build the serializable standalone-chunk request consumed by the LAS worker. */
  protected getNodeWorkerOptions(
    copc: COPCFile,
    node: COPCHierarchyNode,
    requestedColumns?: readonly COPCPointColumn[]
  ): StrictLoaderOptions {
    const columns = requestedColumns
      ? [...requestedColumns]
      : pointFormatHasColor(copc.header.pointDataRecordFormat)
        ? ['POSITION', 'COLOR_0']
        : ['POSITION'];
    return {
      ...this.loadOptions,
      core: {
        ...this.loadOptions.core,
        worker: this.loadOptions.core?.worker ?? true,
        maxConcurrency:
          this.options.copc?.decodeConcurrency ?? this.loadOptions.core?.maxConcurrency ?? 3
      },
      las: {
        ...this.loadOptions.las,
        shape: 'mesh',
        fp64: true,
        colorDepth: 16,
        columns,
        _chunk: {
          metadata: {
            ...getCOPCLAZChunkMetadata(copc, node.pointCount),
            scale: copc.header.scale,
            offset: copc.header.offset
          }
        }
      }
    };
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
    const copc = await openCOPC(this._readRange);
    const hierarchy = await loadCOPCHierarchyPage(this._readRange, copc.info.rootHierarchyPage);
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

  protected async getNodeById(tileId: string): Promise<COPCHierarchyNode | undefined> {
    await this.initialize();

    if (!this._hierarchy) {
      return undefined;
    }

    if (this._hierarchy.nodes[tileId]) {
      return this._hierarchy.nodes[tileId];
    }

    const hierarchyKeys = [...this.getAncestorKeys(tileId).reverse(), tileId];
    for (const hierarchyKey of hierarchyKeys) {
      await this.ensureHierarchyLoaded(hierarchyKey);
      if (this._hierarchy.nodes[tileId]) {
        return this._hierarchy.nodes[tileId];
      }
    }

    return this._hierarchy.nodes[tileId];
  }

  protected createTileContentResult(
    pointCount: number,
    positions: Float32Array,
    colors: Uint16Array | null,
    origin: number[],
    nir: Uint16Array | null = null,
    pointData: COPCPointDataArrays | null = null
  ): COPCTileContent {
    const positionsAttribute = {value: positions, size: 3};
    const colorsAttribute = colors ? {value: colors, size: 3, normalized: true} : undefined;
    const data = this.createTileContentTable(
      pointCount,
      positionsAttribute,
      colorsAttribute,
      nir ? {value: nir, size: 1} : undefined,
      pointData
    );

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
    colors?: {value: Uint16Array; size: number; normalized: boolean},
    nir?: {value: Uint16Array; size: number},
    pointData?: COPCPointDataArrays | null
  ): MeshArrowTable {
    const attributes: Mesh['attributes'] = {
      POSITION: positions
    };
    if (colors) {
      attributes.COLOR_0 = colors;
    }
    if (nir) {
      attributes.NIR = nir;
    }
    if (pointData?.batchIntensities) {
      attributes.intensity = {value: pointData.batchIntensities, size: 1};
    }
    if (pointData?.batchClassifications) {
      attributes.classification = {value: pointData.batchClassifications, size: 1};
    }
    if (pointData?.batchSyntheticFlags) {
      attributes.synthetic = {value: pointData.batchSyntheticFlags, size: 1};
    }
    if (pointData?.batchKeyPointFlags) {
      attributes.keyPoint = {value: pointData.batchKeyPointFlags, size: 1};
    }
    if (pointData?.batchWithheldFlags) {
      attributes.withheld = {value: pointData.batchWithheldFlags, size: 1};
    }
    if (pointData?.batchOverlapFlags) {
      attributes.overlap = {value: pointData.batchOverlapFlags, size: 1};
    }
    if (pointData?.batchGpsTimes) {
      attributes.GPS_TIME = {value: pointData.batchGpsTimes, size: 1};
    }
    if (pointData?.batchScanAngles) {
      attributes.scanAngle = {value: pointData.batchScanAngles, size: 1};
    }
    if (pointData?.batchUserData) {
      attributes.userData = {value: pointData.batchUserData, size: 1};
    }
    if (pointData?.batchPointSourceIds) {
      attributes.pointSourceId = {value: pointData.batchPointSourceIds, size: 1};
    }
    if (pointData?.batchReturnNumbers) {
      attributes.returnNumber = {value: pointData.batchReturnNumbers, size: 1};
    }
    if (pointData?.batchNumberOfReturns) {
      attributes.numberOfReturns = {value: pointData.batchNumberOfReturns, size: 1};
    }
    if (pointData?.batchScannerChannels) {
      attributes.scannerChannel = {value: pointData.batchScannerChannels, size: 1};
    }
    if (pointData?.batchScanDirectionFlags) {
      attributes.scanDirectionFlag = {value: pointData.batchScanDirectionFlags, size: 1};
    }
    if (pointData?.batchEdgeOfFlightLines) {
      attributes.edgeOfFlightLine = {value: pointData.batchEdgeOfFlightLines, size: 1};
    }
    for (const attribute of pointData?.typedExtraBytes || []) {
      attributes[attribute.name] = {value: attribute.value, size: attribute.size};
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

  protected async loadHierarchyPage(tileId: string, page: COPCHierarchyPage): Promise<void> {
    if (!this._hierarchy) {
      return;
    }

    const subtree = await loadCOPCHierarchyPage(this._readRange, page);
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
    node: COPCHierarchyNode
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
    const [depth] = parseCOPCKey(tileId);
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
    const nativeBounds = getCOPCKeyBounds(copc.info.cube, parseCOPCKey(tileId));
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
    const key = parseCOPCKey(tileId);
    if (key[0] === 31) {
      return [];
    }
    const result: string[] = [];

    for (let childX = 0; childX < 2; childX++) {
      for (let childY = 0; childY < 2; childY++) {
        for (let childZ = 0; childZ < 2; childZ++) {
          result.push(
            formatCOPCKey([
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
    const key = parseCOPCKey(tileId);
    const result: string[] = [];

    for (let depth = key[0] - 1; depth >= 0; depth--) {
      result.push(
        formatCOPCKey([
          depth,
          Math.floor(key[1] / 2 ** (key[0] - depth)),
          Math.floor(key[2] / 2 ** (key[0] - depth)),
          Math.floor(key[3] / 2 ** (key[0] - depth))
        ])
      );
    }

    return result;
  }

  protected unwrapState(): {
    copc: COPCFile;
    hierarchy: COPCHierarchy;
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

/** Returns point indexes whose native positions fall inside inclusive scan bounds. */
function getCOPCPointIndicesWithinBounds(
  nativePositions: Float64Array,
  pointCount: number,
  bounds: PointCloudQueryBounds
): number[] {
  const pointIndices: number[] = [];
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const positionIndex = pointIndex * 3;
    if (
      nativePositions[positionIndex] >= bounds.minimum[0] &&
      nativePositions[positionIndex] <= bounds.maximum[0] &&
      nativePositions[positionIndex + 1] >= bounds.minimum[1] &&
      nativePositions[positionIndex + 1] <= bounds.maximum[1] &&
      nativePositions[positionIndex + 2] >= bounds.minimum[2] &&
      nativePositions[positionIndex + 2] <= bounds.maximum[2]
    ) {
      pointIndices.push(pointIndex);
    }
  }
  return pointIndices;
}

/** Selects fixed-width values from a typed point-data array. */
function selectCOPCPointArray<T extends Uint8Array | Uint16Array | Int16Array | Float64Array>(
  values: T | null,
  pointIndices: readonly number[],
  itemSize: number
): T | null {
  if (!values) return null;
  const TypedArrayConstructor = values.constructor as {new (length: number): T};
  const selectedValues = new TypedArrayConstructor(pointIndices.length * itemSize);
  for (let outputIndex = 0; outputIndex < pointIndices.length; outputIndex++) {
    const inputIndex = pointIndices[outputIndex] * itemSize;
    selectedValues.set(
      values.subarray(inputIndex, inputIndex + itemSize) as T & ArrayLike<number>,
      outputIndex * itemSize
    );
  }
  return selectedValues;
}

/** Selects scalar point-data attributes while preserving their typed-array classes. */
function filterCOPCPointData(
  pointData: COPCPointDataArrays,
  pointIndices: readonly number[]
): COPCPointDataArrays {
  return {
    batchIntensities: selectCOPCPointArray(pointData.batchIntensities, pointIndices, 1),
    batchClassifications: selectCOPCPointArray(pointData.batchClassifications, pointIndices, 1),
    batchSyntheticFlags: selectCOPCPointArray(pointData.batchSyntheticFlags, pointIndices, 1),
    batchKeyPointFlags: selectCOPCPointArray(pointData.batchKeyPointFlags, pointIndices, 1),
    batchWithheldFlags: selectCOPCPointArray(pointData.batchWithheldFlags, pointIndices, 1),
    batchOverlapFlags: selectCOPCPointArray(pointData.batchOverlapFlags, pointIndices, 1),
    batchGpsTimes: selectCOPCPointArray(pointData.batchGpsTimes, pointIndices, 1),
    batchScanAngles: selectCOPCPointArray(pointData.batchScanAngles, pointIndices, 1),
    batchUserData: selectCOPCPointArray(pointData.batchUserData, pointIndices, 1),
    batchPointSourceIds: selectCOPCPointArray(pointData.batchPointSourceIds, pointIndices, 1),
    batchReturnNumbers: selectCOPCPointArray(pointData.batchReturnNumbers, pointIndices, 1),
    batchNumberOfReturns: selectCOPCPointArray(pointData.batchNumberOfReturns, pointIndices, 1),
    batchScannerChannels: selectCOPCPointArray(pointData.batchScannerChannels, pointIndices, 1),
    batchScanDirectionFlags: selectCOPCPointArray(
      pointData.batchScanDirectionFlags,
      pointIndices,
      1
    ),
    batchEdgeOfFlightLines: selectCOPCPointArray(pointData.batchEdgeOfFlightLines, pointIndices, 1),
    typedExtraBytes: []
  };
}

/** Returns the Arrow columns that this COPC source can decode selectively. */
function getCOPCScanColumns(copc: COPCFile): COPCPointColumn[] {
  const columns: COPCPointColumn[] = ['POSITION'];
  if (pointFormatHasColor(copc.header.pointDataRecordFormat)) {
    columns.push('COLOR_0');
  }
  if (copc.header.pointDataRecordFormat === 8) {
    columns.push('NIR');
  }
  columns.push(
    'intensity',
    'classification',
    'synthetic',
    'keyPoint',
    'withheld',
    'overlap',
    'GPS_TIME',
    'scanAngle',
    'userData',
    'pointSourceId',
    'returnNumber',
    'numberOfReturns',
    'scannerChannel',
    'scanDirectionFlag',
    'edgeOfFlightLine'
  );
  if (copc.extraBytesDescriptors.length > 0) {
    columns.push('EXTRA_BYTES');
  }
  return columns;
}

/** Builds the canonical schema returned by the point-cloud scan API. */
function getCOPCScanSchema(copc: COPCFile): Schema {
  const scalarTypes: Partial<Record<COPCPointColumn, Field['type']>> = {
    NIR: 'uint16',
    intensity: 'uint16',
    classification: 'uint8',
    synthetic: 'uint8',
    keyPoint: 'uint8',
    withheld: 'uint8',
    overlap: 'uint8',
    GPS_TIME: 'float64',
    scanAngle: 'int16',
    userData: 'uint8',
    pointSourceId: 'uint16',
    returnNumber: 'uint8',
    numberOfReturns: 'uint8',
    scannerChannel: 'uint8',
    scanDirectionFlag: 'uint8',
    edgeOfFlightLine: 'uint8'
  };
  const extraBytes = getCOPCExtraByteCount(copc.header);
  const fields = getCOPCScanColumns(copc).map((name): Field => {
    if (name === 'POSITION') {
      return {
        name,
        type: {type: 'fixed-size-list', listSize: 3, children: [{name: 'value', type: 'float32'}]},
        nullable: false
      };
    }
    if (name === 'COLOR_0') {
      return {
        name,
        type: {type: 'fixed-size-list', listSize: 3, children: [{name: 'value', type: 'uint16'}]},
        nullable: false
      };
    }
    if (name === 'EXTRA_BYTES') {
      return {
        name,
        type: {
          type: 'fixed-size-list',
          listSize: Math.max(extraBytes, 1),
          children: [{name: 'value', type: 'uint8'}]
        },
        nullable: false
      };
    }
    return {name, type: scalarTypes[name] || 'float64', nullable: false};
  });
  return {fields, metadata: {}};
}

/** Tests whether one hierarchy node can contribute to a point-cloud scan. */
function isCOPCScanNodeSelected(
  copc: COPCFile,
  tileId: string,
  node: COPCHierarchyNode,
  options: COPCScanOptions
): boolean {
  if (node.pointCount === 0) {
    return false;
  }
  const [level] = parseCOPCKey(tileId);
  if (options.minimumLevel !== undefined && level < options.minimumLevel) {
    return false;
  }
  if (options.maximumLevel !== undefined && level > options.maximumLevel) {
    return false;
  }
  if (options.targetSpacing !== undefined) {
    const targetLevel = Math.max(
      0,
      Math.min(31, Math.ceil(Math.log2(copc.info.spacing / options.targetSpacing)))
    );
    const maximumSelectedLevel = Math.min(options.maximumLevel ?? 31, targetLevel);
    if (level < (options.minimumLevel ?? 0) || level > maximumSelectedLevel) {
      return false;
    }
  }
  if (options.bounds) {
    const nodeBounds = getCOPCKeyBounds(copc.info.cube, parseCOPCKey(tileId));
    for (let dimension = 0; dimension < 3; dimension++) {
      if (
        nodeBounds[dimension + 3] < options.bounds.minimum[dimension] ||
        nodeBounds[dimension] > options.bounds.maximum[dimension]
      ) {
        return false;
      }
    }
  }
  return true;
}

/** Orders scan nodes from coarse to fine, then by stable hierarchy key. */
function compareCOPCScanNodes(firstTileId: string, secondTileId: string): number {
  const firstLevel = parseCOPCKey(firstTileId)[0];
  const secondLevel = parseCOPCKey(secondTileId)[0];
  return firstLevel - secondLevel || firstTileId.localeCompare(secondTileId);
}

/** Builds the query schema from COPC point-data and Extra Bytes metadata. */
function getCOPCHeaderSchema(copc: COPCFile): Schema {
  const pointDataRecordFormat = copc.header.pointDataRecordFormat;
  const fields: Field[] = [
    {name: 'X', type: 'float64', nullable: false},
    {name: 'Y', type: 'float64', nullable: false},
    {name: 'Z', type: 'float64', nullable: false},
    {name: 'Intensity', type: 'uint16', nullable: false},
    {name: 'ReturnNumber', type: 'uint8', nullable: false},
    {name: 'NumberOfReturns', type: 'uint8', nullable: false},
    {name: 'ScanDirectionFlag', type: 'bool', nullable: false},
    {name: 'EdgeOfFlightLine', type: 'bool', nullable: false},
    {name: 'Classification', type: 'uint8', nullable: false},
    {name: 'Synthetic', type: 'bool', nullable: false},
    {name: 'KeyPoint', type: 'bool', nullable: false},
    {name: 'Withheld', type: 'bool', nullable: false},
    {name: 'Overlap', type: 'bool', nullable: false},
    {name: 'ScannerChannel', type: 'uint8', nullable: false},
    {name: 'ScanAngle', type: 'float32', nullable: false},
    {name: 'UserData', type: 'uint8', nullable: false},
    {name: 'PointSourceId', type: 'uint16', nullable: false},
    {name: 'GpsTime', type: 'float64', nullable: false}
  ];
  if (pointDataRecordFormat === 7 || pointDataRecordFormat === 8) {
    fields.push(
      {name: 'Red', type: 'uint16', nullable: false},
      {name: 'Green', type: 'uint16', nullable: false},
      {name: 'Blue', type: 'uint16', nullable: false}
    );
  }
  if (pointDataRecordFormat === 8) {
    fields.push({name: 'Infrared', type: 'uint16', nullable: false});
  }
  const extraByteCount = getCOPCExtraByteCount(copc.header);
  if (extraByteCount > 0 && copc.extraBytesDescriptors.length > 0) {
    const attributes = createLASTypedExtraBytesAttributes(
      0,
      copc.extraBytesDescriptors,
      extraByteCount
    );
    for (const attribute of attributes) {
      const scalarType = getTypedArraySchemaType(attribute.value);
      fields.push({
        name: attribute.name,
        type:
          attribute.size === 1
            ? scalarType
            : {
                type: 'fixed-size-list',
                listSize: attribute.size,
                children: [{name: 'value', type: scalarType}]
              },
        nullable: false
      });
    }
  }
  return {fields, metadata: {}};
}

/** Map a typed Extra Bytes array to its serializable Arrow scalar type. */
function getTypedArraySchemaType(value: LASTypedExtraBytesAttribute['value']): Field['type'] {
  if (value instanceof Uint8Array) return 'uint8';
  if (value instanceof Int8Array) return 'int8';
  if (value instanceof Uint16Array) return 'uint16';
  if (value instanceof Int16Array) return 'int16';
  if (value instanceof Uint32Array) return 'uint32';
  if (value instanceof Int32Array) return 'int32';
  if (value instanceof Float32Array) return 'float32';
  return 'float64';
}

/** Build decoder metadata from the validated COPC LASzip VLR. */
function getCOPCLAZChunkMetadata(copc: COPCFile, pointCount: number) {
  return {
    pointCount,
    pointDataRecordFormat: copc.header.pointDataRecordFormat,
    pointDataRecordLength: copc.header.pointDataRecordLength,
    point14ItemVersion: copc.laz.point14ItemVersion,
    rgb14ItemVersion: copc.laz.rgb14ItemVersion,
    byte14ItemVersion: copc.laz.byte14ItemVersion
  };
}

function createProjection(projectionData?: Proj4CRSDefinition): Proj4Projection | null {
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

function normalizeProjectionDefinition(projectionData: Proj4CRSDefinition): Proj4CRSDefinition {
  if (typeof projectionData !== 'string') {
    return projectionData;
  }
  const horizontalWktMatch =
    projectionData.match(/(PROJCS\[[\s\S]*\])(?:,VERT_CS\[[\s\S]*\])\]$/) ||
    projectionData.match(/(GEOGCS\[[\s\S]*\])(?:,VERT_CS\[[\s\S]*\])\]$/);

  return horizontalWktMatch?.[1] || projectionData;
}

/** Return whether a LAS point format contains RGB channels. */
function pointFormatHasColor(pointDataRecordFormat: number): boolean {
  return pointDataRecordFormat === 7 || pointDataRecordFormat === 8;
}

/** Resolve the shared default and explicit Arrow column selection for a COPC node. */
function getCOPCPointSelection(
  copc: COPCFile,
  columns?: readonly COPCPointColumn[]
): COPCPointSelection {
  const hasColumn = (column: COPCPointColumn): boolean => Boolean(columns?.includes(column));
  return {
    colors:
      pointFormatHasColor(copc.header.pointDataRecordFormat) &&
      (columns ? hasColumn('COLOR_0') : true),
    nir: copc.header.pointDataRecordFormat === 8 && hasColumn('NIR'),
    intensity: hasColumn('intensity'),
    classification: hasColumn('classification'),
    synthetic: hasColumn('synthetic'),
    keyPoint: hasColumn('keyPoint'),
    withheld: hasColumn('withheld'),
    overlap: hasColumn('overlap'),
    gpsTime: hasColumn('GPS_TIME'),
    scanAngle: hasColumn('scanAngle'),
    userData: hasColumn('userData'),
    pointSourceId: hasColumn('pointSourceId'),
    returnNumber: hasColumn('returnNumber'),
    numberOfReturns: hasColumn('numberOfReturns'),
    scannerChannel: hasColumn('scannerChannel'),
    scanDirectionFlag: hasColumn('scanDirectionFlag'),
    edgeOfFlightLine: hasColumn('edgeOfFlightLine'),
    extraBytes: hasColumn('EXTRA_BYTES')
  };
}

/** Return the packed Extra Bytes width in a COPC point record. */
function getCOPCExtraByteCount(header: COPCHeader): number {
  const baseRecordLength =
    header.pointDataRecordFormat === 6 ? 30 : header.pointDataRecordFormat === 7 ? 36 : 38;
  return header.pointDataRecordLength - baseRecordLength;
}

/** Read one modern LAS point in the same field order returned by `getSchema()`. */
function readCOPCPointValues(pointData: Uint8Array, header: COPCHeader): number[] {
  const dataView = new DataView(pointData.buffer, pointData.byteOffset, pointData.byteLength);
  const returnFlags = dataView.getUint8(14);
  const scanFlags = dataView.getUint8(15);
  const values = [
    dataView.getInt32(0, true) * header.scale[0] + header.offset[0],
    dataView.getInt32(4, true) * header.scale[1] + header.offset[1],
    dataView.getInt32(8, true) * header.scale[2] + header.offset[2],
    dataView.getUint16(12, true),
    returnFlags & 0x0f,
    returnFlags >> 4,
    (scanFlags >> 6) & 1,
    (scanFlags >> 7) & 1,
    dataView.getUint8(16),
    scanFlags & 1,
    (scanFlags >> 1) & 1,
    (scanFlags >> 2) & 1,
    (scanFlags >> 3) & 1,
    (scanFlags >> 4) & 3,
    dataView.getInt16(18, true) * 0.006,
    dataView.getUint8(17),
    dataView.getUint16(20, true),
    dataView.getFloat64(22, true)
  ];
  if (header.pointDataRecordFormat >= 7) {
    values.push(
      dataView.getUint16(30, true),
      dataView.getUint16(32, true),
      dataView.getUint16(34, true)
    );
  }
  if (header.pointDataRecordFormat === 8) {
    values.push(dataView.getUint16(36, true));
  }
  return values;
}

/** Create a cross-platform random-access file for URL, path, and Blob inputs. */
function createCOPCReadableFile(
  data: string | Blob,
  url: string,
  fetchFunction: (url: string, options?: RequestInit) => Promise<Response>
): ReadableFile {
  if (typeof data !== 'string') {
    return new BlobFile(data);
  }
  if (isBrowser || /^https?:\/\//i.test(url)) {
    return new HttpFile(url, {fetch: fetchFunction});
  }
  return new NodeFile(url, 'r');
}

/** Return a transferable buffer without detaching a shared range-cache allocation. */
function getStandaloneArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (
    bytes.buffer instanceof ArrayBuffer &&
    bytes.byteOffset === 0 &&
    bytes.byteLength === bytes.buffer.byteLength
  ) {
    return bytes.buffer;
  }
  return bytes.slice().buffer;
}

/** Throw an AbortError when a complete COPC node load has been cancelled. */
function throwIfCOPCLoadAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) {
    return;
  }
  throw createCOPCAbortError();
}

/** Create the consistent cancellation error used by queued node loads. */
function createCOPCAbortError(): Error {
  const error = new Error('COPC tile content load was aborted');
  error.name = 'AbortError';
  return error;
}

type AsyncSemaphoreWaiter = {
  resolve: (release: () => void) => void;
  reject: (error: Error) => void;
  signal?: AbortSignal;
  abort?: () => void;
};

/** Small FIFO semaphore that bounds fetched and decoded COPC nodes together. */
class AsyncSemaphore {
  private activeCount = 0;
  private readonly waiters: AsyncSemaphoreWaiter[] = [];

  constructor(private readonly capacity: number) {}

  /** Acquire one slot, waiting in request order when the source is saturated. */
  acquire(signal?: AbortSignal): Promise<() => void> {
    throwIfCOPCLoadAborted(signal);
    if (this.activeCount < this.capacity) {
      this.activeCount++;
      return Promise.resolve(this.createRelease());
    }

    return new Promise((resolve, reject) => {
      const waiter: AsyncSemaphoreWaiter = {resolve, reject, signal};
      if (signal) {
        waiter.abort = () => {
          const waiterIndex = this.waiters.indexOf(waiter);
          if (waiterIndex >= 0) {
            this.waiters.splice(waiterIndex, 1);
            reject(createCOPCAbortError());
          }
        };
        signal.addEventListener('abort', waiter.abort, {once: true});
      }
      this.waiters.push(waiter);
      if (signal?.aborted) {
        waiter.abort?.();
      }
    });
  }

  /** Create an idempotent release closure for one active slot. */
  private createRelease(): () => void {
    let released = false;
    return () => {
      if (!released) {
        released = true;
        this.release();
      }
    };
  }

  /** Hand the current slot to the next waiter or return it to capacity. */
  private release(): void {
    const waiter = this.waiters.shift();
    if (!waiter) {
      this.activeCount--;
      return;
    }
    if (waiter.signal && waiter.abort) {
      waiter.signal.removeEventListener('abort', waiter.abort);
    }
    waiter.resolve(this.createRelease());
  }
}

/** Cache the metadata prefix while retaining exact reads for hierarchy and node ranges. */
/**
 * Creates a range reader with prefix, completed-range, and in-flight caches.
 *
 * Exact ranges are shared by identity, which is important for repeated tile
 * requests and for hierarchy traversals that rediscover the same page.
 */
export function createCachedCOPCRangeReader(readableFile: ReadableFile): COPCRangeReader {
  const prefixPromise = Promise.resolve(readableFile.stat?.()).then(async stat => {
    const prefixLength = Math.min(stat?.size || COPC_PREFIX_CACHE_LENGTH, COPC_PREFIX_CACHE_LENGTH);
    return new Uint8Array(await readableFile.read(0, prefixLength));
  });
  const completedRanges = new Map<string, Uint8Array>();
  const inFlightRanges = new Map<string, Promise<Uint8Array>>();
  let cachedByteLength = 0;

  const cacheRange = (key: string, range: Uint8Array): void => {
    if (range.byteLength > COPC_RANGE_CACHE_MAX_BYTES) {
      return;
    }
    const previousRange = completedRanges.get(key);
    if (previousRange) {
      cachedByteLength -= previousRange.byteLength;
    }
    completedRanges.delete(key);
    completedRanges.set(key, range);
    cachedByteLength += range.byteLength;
    while (cachedByteLength > COPC_RANGE_CACHE_MAX_BYTES) {
      const oldestKey = completedRanges.keys().next().value as string | undefined;
      if (!oldestKey) {
        break;
      }
      const oldestRange = completedRanges.get(oldestKey)!;
      completedRanges.delete(oldestKey);
      cachedByteLength -= oldestRange.byteLength;
    }
  };

  return async (begin, end, signal) => {
    if (signal?.aborted) {
      throw createCOPCAbortError();
    }
    const prefix = await prefixPromise;
    if (signal?.aborted) {
      throw createCOPCAbortError();
    }
    if (begin >= 0 && end <= prefix.byteLength) {
      return prefix.subarray(begin, end);
    }
    const key = `${begin}:${end}`;
    const cachedRange = completedRanges.get(key);
    if (cachedRange) {
      completedRanges.delete(key);
      completedRanges.set(key, cachedRange);
      return cachedRange;
    }
    let rangePromise = inFlightRanges.get(key);
    if (!rangePromise) {
      rangePromise = Promise.resolve(readableFile.read(begin, end - begin, signal)).then(
        range => new Uint8Array(range)
      );
      inFlightRanges.set(key, rangePromise);
      void rangePromise.then(
        range => {
          inFlightRanges.delete(key);
          cacheRange(key, range);
        },
        () => {
          inFlightRanges.delete(key);
        }
      );
    }
    const range = await rangePromise;
    if (signal?.aborted) {
      throw createCOPCAbortError();
    }
    return range;
  };
}
