// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DataSource, type CoreAPI} from '@loaders.gl/loader-utils';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import type {Potree2SourceOptions} from './potree2-source-loader-types';
import type {Potree2HierarchyNode, Potree2Metadata} from './potree2-types';
import {
  parsePotree2Metadata,
  parsePotree2Hierarchy,
  parsePotree2Points
} from './parsers/parse-potree2';

/** Native-coordinate header compatible with PointCloudTileset. */
export type Potree2TileHeader = {
  /** Octree name including r. */
  id: string;
  /** Zero-based level. */
  level: number;
  /** Point rows owned by this additive node. */
  pointCount: number;
  /** Root spacing halved at each level. */
  geometricError: number;
  /** Native cube and circumscribing sphere. */
  boundingVolume: {
    /** XYZ corners in source coordinates. */
    cartographicBounds: [number[], number[]];
    /** Native XYZ center. */
    center: number[];
    /** Native sphere radius. */
    radius: number;
    /** Coordinates require application placement, not WGS84 inference. */
    coordinateFrame: 'cartesian';
  };
};

/** Range-backed, lazy Potree 2.0 octree with native-coordinate Arrow point content. */
export class Potree2Source extends DataSource<string, Potree2SourceOptions> {
  /** Shared metadata and initial hierarchy loading. */
  readonly ready: Promise<void>;
  /** Whether the initial hierarchy is ready. */
  isReady = false;
  /** Source lifetime cancellation. */
  private readonly controller = new AbortController();
  /** Combined external and lifetime signal. */
  private readonly signal: AbortSignal;
  /** Checked resource ceilings. */
  private readonly limits: Required<Omit<NonNullable<Potree2SourceOptions['potree2']>, 'signal'>>;
  /** Final metadata response URL, including redirect credentials. */
  private rootUrl: string;
  /** Validated dataset declaration. */
  private metadata: Potree2Metadata | null = null;
  /** Source-owned hierarchy entries. */
  private readonly nodes = new Map<string, Potree2HierarchyNode>();
  /** Shared proxy hydration operations. */
  private readonly pending = new Map<string, Promise<void>>();
  /** Aggregate consumed hierarchy page bytes. */
  private hierarchyBytes = 0;

  /** Starts opening one range-readable dataset; call close() when done. */
  constructor(input: string, options: Potree2SourceOptions = {}, coreApi?: CoreAPI) {
    super(input, options, {potree2: {}}, coreApi);
    const url = new URL(input);
    if (!url.pathname.endsWith('.json'))
      url.pathname = `${url.pathname.replace(/\/$/, '')}/metadata.json`;
    this.rootUrl = url.href;
    this.limits = {
      maxMetadataBytes: options.potree2?.maxMetadataBytes ?? 1024 * 1024,
      maxHierarchyBytes: options.potree2?.maxHierarchyBytes ?? 16 * 1024 * 1024,
      maxPointBytes: options.potree2?.maxPointBytes ?? 64 * 1024 * 1024,
      maxNodes: options.potree2?.maxNodes ?? 100000
    };
    for (const value of Object.values(this.limits))
      if (!Number.isSafeInteger(value) || value < 1)
        throw new Error('Invalid Potree 2.0 source limit');
    this.signal = options.potree2?.signal
      ? AbortSignal.any([this.controller.signal, options.potree2.signal])
      : this.controller.signal;
    this.ready = this.openDataset().catch(error => {
      this.close();
      throw error;
    });
    this.ready.catch(() => {});
  }

  /** Waits for metadata and the initial page and rejects after closure. */
  async initialize(): Promise<void> {
    await this.ready;
    this.signal.throwIfAborted();
  }

  /** Returns an independent copy of the dataset declaration. */
  async getMetadata(): Promise<Potree2Metadata> {
    await this.initialize();
    return structuredClone(this.metadata!);
  }

  /** Returns the root, resolving a proxy if needed. */
  async getRootTile(): Promise<Potree2TileHeader> {
    await this.initialize();
    await this.hydrateNode('r');
    return this.createHeader(this.getNode('r'));
  }

