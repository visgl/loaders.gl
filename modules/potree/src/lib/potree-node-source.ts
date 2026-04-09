// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PotreeSourceOptions} from '../potree-source';
import {load} from '@loaders.gl/core';
import {Mesh} from '@loaders.gl/schema';
import {DataSource, resolvePath} from '@loaders.gl/loader-utils';
import {LASLoader} from '@loaders.gl/las';
import {PotreeBoundingBox, PotreeMetadata} from '../types/potree-metadata';
import {POTreeNode} from '../parsers/parse-potree-hierarchy-chunk';
import {PotreeHierarchyChunkLoader} from '../potree-hierarchy-chunk-loader';
import {PotreeLoader} from '../potree-loader';
import {parseVersion} from '../utils/parse-version';
import {Proj4Projection} from '@math.gl/proj4';
import {LASMesh} from '@loaders.gl/las/src/lib/las-types';
import {createProjection} from '../utils/projection-utils';
import {getCartographicOriginFromBoundingBox} from '../utils/bounding-box-utils';
import {
  createPotree2Root,
  isPotree2Metadata,
  parsePotree2HierarchyChunk,
  parsePotree2NodeContent,
  type Potree2Metadata,
  type Potree2Node
} from './potree2-loader';
import {PotreeRangeReader} from './range-request-client';

const POTREE_SOURCE_DEFAULT_OPTIONS = {
  potree: {},
  tileRangeRequest: {
    batchDelayMs: 50,
    maxGapBytes: 65536,
    rangeExpansionBytes: 65536,
    maxMergedBytes: 8388608,
    maxConcurrentRequests: 6
  }
};

// https://github.com/visgl/deck.gl/blob/9548f43cba2234a1f4877b6b17f6c88eb35b2e08/modules/core/src/lib/constants.js#L27
// Describes the format of positions
/** deck.gl coordinate-system constants used in returned Potree meshes. */
export enum COORDINATE_SYSTEM {
  /**
   * `LNGLAT` if rendering into a geospatial viewport, `CARTESIAN` otherwise
   */
  DEFAULT = -1,
  /**
   * Positions are interpreted as [lng, lat, elevation]
   * lng lat are degrees, elevation is meters. distances as meters.
   */
  LNGLAT = 1,
  /**
   * Positions are interpreted as meter offsets, distances as meters
   */
  METER_OFFSETS = 2,
  /**
   * Positions are interpreted as lng lat offsets: [deltaLng, deltaLat, elevation]
   * deltaLng, deltaLat are delta degrees, elevation is meters.
   * distances as meters.
   */
  LNGLAT_OFFSETS = 3,
  /**
   * Non-geospatial
   */
  CARTESIAN = 0
}

/** Mesh type returned by legacy Potree LAS/LAZ node loading. */
export interface PotreeNodeMesh extends LASMesh {
  /** Origin used when positions are returned as offsets. */
  cartographicOrigin: number[];
  /** deck.gl coordinate system identifier. */
  coordinateSystem: number;
}

/**
 * A Potree data source
 * @version 1.0 - @see https://github.com/potree/potree/blob/1.0RC/docs/file_format.md
 * @version 1.7 - @see https://github.com/potree/potree/blob/1.7/docs/potree-file-format.md
 * @note Point cloud nodes tile source
 */
export class PotreeNodesSource extends DataSource<string, PotreeSourceOptions> {
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

  private initPromise: Promise<void> | null = null;
  /** Metadata parsed from `metadata.json` for PotreeConverter 2.x datasets. */
  private potree2Metadata: Potree2Metadata | null = null;
  /** Root node of the PotreeConverter 2.x hierarchy tree. */
  private potree2Root: Potree2Node | null = null;
  /** PotreeConverter 2.x hierarchy nodes that have been loaded so far. */
  private potree2Nodes = new Map<string, Potree2Node>();
  /** Range reader for `hierarchy.bin` and `octree.bin`. */
  private rangeReader: PotreeRangeReader | null = null;
  /** Node content requests waiting for the tile-level batch delay. */
  private pendingNodeContentRequests: PendingNodeContentRequest[] = [];
  /** Timer for the tile-level node-content batch. */
  private nodeContentBatchTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * @constructor
   * @param data  - if string - data set path url or path to `cloud.js` metadata file
   *              - if Blob - single file data
   * @param options - data source properties
   */
  constructor(data: string, options: PotreeSourceOptions) {
    super(data, options, POTREE_SOURCE_DEFAULT_OPTIONS);
    this.makeBaseUrl(this.data);

    this.initPromise = this.init();
  }

  /** Initial data source loading */
  async init() {
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    const loadedPotree2 = await this.tryInitPotree2();
    if (!loadedPotree2) {
      await this.initPotree1();
    }

    this.isReady = true;
  }

