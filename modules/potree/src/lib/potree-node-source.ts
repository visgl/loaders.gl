// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PotreeSourceLoaderOptions} from '../potree-source-loader';
import type {CoreAPI, Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {DataSource, resolvePath} from '@loaders.gl/loader-utils';
import {LASLoader} from '@loaders.gl/las';
import {PotreeBoundingBox, PotreeMetadata} from '../types/potree-metadata';
import {POTreeNode} from '../parsers/parse-potree-hierarchy-chunk';
import {PotreeHierarchyChunkLoaderWithParser} from '../potree-hierarchy-chunk-loader-with-parser';
import {PotreeLoaderWithParser} from '../potree-loader-with-parser';
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
export class PotreeNodesSource extends DataSource<string, PotreeSourceLoaderOptions> {
  /** Dataset base URL */
  baseUrl: string = '';
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
  }

  /** Initial data source loading */
  async initialize() {
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    this.metadata = await this.loadWithCoreApi(`${this.baseUrl}/cloud.js`, PotreeLoaderWithParser);
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
  async loadNodeContent(nodeName: string): Promise<PotreeNodeMesh | null> {
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
        `${this.baseUrl}/${this.metadata?.octreeDir}/r/r${nodeName}.${contentExtension}`,
        loader,
        loaderOptions
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
    attributes: {
      positions: {value: ArrayBufferView; size: number; normalized?: boolean};
      colors?: {value: ArrayBufferView; size: number; normalized?: boolean};
      normals?: {value: ArrayBufferView; size: number; normalized?: boolean};
    };
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

    return {
      attributes: {
        positions,
        colors: mesh.attributes.colors,
        normals: mesh.attributes.normals
      },
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
    this.root = await this.loadWithCoreApi(
      `${this.baseUrl}/${this.metadata?.octreeDir}/r/r.hrc`,
      PotreeHierarchyChunkLoaderWithParser
    );
    this.indexNodes();
  }

  private async loadWithCoreApi<T>(
    url: string,
    loader: LoaderWithParser<T, never, LoaderOptions>,
    options?: LoaderOptions
  ): Promise<T> {
    if (this.hasCoreApi) {
      return (await this.coreApi.load(url, loader as Loader, options || this.loadOptions)) as T;
    }

    const response = await this.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load Potree resource: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!loader.parse) {
      throw new Error(`Loader ${loader.id} does not support parse()`);
    }

    return await loader.parse(arrayBuffer, options || this.loadOptions);
  }

  /**
   * Deduce base url from the input url sring
   * @param data - data source input data
   */
  private makeBaseUrl(data: string | Blob): void {
    this.baseUrl = typeof data === 'string' ? resolvePath(data) : '';
    if (this.baseUrl.endsWith('cloud.js')) {
      this.baseUrl = this.baseUrl.slice(0, -8);
    }
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.substring(0, -1);
    }
  }

  private parseBoundingVolume(): void {
    if (!this.metadata) {
      this.boundingBox = undefined;
      this.hierarchyBoundingBox = undefined;
      return;
    }

    if (this.metadata.projection) {
      const projection = new Proj4Projection({
        from: this.metadata.projection,
        to: 'WGS84'
      });

      this.hierarchyBoundingBox = this.projectBoundingBox(projection, this.metadata.boundingBox);
      this.boundingBox = this.projectBoundingBox(
        projection,
        this.metadata.tightBoundingBox || this.metadata.boundingBox
      );
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

    const nodeName = this.getNodeName(tileId);
    const bounds = {...this.hierarchyBoundingBox};

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

    this.warnIfInvalidChildBounds(tileId, bounds);
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
    const bounds = this.getNodeBounds(tileId);
    return [
      [bounds.lx, bounds.ly, bounds.lz],
      [bounds.ux, bounds.uy, bounds.uz]
    ];
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

    let maxChannelValue = 0;
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
      const valueIndex = sampleIndex * colorSize;
      maxChannelValue = Math.max(
        maxChannelValue,
        Number(colorValues[valueIndex] || 0),
        Number(colorValues[valueIndex + 1] || 0),
        Number(colorValues[valueIndex + 2] || 0)
      );
      if (maxChannelValue > 8) {
        return true;
      }
    }

    return false;
  }

  /**
   * Reproject a Potree bounding box into WGS84 longitude and latitude.
   */
  private projectBoundingBox(
    projection: Proj4Projection,
    boundingBox: PotreeBoundingBox
  ): PotreeBoundingBox {
    const lowerCoordinate = projection.project([boundingBox.lx, boundingBox.ly]);
    const upperCoordinate = projection.project([boundingBox.ux, boundingBox.uy]);

    return {
      ...boundingBox,
      lx: lowerCoordinate[0],
      ly: lowerCoordinate[1],
      ux: upperCoordinate[0],
      uy: upperCoordinate[1]
    };
  }
}
