// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PotreeSourceLoaderOptions} from '../potree-source-loader';
import type {
  CoreAPI,
  Loader,
  LoaderOptions,
  LoaderWithParser,
  PointCloudScanReadOptions,
  PointCloudScanSource,
  PointCloudScanTile
} from '@loaders.gl/loader-utils';
import {
  createScanQueryMetadata,
  DataSource,
  filterColumnarRowIndices,
  getColumnarPredicateColumns,
  resolvePath,
  selectPointCloudScanTiles,
  validatePointCloudQueryOptions,
  type PointCloudQueryCapabilities
} from '@loaders.gl/loader-utils';
import {LASLoader} from '@loaders.gl/las';
import type {
  ArrowTableBatch,
  DataType,
  Field,
  Mesh,
  MeshArrowTable,
  Schema
} from '@loaders.gl/schema';
import {ArrowTableBuilder, convertMeshToTable} from '@loaders.gl/schema-utils';
import {PotreeBoundingBox, PotreeMetadata} from '../types/potree-metadata';
import {
  POTreeNode,
  buildPotreeHierarchyFromMetadata
} from '../parsers/parse-potree-hierarchy-chunk';
import {PotreeHierarchyChunkLoaderWithParser} from '../potree-hierarchy-chunk-loader-with-parser';
import {PotreeBinLoaderWithParser} from '../potree-bin-loader-with-parser';
import {parseVersion} from '../utils/parse-version';
import {Proj4Projection} from '@math.gl/proj4';
import {LASMesh} from '@loaders.gl/las/src/lib/las-types';
import {createProjection} from '../utils/projection-utils';
import {
  getCartographicOriginFromBoundingBox,
  getNativeOriginFromBoundingBox
} from '../utils/bounding-box-utils';

export const COORDINATE_SYSTEM = {
  DEFAULT: 'default',
  LNGLAT: 'lnglat',
  METER_OFFSETS: 'meter-offsets',
  LNGLAT_OFFSETS: 'lnglat-offsets',
  CARTESIAN: 'cartesian'
} as const;

/** deck.gl coordinate system string values emitted with Potree point tile content. */
export type PotreeCoordinateSystem = (typeof COORDINATE_SYSTEM)[keyof typeof COORDINATE_SYSTEM];

export interface PotreeNodeMesh extends LASMesh {
  cartographicOrigin: number[];
  coordinateSystem: PotreeCoordinateSystem;
}

/**
 * A Potree data source
 * @version 1.0 - @see https://github.com/potree/potree/blob/1.0RC/docs/file_format.md
 * @version 1.7 - @see https://github.com/potree/potree/blob/1.7/docs/potree-file-format.md
 * @note Point cloud nodes tile source
 */
