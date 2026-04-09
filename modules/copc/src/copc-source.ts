// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, Field, DataType} from '@loaders.gl/schema';
import type {
  Source,
  DataSourceOptions,
  TileSource,
  GetTileParameters,
  GetTileDataParameters,
  TileRangeRequestSchedulerProps
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';

import {Copc, Hierarchy, Dimension, Getter} from 'copc';
import {createRangeRequestGetter} from './lib/range-request-getter';

const VERSION = '1.0.0';

type COPCMetadata = Record<string, unknown>;

type GetNodeParameters = {
  nodeIndex: {
    x: number;
    y: number;
    z: number;
    d: number;
  };
  columns?: string[];
  offset?: number;
  limit?: number;
};

/** Options for COPC point-cloud sources. */
export type COPCSourceOptions = DataSourceOptions & {
  /** COPC-specific options reserved for future point-cloud decode controls. */
  copc?: {};
  tileRangeRequest?: TileRangeRequestSchedulerProps & {
    /** Reserved concurrency hint for range-request transports. */
    maxConcurrentRequests?: number;
  };
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
    copc: {},
    tileRangeRequest: {
      batchDelayMs: 50,
      maxGapBytes: 65536,
      rangeExpansionBytes: 65536,
      maxMergedBytes: 8388608,
      maxConcurrentRequests: 6
    }
  },

  testURL: (url: string) => url.endsWith('.laz') || url.endsWith('.copc.laz'),
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
  /** Best-effort MIME type of the source. */
  mimeType: string | null = null;
  /** Promise that resolves to COPC metadata. */
  metadata: Promise<COPCMetadata>;

  /** Promise that resolves once the COPC header and root hierarchy are opened. */
  protected _initPromise: Promise<{
    copc: Copc;
    hierarchy: Hierarchy.Subtree;
    rootNode: Hierarchy.Node;
  }>;
  /** COPC getter used by the `copc` package. */
  protected _urlOrGetter: string | Getter;
  private pendingNodeRequests: PendingNodeRequest[] = [];
  private nodeBatchTimer: ReturnType<typeof setTimeout> | null = null;

  /** Creates a COPC tile source from a URL or Blob. */
  constructor(data: string | Blob, options: COPCSourceOptions = {}) {
    super(data, options, COPCSource.defaultOptions);
    this._urlOrGetter =
      typeof data === 'string'
        ? createRangeRequestGetter(this.url, {
            ...options.tileRangeRequest,
            batchDelayMs: 0,
            fetch: this.fetch
          })
        : createRangeRequestGetter(data);
    this._initPromise = this._initCopc(this.url);
    this.metadata = this.getMetadata();
  }

  /** Returns a schema derived from point dimensions in the root node. */
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

  /** Returns format-specific metadata from the opened COPC file. */
  async getMetadata(): Promise<COPCMetadata> {
    const {copc} = await this._initPromise;
    const metadata: COPCMetadata = {
      formatSpecificMetadata: copc
    };
    return metadata;
  }

  /** Maps a z/x/y tile request to the current COPC node API. */
  async getTile(tileParams: GetTileParameters): Promise<number[] | null> {
    const nodeIndex = {x: tileParams.x, y: tileParams.y, z: tileParams.z, d: 0};
    return this.getPoints({nodeIndex});
  }

  /** Schedules multiple tile requests without awaiting them sequentially. */
  getTileBatch(tileParams: readonly GetTileParameters[]): readonly Promise<number[] | null>[] {
    return tileParams.map(tileParam => this.getTile(tileParam));
  }

  /** deck.gl-compatible tile-data wrapper. */
  async getTileData(parameters: GetTileDataParameters): Promise<unknown | null> {
    const {x, y, z} = parameters.index;
    return await this.getTile({x, y, z});
  }

  /** Schedules multiple tile-data requests without awaiting them sequentially. */
  getTileDataBatch(
    parameters: readonly GetTileDataParameters[]
  ): readonly Promise<unknown | null>[] {
    return parameters.map(parameter => this.getTileData(parameter));
  }

  /** Returns the first point sampled from a COPC hierarchy node. */
  async getPoints(parameters: GetNodeParameters) {
    if (this.url) {
      return await this.getPointsBatched(parameters);
    }
    return await this.getPointsNow(parameters);
  }

  /** Loads a point sample immediately, without the tile-level batch delay. */
  private async getPointsNow(parameters: GetNodeParameters): Promise<number[] | null> {
    const {copc} = await this._initPromise;
    const node = await this.getNode(parameters);
    const view = node && (await Copc.loadPointDataView(this._urlOrGetter, copc, node));
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

    /** Returns all loaded dimension values for one point. */
    function getXyzi(index: number): number[] {
      return columnGetters.map(get => get(index));
    }
    const point = getXyzi(0);
    // console.log('Point:', point);
    return point;
  }

  /** Looks up a hierarchy node by COPC node index. */
  async getNode(parameters: GetNodeParameters): Promise<Hierarchy.Node | undefined> {
    const {hierarchy} = await this._initPromise;
    const {x, y, z, d} = parameters.nodeIndex;
    const key = `${x}-${y}-${z}-${d}`;
    const {[key]: node} = hierarchy.nodes;
    return node;
  }

  /** Opens the COPC file and root hierarchy page. */
  async _initCopc(url: string) {
    const copc = await Copc.create(this._urlOrGetter);
    const hierarchy = await Copc.loadHierarchyPage(this._urlOrGetter, copc.info.rootHierarchyPage);
    const {['0-0-0-0']: rootNode} = hierarchy.nodes;
    if (!rootNode) {
      throw new Error(`Failed to load COPC hierarchy root node ${url}`);
    }
    return {copc, hierarchy, rootNode};
  }

  /** Enqueues one point-node request so nearby requests can share merged range reads. */
  private getPointsBatched(parameters: GetNodeParameters): Promise<number[] | null> {
    return new Promise((resolve, reject) => {
      this.pendingNodeRequests.push({parameters, resolve, reject});
      this.scheduleNodeBatch();
    });
  }

  /** Schedules the next point-node batch flush. */
  private scheduleNodeBatch(): void {
    if (this.nodeBatchTimer) {
      return;
    }

    const batchDelayMs = this.options.tileRangeRequest?.batchDelayMs ?? 50;
    this.nodeBatchTimer = setTimeout(() => this.flushNodeBatch(), batchDelayMs);
  }

  /** Starts all point-node requests queued during the tile-level batch delay. */
  private flushNodeBatch(): void {
    if (this.nodeBatchTimer) {
      clearTimeout(this.nodeBatchTimer);
      this.nodeBatchTimer = null;
    }

    const pendingNodeRequests = this.pendingNodeRequests;
    this.pendingNodeRequests = [];
    for (const request of pendingNodeRequests) {
      this.getPointsNow(request.parameters).then(request.resolve, request.reject);
    }
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

type PendingNodeRequest = {
  parameters: GetNodeParameters;
  resolve: (point: number[] | null) => void;
  reject: (error: unknown) => void;
};

/** Converts a COPC dimension descriptor into a loaders.gl schema data type. */
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