  /** Loads only the requested hierarchy proxy and returns its immediate children. */
  async getChildren(tile: Potree2TileHeader): Promise<Potree2TileHeader[]> {
    await this.initialize();
    await this.hydrateNode(tile.id);
    const node = this.getNode(tile.id);
    const children: Potree2TileHeader[] = [];
    for (let octant = 0; octant < 8; octant++)
      if (node.childMask & (1 << octant)) {
        const id = `${node.id}${octant}`;
        await this.hydrateNode(id);
        children.push(this.createHeader(this.getNode(id)));
      }
    return children;
  }

  /** Reads one point range and decodes native coordinates without projection. */
  async loadTileContent(tile: Potree2TileHeader) {
    await this.initialize();
    await this.hydrateNode(tile.id);
    const node = this.getNode(tile.id);
    if (!node.pointCount) {
      if (node.byteSize) throw new Error('Empty Potree node declares point bytes');
      return null;
    }
    const bytes = await this.readRange(
      'octree.bin',
      node.byteOffset,
      node.byteSize,
      this.limits.maxPointBytes
    );
    this.signal.throwIfAborted();
    const mesh = await parsePotree2Points(
      bytes,
      this.metadata!,
      node.pointCount,
      this.limits.maxPointBytes
    );
    this.signal.throwIfAborted();
    const header = this.createHeader(node);
    mesh.header!.boundingBox = header.boundingVolume.cartographicBounds;
    return {
      data: convertMeshToTable(mesh, 'arrow-table'),
      pointCount: node.pointCount,
      coordinateSystem: 'cartesian' as const,
      cartographicOrigin: [0, 0, 0],
      spatialBoundingVolume: header.boundingVolume
    };
  }

  /** Cancels I/O and releases hierarchy state. Idempotent. */
  close(): void {
    this.controller.abort(new Error('Potree 2.0 source closed'));
    this.nodes.clear();
    this.pending.clear();
    this.metadata = null;
    this.isReady = false;
  }

  /** Opens metadata against the final URL and validates its first hierarchy page. */
  private async openDataset(): Promise<void> {
    this.signal.throwIfAborted();
    const response = await this.fetch(this.rootUrl, {signal: this.signal});
    if (!response.ok) throw new Error(`Potree metadata request failed: ${response.status}`);
    const bytes = await this.readResponse(response, this.limits.maxMetadataBytes);
    this.signal.throwIfAborted();
    this.rootUrl = response.url || this.rootUrl;
    this.metadata = parsePotree2Metadata(new TextDecoder().decode(bytes));
    await this.readHierarchy('r', 0n, BigInt(this.metadata.hierarchy.firstChunkSize));
    this.signal.throwIfAborted();
    this.isReady = true;
  }