  /** Is data set supported */
  isSupported(): boolean {
    if (this.potree2Metadata) {
      return this.isReady;
    }

    const {minor, major} = parseVersion(this.metadata?.version ?? '');
    return (
      this.isReady &&
      major === 1 &&
      minor <= 8 &&
      typeof this.metadata?.pointAttributes === 'string' &&
      ['LAS', 'LAZ'].includes(this.metadata?.pointAttributes)
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
  async loadNodeContent(nodeName: string): Promise<Mesh | null> {
    await this.initPromise;

    if (this.potree2Metadata) {
      return await this.loadPotree2NodeContentBatched(getPotree2NodeName(nodeName));
    }

    if (!this.isSupported()) {
      return null;
    }

    const isAvailable = await this.isNodeAvailable(nodeName);
    if (isAvailable) {
      const result: PotreeNodeMesh = (await load(
        `${this.baseUrl}/${this.metadata?.octreeDir}/r/r${nodeName}.${this.getContentExtension()}`,
        LASLoader,
        this.loadOptions
      )) as PotreeNodeMesh;

      if (result) {
        result.cartographicOrigin = getCartographicOriginFromBoundingBox(
          this.projection,
          result.header?.boundingBox
        );
        const position = result.attributes.POSITION.value as Float32Array;
        for (let i = 0; i < (result.header?.vertexCount ?? 0); i++) {
          let vertex: Float32Array | number[] = position.slice(i * 3, i * 3 + 2);
          if (this.projection) {
            vertex = this.projection.project(Array.from(vertex));
          }

          const offsets = [
            vertex[0] - result.cartographicOrigin[0],
            vertex[1] - result.cartographicOrigin[1],
            position[i * 3 + 2] - result.cartographicOrigin[2]
          ];
          position.set(offsets, i * 3);
        }
        result.attributes.positions = result.attributes.POSITION;
        result.attributes.colors = result.attributes.COLOR_0;
        result.attributes.normals = result.attributes.NORMAL;

        result.coordinateSystem = COORDINATE_SYSTEM.LNGLAT_OFFSETS;
        return result;
      }
    }
    return null;
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
    this.root = await load(
      `${this.baseUrl}/${this.metadata?.octreeDir}/r/r.hrc`,
      PotreeHierarchyChunkLoader,
      this.loadOptions
    );
  }

  /** Loads legacy Potree 1.x metadata and hierarchy. */
  private async initPotree1(): Promise<void> {
    this.metadata = await load(`${this.baseUrl}/cloud.js`, PotreeLoader, this.loadOptions);
    this.projection = createProjection(this.metadata?.projection);
    this.parseBoundingVolume();

    await this.loadHierarchy();
  }

  /** Attempts to load PotreeConverter 2.x metadata and the first hierarchy chunk. */
  private async tryInitPotree2(): Promise<boolean> {
    const metadataUrl = `${this.baseUrl}/metadata.json`;

    try {
      const response = await this.fetch(metadataUrl);
      if (!response.ok) {
        return false;
      }

      const metadata = await response.json();
      if (!isPotree2Metadata(metadata)) {
        return false;
      }

      this.potree2Metadata = metadata;
      this.projection = createProjection(metadata.projection);
      this.boundingBox = getPotree2BoundingBox(metadata);
      this.rangeReader = new PotreeRangeReader(this.baseUrl, {
        ...this.options.tileRangeRequest,
        batchDelayMs: 0,
        fetch: this.fetch
      });
      this.potree2Root = createPotree2Root(metadata);
      this.potree2Nodes.set(this.potree2Root.name, this.potree2Root);

      await this.loadPotree2HierarchyChunk(this.potree2Root);
      return true;
    } catch {
      return false;
    }
  }

  /** Resolves a Potree 2 node name, loading proxy hierarchy chunks on demand. */
  private async getPotree2Node(nodeName: string): Promise<Potree2Node | null> {
    if (!this.potree2Root) {
      return null;
    }

    let currentNode: Potree2Node = this.potree2Root;
    if (currentNode.nodeType === 2) {
      await this.loadPotree2HierarchyChunk(currentNode);
    }

    for (const childIndexCharacter of nodeName.slice(1)) {
      if (currentNode.nodeType === 2) {
        await this.loadPotree2HierarchyChunk(currentNode);
      }

      const childIndex = Number(childIndexCharacter);
      currentNode = currentNode.children[childIndex]!;
      if (!currentNode) {
        return null;
      }
    }

    if (currentNode.nodeType === 2) {
      await this.loadPotree2HierarchyChunk(currentNode);
    }

    return currentNode;
  }

  /** Enqueues one Potree 2 point-node load so sibling requests can be range-batched. */
  private async loadPotree2NodeContentBatched(nodeName: string): Promise<Mesh | null> {
    const promise = new Promise<Mesh | null>((resolve, reject) => {
      this.pendingNodeContentRequests.push({nodeName, resolve, reject});
    });

    this.scheduleNodeContentBatch();
    return await promise;
  }

  /** Schedules the next node-content batch flush. */
  private scheduleNodeContentBatch(): void {
    if (this.nodeContentBatchTimer) {
      return;
    }

    const batchDelayMs = this.options.tileRangeRequest?.batchDelayMs ?? 50;
    this.nodeContentBatchTimer = setTimeout(() => this.flushNodeContentBatch(), batchDelayMs);
  }

  /** Starts all point-node loads that were queued during the batch delay. */
  private flushNodeContentBatch(): void {
    if (this.nodeContentBatchTimer) {
      clearTimeout(this.nodeContentBatchTimer);
      this.nodeContentBatchTimer = null;
    }

    const requests = this.pendingNodeContentRequests;
    this.pendingNodeContentRequests = [];

    for (const request of requests) {
      this.loadPotree2NodeContentNow(request.nodeName).then(request.resolve, request.reject);
    }
  }

  /** Loads and decodes one Potree 2 point node without the tile-level batch delay. */
  private async loadPotree2NodeContentNow(nodeName: string): Promise<Mesh | null> {
    if (!this.potree2Metadata || !this.rangeReader) {
      return null;
    }

    const node = await this.getPotree2Node(nodeName);
    if (!node || node.byteSize <= 0) {
      return null;
    }

    const arrayBuffer = await this.rangeReader.readFileRange(
      'octree.bin',
      node.byteOffset,
      node.byteSize
    );

    return await parsePotree2NodeContent(arrayBuffer, node, this.potree2Metadata, this.projection);
  }

  /** Loads one Potree 2 hierarchy chunk and attaches it to the local node tree. */
  private async loadPotree2HierarchyChunk(node: Potree2Node): Promise<void> {
    if (!this.rangeReader || node.hierarchyByteSize <= 0) {
      return;
    }

    const arrayBuffer = await this.rangeReader.readFileRange(
      'hierarchy.bin',
      node.hierarchyByteOffset,
      node.hierarchyByteSize
    );
    parsePotree2HierarchyChunk(node, arrayBuffer, this.potree2Nodes);
  }

  /**
   * Deduce base url from the input url sring
   * @param data - data source input data
   */
  private makeBaseUrl(data: string | Blob): void {
    this.baseUrl = typeof data === 'string' ? resolvePath(data) : '';
    if (this.baseUrl.endsWith('/cloud.js')) {
      this.baseUrl = this.baseUrl.slice(0, -'/cloud.js'.length);
    }
    if (this.baseUrl.endsWith('/metadata.json')) {
      this.baseUrl = this.baseUrl.slice(0, -'/metadata.json'.length);
    }
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.substring(0, -1);
    }
  }

  private parseBoundingVolume(): void {
    if (this.metadata?.projection && this.metadata.tightBoundingBox) {
      const projection = new Proj4Projection({
        from: this.metadata.projection,
        to: 'WGS84'
      });

      const {lx, ly, ux, uy} = this.metadata.tightBoundingBox;
      const lCoord = [lx, ly];
      const wgs84LCood = projection.project(lCoord);

      const uCoord = [ux, uy];
      const wgs84UCood = projection.project(uCoord);

      this.boundingBox = {
        ...this.metadata.tightBoundingBox,
        lx: wgs84LCood[0],
        ly: wgs84LCood[1],
        ux: wgs84UCood[0],
        uy: wgs84UCood[1]
      };
    } else {
      this.boundingBox = this.metadata?.tightBoundingBox;
    }
  }
}

type PendingNodeContentRequest = {
  nodeName: string;
  resolve: (mesh: Mesh | null) => void;
  reject: (error: unknown) => void;
};

/** Normalizes caller node names to the Potree 2 hierarchy name convention. */
function getPotree2NodeName(nodeName: string): string {
  return nodeName.startsWith('r') ? nodeName : `r${nodeName}`;
}

/** Converts Potree 2 metadata bounding boxes into the legacy Source bounding-box type. */
function getPotree2BoundingBox(metadata: Potree2Metadata): PotreeBoundingBox {
  const boundingBox = metadata.tightBoundingBox || metadata.boundingBox;
  return {
    lx: boundingBox.min[0],
    ly: boundingBox.min[1],
    lz: boundingBox.min[2],
    ux: boundingBox.max[0],
    uy: boundingBox.max[1],
    uz: boundingBox.max[2]
  };
}