export class PotreeNodesSource
  extends DataSource<string, PotreeSourceLoaderOptions>
  implements PointCloudScanSource<ArrowTableBatch>
{
  /** Common point-cloud scan capabilities exposed by Potree metadata and hierarchy nodes. */
  readonly pointCloudQueryCapabilities: PointCloudQueryCapabilities = Object.freeze({
    projection: 'residual',
    predicate: 'residual',
    limit: 'residual',
    streaming: true,
    cancellation: true,
    bounds: 'pushdown',
    levelOfDetail: 'pushdown',
    spacing: 'pushdown'
  });
  /** Dataset base URL */
  baseUrl: string = '';
  /** Metadata URL, preserving direct `cloud.js` inputs. */
  metadataUrl: string = '';
  /** Meta information from `cloud.js` */
  metadata: PotreeMetadata | null = null;
  /** Root node */
  root: POTreeNode | null = null;
  /** Is data source ready to use after initial loading */
  isReady = false;
  /** local CRS to WGS84 projection */
  projection: Proj4Projection | null = null;
  /** The data set minimum bounding box */
  boundingBox?: PotreeBoundingBox;
  /** The octree hierarchy bounding box in source coordinates */
  nativeHierarchyBoundingBox?: PotreeBoundingBox;
  /** The octree hierarchy bounding box in source or projected coordinates */
  hierarchyBoundingBox?: PotreeBoundingBox;
  /** Tile lookup by normalized tile id */
  nodeById: Map<string, POTreeNode> = new Map();
  /** Tracks tiles that already emitted a bounds warning */
  invalidBoundsWarningIds: Set<string> = new Set();

  private initPromise: Promise<void> | null = null;

  /**
   * @constructor
   * @param data  - if string - data set path url or path to `cloud.js` metadata file
   *              - if Blob - single file data
   * @param options - data source properties
   */
  constructor(data: string, options: PotreeSourceLoaderOptions, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
    this.makeBaseUrl(this.data);

    this.initPromise = this.initialize();
    this.initPromise.catch(() => {});
  }

  /** Initial data source loading */
  async initialize() {
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    const {PotreeLoaderWithParser} = await import('../potree-loader-with-parser');
    this.metadata = await this.loadWithCoreApi(this.metadataUrl, PotreeLoaderWithParser);
    this.projection = createProjection(this.metadata?.projection);
    this.parseBoundingVolume();

    await this.loadHierarchy();
    this.isReady = true;
  }

  /**
   * Backwards-compatible alias for existing callers.
   */
  async init() {
    await this.initialize();
  }

  /**
   * Return format-specific metadata for viewer/debug tooling.
   */
  async getMetadata(): Promise<{
    formatSpecificMetadata: PotreeMetadata | null;
    viewState: ReturnType<PotreeNodesSource['getViewState']>;
  }> {
    await this.initPromise;

    return {
      formatSpecificMetadata: this.metadata,
      viewState: this.getViewState()
    };
  }

  /** Discovers point attributes and hierarchy bounds without loading node content. */
  async getQueryMetadata() {
    await this.initPromise;
    const fields = getPotreeSchemaFields(this.metadata?.pointAttributes || []);
    const schema = {fields, metadata: {}};
    const bounds = this.nativeHierarchyBoundingBox || this.boundingBox;
    return createScanQueryMetadata({
      sourceType: 'potree',
      queryType: 'point-cloud',
      execution: {status: 'supported', method: 'scan'},
      schema,
      capabilities: {
        table: this.pointCloudQueryCapabilities,
        bounds: 'pushdown',
        levelOfDetail: 'pushdown'
      },
      columnRoles: Object.fromEntries(
        fields.map(field => [field.name, inferPotreeColumnRole(field.name)])
      ),
      spatial: bounds
        ? {
            bounds: {
              minimum: [bounds.lx, bounds.ly, bounds.lz],
              maximum: [bounds.ux, bounds.uy, bounds.uz]
            },
            coordinateReferenceSystems: this.metadata?.projection
              ? [this.metadata.projection]
              : undefined
          }
        : undefined,
      statistics: this.metadata?.points === undefined ? undefined : {rowCount: this.metadata.points}
    });
  }

  /**
   * Scans Potree hierarchy nodes into ordered, globally limited Arrow point batches.
   *
   * Node bounds, hierarchy levels, and target spacing avoid unrelated node reads. Attribute
   * predicates and exact point bounds are evaluated residually after each selected node decode.
   */
  async *scan(options: PointCloudScanReadOptions = {}): AsyncIterableIterator<ArrowTableBatch> {
    await this.initPromise;
    const schema: Schema = {
      fields: getPotreeSchemaFields(this.metadata?.pointAttributes || []),
      metadata: {}
    };
    const sourceColumnNames = schema.fields.map(field => field.name);
    validatePointCloudQueryOptions(sourceColumnNames, options);
    const batchSize = validatePotreeScanBatchSize(options.batchSize);
    if (options.limit === 0) return;

    const outputColumnNames = options.columns ? [...options.columns] : sourceColumnNames;
    const predicateColumnNames = options.predicate
      ? getColumnarPredicateColumns(options.predicate)
      : [];
    const requiredColumnNames = new Set([...outputColumnNames, ...predicateColumnNames]);
    const positionColumnNames = sourceColumnNames.includes('POSITION_CARTESIAN')
      ? ['POSITION_CARTESIAN']
      : ['X', 'Y', 'Z'];
    for (const positionColumnName of positionColumnNames) {
      requiredColumnNames.add(positionColumnName);
    }
    const outputSchema: Schema = {
      fields: outputColumnNames.map(
        columnName => schema.fields.find(field => field.name === columnName)!
      ),
      metadata: schema.metadata
    };
    const rootTile = this.getPotreeScanTile(await this.getRootTile());
    let remainingPointCount = options.limit ?? Number.POSITIVE_INFINITY;

    for await (const tile of selectPointCloudScanTiles(
      rootTile,
      async parent => (await this.getChildren(parent)).map(child => this.getPotreeScanTile(child)),
      options
    )) {
      throwIfPotreeScanAborted(options.signal);
      const nodeContent = await this.loadNodeContent(this.getNodeName(tile.id), {
        signal: options.signal
      });
      throwIfPotreeScanAborted(options.signal);
      if (!nodeContent) continue;
      const columns = getPotreeScanColumns(
        nodeContent,
        [...requiredColumnNames],
        options.bounds,
        Boolean(this.projection)
      );
      const rowCount = columns[positionColumnNames[0]].length;
      const matchingRowIndices = filterColumnarRowIndices(
        options.predicate,
        columns,
        rowCount
      ).slice(0, remainingPointCount);

      for (let batchOffset = 0; batchOffset < matchingRowIndices.length; batchOffset += batchSize) {
        const batchRowIndices = matchingRowIndices.slice(batchOffset, batchOffset + batchSize);
        const builder = new ArrowTableBuilder(outputSchema);
        for (const rowIndex of batchRowIndices) {
          builder.addArrayRow(outputColumnNames.map(columnName => columns[columnName][rowIndex]));
        }
        const batch = builder.finishBatch();
        if (batch) yield batch;
        remainingPointCount -= batchRowIndices.length;
        if (remainingPointCount === 0) return;
      }
    }
  }

  /** Converts one Potree hierarchy header to source-coordinate scan-planner metadata. */
  private getPotreeScanTile(tile: {
    id: string;
    level: number;
    pointCount: number;
    geometricError: number;
  }): PointCloudScanTile {
    const bounds = this.getNativeNodeBounds(tile.id);
    return {
      id: tile.id,
      level: tile.level,
      pointCount: tile.pointCount,
      geometricError: tile.geometricError,
      bounds: {
        minimum: [bounds.lx, bounds.ly, bounds.lz],
        maximum: [bounds.ux, bounds.uy, bounds.uz]
      }
    };
  }

  /** Is data set supported */
  isSupported(): boolean {
    const {minor, major} = parseVersion(this.metadata?.version ?? '');
    const pointAttributes = this.metadata?.pointAttributes;

    return (
      this.isReady &&
      major === 1 &&
      minor <= 8 &&
      ((typeof pointAttributes === 'string' && ['LAS', 'LAZ'].includes(pointAttributes)) ||
        (Array.isArray(pointAttributes) && pointAttributes.includes('POSITION_CARTESIAN')))
    );
  }

  /** Get content files extension */
  getContentExtension(): string | null {
    if (!this.isReady) {
      return null;
    }
    switch (this.metadata?.pointAttributes) {
      case 'LAS':
        return 'las';
      case 'LAZ':
        return 'laz';
      default:
        return 'bin';
    }
  }

  /**
   * Load octree node content
   * @param nodeName name of a node, string of numbers in range 0..7
   * @return node content geometry or null if the node doesn't exist
   */
  async loadNodeContent(
    nodeName: string,
    options: {signal?: AbortSignal} = {}
  ): Promise<PotreeNodeMesh | null> {
    await this.initPromise;

    if (!this.isSupported()) {
      return null;
    }

    const isAvailable = await this.isNodeAvailable(nodeName);
    if (isAvailable) {
      const contentExtension = this.getContentExtension();
      if (!contentExtension) {
        return null;
      }

      const tileId = nodeName ? `r${nodeName}` : 'r';
      const tileBoundingBox = this.getTileBoundingBox(tileId);
      const loader = this.getNodeContentLoader();
      const loaderOptions = this.getNodeContentLoaderOptions(tileBoundingBox);
      const result = (await this.loadWithCoreApi(
        this.getNodeContentUrl(nodeName, contentExtension),
        loader,
        loaderOptions,
        options.signal
      )) as PotreeNodeMesh & {
        header?: {boundingBox?: [number[], number[]]; vertexCount?: number};
        attributes: Record<string, any>;
      };

      if (result) {
        return this.normalizeNodeMesh(result);
      }
    }
    return null;
  }

  /**
   * Load normalized point cloud tile content.
   */
  async loadTileContent(tile: {id: string}): Promise<{
    data: MeshArrowTable;
    pointCount: number;
    cartographicOrigin: number[];
    coordinateSystem: PotreeCoordinateSystem;
  } | null> {
    const nodeName = this.getNodeName(tile.id);
    const mesh = await this.loadNodeContent(nodeName);
    if (!mesh) {
      return null;
    }

    const positions = mesh.attributes.positions;
    if (!positions) {
      return null;
    }
    const data = this.getPointCloudTileTable(mesh);

    return {
      data,
      pointCount: mesh.header?.vertexCount || positions.value.length / positions.size,
      cartographicOrigin: mesh.cartographicOrigin,
      coordinateSystem: mesh.coordinateSystem
    };
  }

  /**
   * Return the normalized root tile header.
   */
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
    await this.initPromise;

    if (!this.root) {
      throw new Error('Potree root hierarchy is not initialized');
    }

    return this.getTileHeader(this.root);
  }

  /**
   * Return normalized child tile headers.
   */
  async getChildren(tile: {id: string}) {
    await this.initPromise;

    const node = this.nodeById.get(tile.id);
    if (!node) {
      return [];
    }

    return node.children.map(child => this.getTileHeader(child));
  }

  /**
   * Return normalized view metadata for the tileset.
   */
  getViewState(): {
    boundingVolume?: {
      cartographicBounds: [number[], number[]];
      center: number[];
      radius: number;
    };
    cartographicCenter?: number[];
    zoom?: number;
  } {
    if (!this.boundingBox) {
      return {};
    }

    const boundingVolume = this.getBoundingVolume(this.boundingBox);
    return {
      boundingVolume,
      cartographicCenter: boundingVolume.center,
      zoom: this.estimateZoom(boundingVolume)
    };
  }

  /**
   * Check if a node exists in the octree
   * @param nodeName name of a node, string of numbers in range 0..7
   * @returns true - the node does exist, false - the nodes doesn't exist
   */
  async isNodeAvailable(nodeName: string): Promise<boolean> {
    if (this.metadata?.hierarchy) {
      return this.metadata.hierarchy.findIndex(item => item[0] === `r${nodeName}`) !== -1;
    }

    if (!this.root) {
      return false;
    }
    let currentParent = this.root;
    let name = '';
    let result = true;
    for (const char of nodeName) {
      const newName = `${name}${char}`;
      const node = currentParent.children.find(child => child.name === newName);
      if (node) {
        currentParent = node;
        name = newName;
      } else {
        result = false;
        break;
      }
    }
    return result;
  }

  /**
   * Load data source hierarchy into tree of available nodes
   */
  private async loadHierarchy(): Promise<void> {
    if (this.metadata?.hierarchy?.length) {
      this.root = buildPotreeHierarchyFromMetadata(this.metadata.hierarchy, {
        spacing: this.metadata.spacing
      });
      this.indexNodes();
      return;
    }

    this.root = await this.loadWithCoreApi(
      `${this.baseUrl}/${this.metadata?.octreeDir}/r/r.hrc`,
      PotreeHierarchyChunkLoaderWithParser
    );
    this.indexNodes();
  }

  private async loadWithCoreApi<T>(
    url: string,
    loader: LoaderWithParser<T, never, LoaderOptions>,
    options?: LoaderOptions,
    signal?: AbortSignal
  ): Promise<T> {
    throwIfPotreeScanAborted(signal);
    if (this.hasCoreApi) {
      const loaderOptions = options || this.loadOptions;
      const cancellableOptions = signal
        ? {
            ...loaderOptions,
            core: {
              ...loaderOptions.core,
              fetch: (resource: string, requestInit?: RequestInit) =>
                this.fetch(resource, {...requestInit, signal})
            }
          }
        : loaderOptions;
      return (await this.coreApi.load(url, loader as Loader, cancellableOptions)) as T;
    }

    const response = await this.fetch(url, {signal});
    if (!response.ok) {
      throw new Error(`Failed to load Potree resource: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!loader.parse) {
      throw new Error(`Loader ${loader.id} does not support parse()`);
    }

    throwIfPotreeScanAborted(signal);
    return await loader.parse(arrayBuffer, options || this.loadOptions);
  }

  /**
   * Deduce base url from the input url sring
   * @param data - data source input data
   */
  private makeBaseUrl(data: string | Blob): void {
    const resolvedUrl = typeof data === 'string' ? this.resolveInputUrl(data) : '';
    const normalizedUrl = resolvedUrl.endsWith('/') ? resolvedUrl.slice(0, -1) : resolvedUrl;
    this.baseUrl = normalizedUrl;
    this.metadataUrl = normalizedUrl;

    if (this.isMetadataUrl(normalizedUrl)) {
      this.baseUrl = this.getDirectoryUrl(normalizedUrl);
    } else {
      this.metadataUrl = `${normalizedUrl}/cloud.js`;
    }

    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.substring(0, -1);
    }
    if (this.metadataUrl.endsWith('/cloud.js')) {
      return;
    }
    if (this.metadataUrl.endsWith('/')) {
      this.metadataUrl = `${this.metadataUrl}cloud.js`;
    }
  }

  /**
   * Resolves local aliases while preserving absolute web URLs exactly.
   */
  private resolveInputUrl(url: string): string {
    const trimmedUrl = url.trim();
    if (/^https?:\/\//i.test(trimmedUrl)) {
      return trimmedUrl;
    }
    return resolvePath(trimmedUrl);
  }

  /**
   * Checks whether a source URL points directly at Potree metadata.
   */
  private isMetadataUrl(url: string): boolean {
    try {
      return new URL(url).pathname.endsWith('/cloud.js');
    } catch {
      return url.endsWith('cloud.js');
    }
  }

  /**
   * Returns the containing directory for a file URL or path.
   */
  private getDirectoryUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.search = '';
      parsedUrl.hash = '';
      parsedUrl.pathname = parsedUrl.pathname.slice(0, parsedUrl.pathname.lastIndexOf('/'));
      return parsedUrl.toString();
    } catch {
      return url.slice(0, -8);
    }
  }

  private parseBoundingVolume(): void {
    if (!this.metadata) {
      this.boundingBox = undefined;
      this.nativeHierarchyBoundingBox = undefined;
      this.hierarchyBoundingBox = undefined;
      return;
    }

    this.nativeHierarchyBoundingBox = this.metadata.boundingBox || this.metadata.tightBoundingBox;

    if (this.metadata.projection) {
      const projection = this.projection || createProjection(this.metadata.projection);

      this.hierarchyBoundingBox = projection
        ? this.projectBoundingBox(projection, this.metadata.boundingBox)
        : this.metadata.boundingBox;
      this.boundingBox = projection
        ? this.projectBoundingBox(
            projection,
            this.metadata.tightBoundingBox || this.metadata.boundingBox
          )
        : this.metadata.tightBoundingBox || this.metadata.boundingBox;
    } else {
      this.hierarchyBoundingBox = this.metadata.boundingBox || this.metadata.tightBoundingBox;
      this.boundingBox = this.metadata.tightBoundingBox || this.metadata.boundingBox;
    }
  }

  /**
   * Estimate a deck.gl map zoom from the tileset longitude span.
   */
  private estimateZoom(boundingVolume: {cartographicBounds: [number[], number[]]}): number {
    const [minBounds, maxBounds] = boundingVolume.cartographicBounds;
    const longitudeSpan = Math.max(Math.abs(maxBounds[0] - minBounds[0]), 0.000001);
    return Math.max(1, Math.round(Math.log2(360 / longitudeSpan)));
  }

  private getTileHeader(node: POTreeNode): {
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
    return {
      id: this.getTileId(node),
      level: node.level,
      pointCount: node.pointCount,
      geometricError: (this.metadata?.spacing || 0) / Math.pow(2, node.level),
      boundingVolume: this.getBoundingVolumeForNodeId(this.getTileId(node))
    };
  }

  private getTileId(node: POTreeNode): string {
    return node.name ? `r${node.name}` : 'r';
  }

  private getNodeName(tileId: string): string {
    return tileId === 'r' ? '' : tileId.slice(1);
  }

  private indexNodes(): void {
    this.nodeById.clear();
    if (!this.root) {
      return;
    }

    const stack: POTreeNode[] = [this.root];
    while (stack.length) {
      const node = stack.pop();
      if (node) {
        this.nodeById.set(this.getTileId(node), node);
        for (const child of node.children) {
          stack.push(child);
        }
      }
    }
  }

  private getBoundingVolumeForNodeId(tileId: string): {
    cartographicBounds: [number[], number[]];
    center: number[];
    radius: number;
  } {
    const bounds = this.getNodeBounds(tileId);
    return this.getBoundingVolume(bounds);
  }

  /**
   * Convert a bounding box into a normalized bounding volume.
   */
  private getBoundingVolume(bounds: PotreeBoundingBox): {
    cartographicBounds: [number[], number[]];
    center: number[];
    radius: number;
  } {
    const center = [
      (bounds.lx + bounds.ux) / 2,
      (bounds.ly + bounds.uy) / 2,
      (bounds.lz + bounds.uz) / 2
    ];
    const radius = Math.sqrt(
      Math.pow(bounds.ux - center[0], 2) +
        Math.pow(bounds.uy - center[1], 2) +
        Math.pow(bounds.uz - center[2], 2)
    );

    return {
      cartographicBounds: [
        [bounds.lx, bounds.ly, bounds.lz],
        [bounds.ux, bounds.uy, bounds.uz]
      ] as [number[], number[]],
      center,
      radius
    };
  }

  private getNodeBounds(tileId: string): PotreeBoundingBox {
    if (!this.hierarchyBoundingBox) {
      throw new Error('Potree bounding box is not initialized');
    }

    const bounds = this.getChildNodeBounds(tileId, this.hierarchyBoundingBox);
    this.warnIfInvalidChildBounds(tileId, bounds);
    return bounds;
  }

  /**
   * Derive a child node bounding box by splitting a root octree bounding box.
   */
  private getChildNodeBounds(
    tileId: string,
    rootBoundingBox: PotreeBoundingBox
  ): PotreeBoundingBox {
    const nodeName = this.getNodeName(tileId);
    const bounds = {...rootBoundingBox};

    for (const char of nodeName) {
      const index = Number(char);
      const middleX = (bounds.lx + bounds.ux) / 2;
      const middleY = (bounds.ly + bounds.uy) / 2;
      const middleZ = (bounds.lz + bounds.uz) / 2;

      if (index & 0b0100) {
        bounds.lx = middleX;
      } else {
        bounds.ux = middleX;
      }

      if (index & 0b0010) {
        bounds.ly = middleY;
      } else {
        bounds.uy = middleY;
      }

      if (index & 0b0001) {
        bounds.lz = middleZ;
      } else {
        bounds.uz = middleZ;
      }
    }

    return bounds;
  }

  /**
   * Warn once if a derived child bounding box escapes its parent or becomes degenerate.
   */
  private warnIfInvalidChildBounds(tileId: string, childBounds: PotreeBoundingBox): void {
    if (tileId === 'r' || this.invalidBoundsWarningIds.has(tileId)) {
      return;
    }

    const parentTileId = tileId.slice(0, -1);
    const parentBounds = parentTileId ? this.getNodeBounds(parentTileId) : null;
    const EPSILON = 1e-9;

    const isDegenerate =
      childBounds.lx > childBounds.ux ||
      childBounds.ly > childBounds.uy ||
      childBounds.lz > childBounds.uz;
    const exceedsParent = Boolean(
      parentBounds &&
        (childBounds.lx < parentBounds.lx - EPSILON ||
          childBounds.ly < parentBounds.ly - EPSILON ||
          childBounds.lz < parentBounds.lz - EPSILON ||
          childBounds.ux > parentBounds.ux + EPSILON ||
          childBounds.uy > parentBounds.uy + EPSILON ||
          childBounds.uz > parentBounds.uz + EPSILON)
    );

    if (!isDegenerate && !exceedsParent) {
      return;
    }

    this.invalidBoundsWarningIds.add(tileId);
    console.warn('PotreeNodesSource derived an invalid child bounding box.', {
      tileId,
      parentTileId,
      parentBounds,
      childBounds,
      isDegenerate,
      exceedsParent
    });
  }

  /**
   * Build a tile bounding box tuple for loader metadata and headers.
   */
  private getTileBoundingBox(tileId: string): [number[], number[]] {
    const bounds = this.getNativeNodeBounds(tileId);
    return [
      [bounds.lx, bounds.ly, bounds.lz],
      [bounds.ux, bounds.uy, bounds.uz]
    ];
  }

  /**
   * Builds a node content URL for old flat and newer nested Potree layouts.
   */
  private getNodeContentUrl(nodeName: string, contentExtension: string): string {
    const nodeId = nodeName ? `r${nodeName}` : 'r';

    if (this.metadata?.hierarchy?.length) {
      return `${this.baseUrl}/${this.metadata.octreeDir}/${nodeId}.${contentExtension}`;
    }

    return `${this.baseUrl}/${this.metadata?.octreeDir}/r/${nodeId}.${contentExtension}`;
  }

  /**
   * Return a tile bounding box in the source projection for binary decoding.
   */
  private getNativeNodeBounds(tileId: string): PotreeBoundingBox {
    if (!this.nativeHierarchyBoundingBox) {
      throw new Error('Potree native bounding box is not initialized');
    }

    return this.getChildNodeBounds(tileId, this.nativeHierarchyBoundingBox);
  }

  /**
   * Select the proper node-content loader for the dataset.
   */
  private getNodeContentLoader() {
    return Array.isArray(this.metadata?.pointAttributes) ? PotreeBinLoaderWithParser : LASLoader;
  }

  /**
   * Build loader options for node content decoding.
   */
  private getNodeContentLoaderOptions(
    tileBoundingBox: [number[], number[]]
  ): LoaderOptions | undefined {
    if (!this.metadata) {
      return undefined;
    }

    if (!Array.isArray(this.metadata.pointAttributes)) {
      return {
        core: {
          worker: false
        },
        las: {
          colorDepth: 'auto'
        }
      };
    }

    const [tileMinBounds] = tileBoundingBox;
    const positionOrigin: [number, number, number] = [
      tileMinBounds[0],
      tileMinBounds[1],
      tileMinBounds[2]
    ];

    return {
      potree: {
        pointAttributes: this.metadata.pointAttributes,
        scale: this.metadata.scale,
        positionOrigin,
        nodeBoundingBox: tileBoundingBox
      }
    };
  }

  /**
   * Normalize loader output into the point-cloud source shape expected by consumers.
   */
  private normalizeNodeMesh(
    result: PotreeNodeMesh & {
      header?: {boundingBox?: [number[], number[]]; vertexCount?: number};
      attributes: Record<string, any>;
    }
  ): PotreeNodeMesh {
    result.cartographicOrigin = getCartographicOriginFromBoundingBox(
      this.projection,
      result.header?.boundingBox
    );
    const position = result.attributes.POSITION?.value as Float32Array | undefined;

    if (position && this.projection) {
      const nativeOrigin = getNativeOriginFromBoundingBox(result.header?.boundingBox);
      for (let index = 0; index < position.length; index += 3) {
        position[index] -= nativeOrigin[0];
        position[index + 1] -= nativeOrigin[1];
        position[index + 2] -= nativeOrigin[2];
      }
    }

    result.attributes.positions = result.attributes.POSITION;
    result.attributes.colors = this.hasUsableColors(result.attributes.COLOR_0)
      ? result.attributes.COLOR_0
      : undefined;
    result.attributes.normals = result.attributes.NORMAL;
    result.coordinateSystem = this.projection
      ? COORDINATE_SYSTEM.METER_OFFSETS
      : COORDINATE_SYSTEM.CARTESIAN;

    return result;
  }

  /**
   * Convert normalized node content to the Mesh Arrow table tile payload.
   */
  private getPointCloudTileTable(mesh: PotreeNodeMesh): MeshArrowTable {
    const attributes: Mesh['attributes'] = {
      POSITION: mesh.attributes.positions
    };
    if (mesh.attributes.colors) {
      attributes.COLOR_0 = mesh.attributes.colors;
    }
    if (mesh.attributes.normals) {
      attributes.NORMAL = mesh.attributes.normals;
    }

    return convertMeshToTable(
      {
        topology: 'point-list',
        mode: 0,
        header: {
          vertexCount:
            mesh.header?.vertexCount ||
            mesh.attributes.positions.value.length / mesh.attributes.positions.size
        },
        schema: {
          fields: [],
          metadata: {}
        },
        attributes
      },
      'arrow-table'
    );
  }

  /**
   * Detect whether a color buffer contains usable RGB information.
   */
  private hasUsableColors(colors?: {
    value: ArrayBufferView;
    size: number;
    normalized?: boolean;
  }): boolean {
    if (!colors?.value) {
      return false;
    }

    const colorValues = colors.value as
      | Uint8Array
      | Uint8ClampedArray
      | Uint16Array
      | Uint32Array
      | Float32Array
      | Float64Array
      | Int8Array
      | Int16Array
      | Int32Array;
    const colorSize = Math.max(colors.size || 0, 3);
    const sampleCount = Math.min(Math.floor(colorValues.length / colorSize), 1024);
    if (sampleCount === 0) {
      return false;
    }

    let minChannelValue = Number.POSITIVE_INFINITY;
    let maxChannelValue = Number.NEGATIVE_INFINITY;
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
      const valueIndex = sampleIndex * colorSize;
      const red = Number(colorValues[valueIndex] || 0);
      const green = Number(colorValues[valueIndex + 1] || 0);
      const blue = Number(colorValues[valueIndex + 2] || 0);
      minChannelValue = Math.min(minChannelValue, red, green, blue);
      maxChannelValue = Math.max(maxChannelValue, red, green, blue);
      if (maxChannelValue > 8) {
        return true;
      }
    }

    return maxChannelValue - minChannelValue > 1e-6;
  }

  /**
   * Reproject a Potree bounding box into WGS84 longitude and latitude.
   */
  private projectBoundingBox(
    projection: Proj4Projection,
    boundingBox: PotreeBoundingBox
  ): PotreeBoundingBox {
    const projectedCorners = [
      projection.project([boundingBox.lx, boundingBox.ly]),
      projection.project([boundingBox.lx, boundingBox.uy]),
      projection.project([boundingBox.ux, boundingBox.ly]),
      projection.project([boundingBox.ux, boundingBox.uy])
    ];
    const longitudes = projectedCorners.map(coordinate => coordinate[0]);
    const latitudes = projectedCorners.map(coordinate => coordinate[1]);

    return {
      ...boundingBox,
      lx: Math.min(...longitudes),
      ly: Math.min(...latitudes),
      ux: Math.max(...longitudes),
      uy: Math.max(...latitudes)
    };
  }
}

/** Extracts query-visible source-coordinate columns from one decoded Potree node. */
function getPotreeScanColumns(
  mesh: PotreeNodeMesh,
  columnNames: readonly string[],
  bounds: PointCloudScanReadOptions['bounds'],
  positionsAreOffsets: boolean
): Record<string, unknown[]> {
  const columns = Object.fromEntries(columnNames.map(columnName => [columnName, [] as unknown[]]));
  const positions = mesh.attributes.POSITION?.value as Float32Array | Float64Array | undefined;
  if (!positions) return columns;
  const nativeOrigin = positionsAreOffsets
    ? getNativeOriginFromBoundingBox(mesh.header?.boundingBox)
    : [0, 0, 0];
  const pointCount = Math.floor(positions.length / 3);

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const positionIndex = pointIndex * 3;
    const sourcePosition = [
      positions[positionIndex] + nativeOrigin[0],
      positions[positionIndex + 1] + nativeOrigin[1],
      positions[positionIndex + 2] + nativeOrigin[2]
    ];
    if (bounds && !isPotreePointInsideBounds(sourcePosition, bounds)) continue;

    for (const columnName of columnNames) {
      columns[columnName].push(getPotreeScanValue(mesh, columnName, pointIndex, sourcePosition));
    }
  }
  return columns;
}

/** Reads one query-visible value from a Potree mesh attribute. */
function getPotreeScanValue(
  mesh: PotreeNodeMesh,
  columnName: string,
  pointIndex: number,
  sourcePosition: readonly number[]
): unknown {
  if (columnName === 'X') return sourcePosition[0];
  if (columnName === 'Y') return sourcePosition[1];
  if (columnName === 'Z') return sourcePosition[2];
  if (columnName === 'POSITION_CARTESIAN') return [...sourcePosition];

  const attribute = mesh.attributes[columnName];
  if (!attribute) return null;
  const size = attribute.size || 1;
  const values = attribute.value as unknown as ArrayLike<unknown>;
  if (size === 1) return values[pointIndex];
  const valueOffset = pointIndex * size;
  return Array.from({length: size}, (_, componentIndex) => values[valueOffset + componentIndex]);
}

/** Returns whether a decoded Potree point lies within inclusive source bounds. */
function isPotreePointInsideBounds(
  point: readonly number[],
  bounds: NonNullable<PointCloudScanReadOptions['bounds']>
): boolean {
  return point.every(
    (coordinate, dimension) =>
      coordinate >= bounds.minimum[dimension] && coordinate <= bounds.maximum[dimension]
  );
}

/** Validates and returns the maximum retained point count per Potree batch. */
function validatePotreeScanBatchSize(batchSize = 65536): number {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1) {
    throw new Error('Point cloud scan batchSize must be a positive safe integer.');
  }
  return batchSize;
}

/** Throws a standard cancellation error for Potree scan work. */
function throwIfPotreeScanAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError');
  }
}

/** Builds query-visible fields from Potree point-attribute metadata. */
function getPotreeSchemaFields(pointAttributes: PotreeMetadata['pointAttributes']): Field[] {
  if (!Array.isArray(pointAttributes)) {
    return [
      {name: 'X', type: 'float64', nullable: false},
      {name: 'Y', type: 'float64', nullable: false},
      {name: 'Z', type: 'float64', nullable: false}
    ];
  }
  const fields: Field[] = [];
  for (const attribute of pointAttributes) {
    const field = getPotreeField(attribute);
    if (field) fields.push(field);
  }
  return fields;
}

/** Maps one Potree attribute identifier to a loaders.gl field. */
function getPotreeField(attribute: string): Field | undefined {
  const fieldTypes: Record<string, {name: string; type: DataType}> = {
    POSITION_CARTESIAN: {
      name: 'POSITION_CARTESIAN',
      type: getPotreeListType('float32', 3)
    },
    RGBA_PACKED: {name: 'RGBA_PACKED', type: getPotreeListType('uint8', 3)},
    COLOR_PACKED: {name: 'COLOR_PACKED', type: getPotreeListType('uint8', 3)},
    RGB_PACKED: {name: 'RGB_PACKED', type: getPotreeListType('uint8', 3)},
    NORMAL_FLOATS: {name: 'NORMAL_FLOATS', type: getPotreeListType('float32', 3)},
    INTENSITY: {name: 'INTENSITY', type: 'uint16'},
    CLASSIFICATION: {name: 'CLASSIFICATION', type: 'uint8'},
    NORMAL_SPHEREMAPPED: {
      name: 'NORMAL_SPHEREMAPPED',
      type: getPotreeListType('uint8', 2)
    },
    NORMAL_OCT16: {name: 'NORMAL_OCT16', type: 'uint16'},
    NORMAL: {name: 'NORMAL', type: getPotreeListType('float32', 3)}
  };
  const fieldType = fieldTypes[attribute];
  return fieldType ? {...fieldType, nullable: false} : undefined;
}

/** Creates a portable fixed-size-list type for packed Potree attributes. */
function getPotreeListType(type: DataType, listSize: number): DataType {
  return {type: 'fixed-size-list', listSize, children: [{name: 'value', type}]};
}

/** Infers a query-panel semantic role from a Potree attribute name. */
function inferPotreeColumnRole(
  name: string
): 'attribute' | 'x' | 'y' | 'z' | 'intensity' | 'classification' | 'color' {
  const normalizedName = name.toLowerCase();
  if (normalizedName === 'x' || normalizedName.includes('position_cartesian')) return 'x';
  if (normalizedName === 'y') return 'y';
  if (normalizedName === 'z') return 'z';
  if (normalizedName.includes('intensity')) return 'intensity';
  if (normalizedName.includes('classification')) return 'classification';
  if (normalizedName.includes('color') || normalizedName.includes('rgb')) return 'color';
  return 'attribute';
}