  /** Retrieves a discovered node without trusting caller-provided point counts or byte ranges. */
  private getNode(id: string): Potree2HierarchyNode {
    this.signal.throwIfAborted();
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Unknown Potree 2.0 node ${id}`);
    return node;
  }

  /** Shares proxy loading and rejects self-referential hierarchy pages. */
  private async hydrateNode(id: string): Promise<void> {
    const node = this.getNode(id);
    if (node.type !== 2) return;
    let promise = this.pending.get(id);
    if (!promise) {
      promise = this.readHierarchy(id, node.byteOffset, node.byteSize)
        .then(() => {
          if (this.getNode(id).type === 2) throw new Error('Cyclic Potree 2.0 hierarchy proxy');
        })
        .catch(error => {
          this.close();
          throw error;
        });
      this.pending.set(id, promise);
    }
    await promise;
  }

  /** Reserves aggregate hierarchy bytes and validates a page before adding any entries. */
  private async readHierarchy(id: string, offset: bigint, size: bigint): Promise<void> {
    const remaining = this.limits.maxHierarchyBytes - this.hierarchyBytes;
    if (size > BigInt(remaining)) throw new Error('Potree hierarchy byte budget exceeded');
    this.hierarchyBytes += Number(size);
    const bytes = await this.readRange('hierarchy.bin', offset, size, remaining);
    this.signal.throwIfAborted();
    const entries = parsePotree2Hierarchy(bytes, id, this.limits.maxNodes);
    const newEntries = entries.filter(entry => !this.nodes.has(entry.id));
    if (newEntries.length + this.nodes.size > this.limits.maxNodes)
      throw new Error('Potree hierarchy node budget exceeded');
    for (const entry of entries) {
      if (entry.id !== id && this.nodes.has(entry.id))
        throw new Error('Duplicate Potree hierarchy node');
      if (
        entry.pointCount > this.metadata!.points ||
        entry.id.length - 1 > this.metadata!.hierarchy.depth
      )
        throw new Error('Potree hierarchy exceeds declared count or depth');
    }
    for (const entry of entries) this.nodes.set(entry.id, entry);
  }

  /** Resolves same-dataset filenames, retaining root query credentials. */
  private resolveResource(name: string): string {
    const root = new URL(this.rootUrl);
    const url = new URL(name, root);
    url.search = root.search;
    return url.href;
  }

  /** Reads a validated 64-bit range; servers must honor Range with an exact Content-Range. */
  private async readRange(
    name: string,
    offset: bigint,
    size: bigint,
    limit: number
  ): Promise<ArrayBuffer> {
    if (
      offset < 0n ||
      size <= 0n ||
      size > BigInt(limit) ||
      offset + size > BigInt(Number.MAX_SAFE_INTEGER)
    )
      throw new Error('Invalid or oversized Potree byte range');
    const end = offset + size - 1n;
    const response = await this.fetch(this.resolveResource(name), {
      signal: this.signal,
      headers: {Range: `bytes=${offset}-${end}`}
    });
    this.signal.throwIfAborted();
    const contentRange = response.headers.get('content-range');
    const total = contentRange?.split('/')[1];
    if (
      response.status !== 206 ||
      !contentRange ||
      (total !== '*' && (!total || !/^[0-9]+$/.test(total) || BigInt(total) <= end)) ||
      !new RegExp(`^bytes ${offset}-${end}/(?:[0-9]+|\\*)$`).test(contentRange)
    ) {
      await response.body?.cancel();
      throw new Error('Potree server must honor the requested byte range');
    }
    const data = await this.readResponse(response, Number(size));
    if (data.byteLength !== Number(size)) throw new Error('Truncated Potree byte range');
    return data;
  }

  /** Collects an incrementally bounded response and cancels on overflow or cancellation. */
  private async readResponse(response: Response, limit: number): Promise<ArrayBuffer> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Potree response requires a readable stream');
    /** Cancels injected streams that do not observe the request signal. */
    const cancelRead = () => {
      void reader.cancel(this.signal.reason).catch(() => {});
    };
    this.signal.addEventListener('abort', cancelRead, {once: true});
    const parts: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        this.signal.throwIfAborted();
        const {done, value} = await reader.read();
        this.signal.throwIfAborted();
        if (done) break;
        if (value.byteLength > limit - length)
          throw new Error('Potree response byte budget exceeded');
        parts.push(value);
        length += value.byteLength;
      }
    } catch (error) {
      await reader.cancel(error);
      throw error;
    } finally {
      this.signal.removeEventListener('abort', cancelRead);
      reader.releaseLock();
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.byteLength;
    }
    return bytes.buffer;
  }

  /** Computes native bounds directly from the checked octree address. */
  private createHeader(node: Potree2HierarchyNode): Potree2TileHeader {
    const bounds = [[...this.metadata!.boundingBox.min], [...this.metadata!.boundingBox.max]];
    for (const digit of node.id.slice(1))
      for (let axis = 0; axis < 3; axis++) {
        const midpoint = bounds[0][axis] + (bounds[1][axis] - bounds[0][axis]) / 2;
        bounds[Number(digit) & (4 >> axis) ? 0 : 1][axis] = midpoint;
      }
    const center = bounds[0].map((value, axis) => value + (bounds[1][axis] - value) / 2);
    return {
      id: node.id,
      level: node.id.length - 1,
      pointCount: node.pointCount,
      geometricError:
        node.childMask || node.type === 2 ? this.metadata!.spacing / 2 ** (node.id.length - 1) : 0,
      boundingVolume: {
        cartographicBounds: bounds as [number[], number[]],
        center,
        radius: Math.hypot(...center.map((value, axis) => bounds[1][axis] - value)),
        coordinateFrame: 'cartesian'
      }
    };
  }
}
