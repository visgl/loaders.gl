// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh, MeshArrowTable, MeshAttribute, TypedArray} from '@loaders.gl/schema';
import {convertTableToMesh} from './convert-table-to-mesh';

/** A native-coordinate cube, with minimum and maximum XYZ corners. */
export type PointCloudTileBounds = readonly [
  minimum: readonly [number, number, number],
  maximum: readonly [number, number, number]
];

/** Limits for a deterministic, additive, in-memory point octree. */
export type PointCloudTilerOptions = {
  /** Target sample size at each level; terminal nodes retain all remaining points. */
  readonly nodePointLimit?: number;
  /** Maximum subdivision depth, from zero through 24. */
  readonly maximumDepth?: number;
  /** Maximum bytes in unique retained source attribute buffers. */
  readonly maxInputBytes?: number;
  /** Maximum live bytes in typed row-index allocations, including split temporaries. */
  readonly maxIndexBytes?: number;
  /** Maximum bytes in one gathered tile's attributes. */
  readonly maxTileBytes?: number;
  /** Maximum number of discovered nodes. */
  readonly maxNodes?: number;
  /** Cooperative cancellation during indexing, splitting and gathering. */
  readonly signal?: AbortSignal;
};

/** Immutable description of one additive point tile; its rows occur in no other tile. */
export type PointCloudTilerNode = {
  /** Stable octree address: root r, then child digits with XYZ bits 4/2/1. */
  readonly id: string;
  /** Zero-based octree depth. */
  readonly level: number;
  /** Number of retained points in this node's content. */
  readonly pointCount: number;
  /** Native-coordinate cube enclosing this node and its descendants. */
  readonly bounds: PointCloudTileBounds;
  /** Conservative sample coverage bound in source units; zero for terminal nodes. */
  readonly geometricError: number;
};

/** Internal rows and deferred child partition for one node. */
type NodeState = {
  /** Public node description. */
  node: PointCloudTilerNode;
  /** Original row numbers retained in this node. */
  rows: Uint32Array;
  /** Original rows waiting for lazy child partition. */
  remaining: Uint32Array;
  /** Children once split; undefined until first discovery. */
  children?: readonly PointCloudTilerNode[];
  /** Shared split operation for concurrent discovery of the same node. */
  childrenPromise?: Promise<readonly PointCloudTilerNode[]>;
};

/**
 * Creates an additive octree from decoded point Mesh/Arrow data without copying attributes.
 * Sparse-grid samples retain the first point per cell; descendants contain only unsampled rows.
 * Children are partitioned on demand. All input rows occur exactly once across the complete tree.
 * Input must remain immutable. This is bounded in-memory authoring, not an out-of-core reader.
 */
export class PointCloudTiler {
  /** Resolves after validation, bounds calculation and root sampling. */
  readonly ready: Promise<void>;
  /** Exact number of validated source rows. */
  private sourcePointCount = 0;
  /** Number of source point rows, available after ready. */
  get pointCount(): number {
    return this.sourcePointCount;
  }
  /** Lifetime cancellation, including close(). */
  private readonly controller = new AbortController();
  /** Resolved source and allocation limits. */
  private readonly options: Required<Omit<PointCloudTilerOptions, 'signal'>>;
  /** Combined caller and lifetime cancellation. */
  private readonly signal: AbortSignal;
  /** Source typed attributes, retained without copying Mesh inputs. */
  private mesh: Mesh | null = null;
  /** Discovered octree nodes. */
  private readonly nodes = new Map<string, NodeState>();
  /** Live row-index bytes including intermediate allocations. */
  private indexBytes = 0;
  /** Packed source bytes per row. */
  private pointByteLength = 0;

  /** Starts indexing one decoded point dataset with explicit allocation limits. */
  constructor(input: Mesh | MeshArrowTable, options: PointCloudTilerOptions = {}) {
    this.options = {
      nodePointLimit: options.nodePointLimit ?? 50_000,
      maximumDepth: options.maximumDepth ?? 16,
      maxInputBytes: options.maxInputBytes ?? 512 * 1024 * 1024,
      maxIndexBytes: options.maxIndexBytes ?? 128 * 1024 * 1024,
      maxTileBytes: options.maxTileBytes ?? 64 * 1024 * 1024,
      maxNodes: options.maxNodes ?? 100_000
    };
    for (const [name, value] of Object.entries(this.options)) {
      if (!Number.isSafeInteger(value) || value < (name === 'maximumDepth' ? 0 : 1))
        throw new Error(`PointCloudTiler: invalid ${name}`);
    }
    if (this.options.maximumDepth > 24 || this.options.nodePointLimit > 1_000_000)
      throw new Error('PointCloudTiler: maximumDepth must be <= 24 and nodePointLimit <= 1000000');
    this.signal = options.signal
      ? AbortSignal.any([options.signal, this.controller.signal])
      : this.controller.signal;
    this.ready = this.initialize(input).catch(error => {
      this.close();
      throw error;
    });
  }

  /** Returns the root after indexing, without discovering its children. */
  async getRootNode(): Promise<PointCloudTilerNode> {
    await this.ready;
    return this.getNode('r').node;
  }

  /** Returns checked source-owned metadata for an already discovered node. */
  async getNodeMetadata(id: string): Promise<PointCloudTilerNode> {
    await this.ready;
    return this.getNode(id).node;
  }

  /** Partitions only the requested node, in deterministic octant order. */
  async getChildNodes(id: string): Promise<readonly PointCloudTilerNode[]> {
    await this.ready;
    const state = this.getNode(id);
    if (!state.childrenPromise) state.childrenPromise = this.splitNode(state);
    return state.childrenPromise;
  }

  /** Splits one node exactly once, sharing its result with concurrent callers. */
  private async splitNode(state: NodeState): Promise<readonly PointCloudTilerNode[]> {
    const id = state.node.id;
    if (state.children) return state.children;
    const groups = Array.from({length: 8}, () => 0);
    const midpoint = state.node.bounds[0].map(
      (value, axis) => value + (state.node.bounds[1][axis] - value) / 2
    );
    for (let index = 0; index < state.remaining.length; index++) {
      if (index % 65536 === 0) await this.checkpoint();
      groups[this.getOctant(state.remaining[index], midpoint)]++;
    }
    if (this.nodes.size + groups.filter(count => count > 0).length > this.options.maxNodes)
      throw new Error('PointCloudTiler: node budget exceeded');
    const children: PointCloudTilerNode[] = [];
    const partitions: Uint32Array[] = [];
    try {
      for (const count of groups) partitions.push(this.allocateRows(count));
      const offsets = new Uint32Array(8);
      for (let index = 0; index < state.remaining.length; index++) {
        if (index % 65536 === 0) await this.checkpoint();
        const row = state.remaining[index];
        const octant = this.getOctant(row, midpoint);
        partitions[octant][offsets[octant]++] = row;
      }
      for (let octant = 0; octant < 8; octant++) {
        if (!partitions[octant].length) continue;
        const bounds = state.node.bounds.map(corner => [...corner]) as [
          [number, number, number],
          [number, number, number]
        ];
        for (let axis = 0; axis < 3; axis++)
          bounds[octant & (4 >> axis) ? 0 : 1][axis] = midpoint[axis];
        const child = await this.createNode(`${id}${octant}`, bounds, partitions[octant]);
        partitions[octant] = new Uint32Array(0);
        children.push(child.node);
      }
      this.releaseRows(state.remaining);
      state.remaining = new Uint32Array(0);
      state.children = Object.freeze(children);
      return state.children;
    } catch (error) {
      // A partial split cannot be safely replayed. Release the entire index on failure.
      this.close();
      throw error;
    }
  }

  /** Gathers a fresh packed Mesh; source row IDs and attribute component widths are preserved. */
  async getTileMesh(id: string): Promise<Mesh> {
    await this.ready;
    const state = this.getNode(id);
    const byteLength = state.rows.length * this.pointByteLength;
    if (byteLength > this.options.maxTileBytes)
      throw new Error('PointCloudTiler: tile byte budget exceeded');
    const attributes: Mesh['attributes'] = {};
    for (const [name, attribute] of Object.entries(this.mesh!.attributes)) {
      const Constructor = attribute.value.constructor as new (length: number) => TypedArray;
      const value = new Constructor(state.rows.length * attribute.size);
      const sourceBytes = new Uint8Array(
        attribute.value.buffer,
        attribute.value.byteOffset,
        attribute.value.byteLength
      );
      const targetBytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      const bytesPerElement = attribute.value.BYTES_PER_ELEMENT;
      const rowBytes = attribute.size * bytesPerElement;
      const stride = attribute.byteStride || rowBytes;
      for (let index = 0; index < state.rows.length; index++) {
        if (index % 65536 === 0) await this.checkpoint();
        const offset = (attribute.byteOffset || 0) + state.rows[index] * stride;
        targetBytes.set(sourceBytes.subarray(offset, offset + rowBytes), index * rowBytes);
      }
      attributes[name] = {...attribute, value, byteOffset: 0, byteStride: 0};
    }
    return {
      ...this.mesh!,
      attributes,
      topology: 'point-list',
      mode: 0,
      indices: undefined,
      header: {
        vertexCount: state.rows.length,
        boundingBox: state.node.bounds.map(corner => [...corner]) as [number[], number[]]
      },
      loaderData: {...this.mesh!.loaderData, pointCloudTileId: id}
    };
  }

  /** Releases retained attributes and index state and cancels subsequent operations. */
  close(): void {
    this.controller.abort(new Error('PointCloudTiler: closed'));
    this.mesh = null;
    this.nodes.clear();
    this.indexBytes = 0;
  }

  /** Validates the decoded profile and creates a root cube from finite native coordinates. */
  private async initialize(input: Mesh | MeshArrowTable): Promise<void> {
    this.signal.throwIfAborted();
    if ('shape' in input) {
      const buffers = new Set<ArrayBufferLike>();
      let arrowBytes = 0;
      /** Counts retained Arrow buffers and rejects null child values before conversion. */
      const checkData = (data: import('apache-arrow').Data): void => {
        if (data.nullCount)
          throw new Error('PointCloudTiler: null point attributes require an explicit mapping');
        for (const view of Object.values(data.buffers)) {
          if (view && !buffers.has(view.buffer)) {
            buffers.add(view.buffer);
            arrowBytes += view.buffer.byteLength;
          }
        }
        for (const child of data.children) checkData(child);
        if (data.dictionary)
          for (const dictionaryData of data.dictionary.data) checkData(dictionaryData);
      };
      for (const batch of input.data.batches) checkData(batch.data);
      if (arrowBytes > this.options.maxInputBytes)
        throw new Error('PointCloudTiler: input byte budget exceeded');
      for (const column of input.data.schema.fields) {
        if (input.data.getChild(column.name)?.nullCount)
          throw new Error('PointCloudTiler: null point attributes require an explicit mapping');
      }
    }
    const mesh = 'shape' in input ? convertTableToMesh(input) : input;
    if (mesh.topology !== 'point-list' || mesh.indices)
      throw new Error('PointCloudTiler: unindexed point-list input required');
    const position = mesh.attributes.POSITION;
    if (
      !position ||
      position.size !== 3 ||
      !(position.value instanceof Float32Array || position.value instanceof Float64Array) ||
      position.transform ||
      position.normalized ||
      position.componentType === 'float16'
    )
      throw new Error('PointCloudTiler: POSITION requires decoded floating-point XYZ');
    if (!mesh.header && (position.byteOffset || position.byteStride))
      throw new Error('PointCloudTiler: strided POSITION requires vertexCount');
    const count = mesh.header?.vertexCount ?? position.value.length / 3;
    if (!Number.isSafeInteger(count) || count < 0 || count > 0xffffffff)
      throw new Error('PointCloudTiler: invalid point count');
    let inputBytes = 0;
    const buffers = new Set<ArrayBufferLike>();
    for (const attribute of Object.values(mesh.attributes)) {
      this.validateAttribute(attribute, count);
      if (!buffers.has(attribute.value.buffer)) {
        buffers.add(attribute.value.buffer);
        inputBytes += attribute.value.buffer.byteLength;
      }
      this.pointByteLength += attribute.size * attribute.value.BYTES_PER_ELEMENT;
    }
    if (inputBytes > this.options.maxInputBytes)
      throw new Error('PointCloudTiler: input byte budget exceeded');
    this.mesh = mesh;
    this.sourcePointCount = count;
    const rows = this.allocateRows(count);
    const minimum: [number, number, number] = [Infinity, Infinity, Infinity];
    const maximum: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (let row = 0; row < count; row++) {
      if (row % 65536 === 0) await this.checkpoint();
      rows[row] = row;
      for (let axis = 0; axis < 3; axis++) {
        const coordinate = this.getCoordinate(row, axis);
        if (!Number.isFinite(coordinate)) throw new Error('PointCloudTiler: nonfinite position');
        minimum[axis] = Math.min(minimum[axis], coordinate);
        maximum[axis] = Math.max(maximum[axis], coordinate);
      }
    }
    if (!count) {
      minimum.fill(0);
      maximum.fill(0);
    }
    const width = Math.max(...minimum.map((value, axis) => maximum[axis] - value));
    if (!Number.isFinite(width)) throw new Error('PointCloudTiler: coordinate extent overflow');
    for (let axis = 0; axis < 3; axis++) maximum[axis] = minimum[axis] + width;
    if (!maximum.every(Number.isFinite) || !Number.isFinite(Math.hypot(width, width, width)))
      throw new Error('PointCloudTiler: coordinate extent overflow');
    await this.createNode('r', [minimum, maximum], rows);
    this.signal.throwIfAborted();
  }

  /** Selects at most one source row per grid cell; rejects no input rows. */
  private async createNode(
    id: string,
    bounds: PointCloudTileBounds,
    inputRows: Uint32Array
  ): Promise<NodeState> {
    const terminal =
      id.length - 1 >= this.options.maximumDepth ||
      bounds[0].every((value, axis) => value === bounds[1][axis]) ||
      inputRows.length <= this.options.nodePointLimit;
    let rows = inputRows;
    let remaining: Uint32Array = new Uint32Array(0);
    if (!terminal) {
      const resolution = Math.ceil(Math.cbrt(this.options.nodePointLimit));
      const cells = new Set<number>();
      const selected = this.allocateRows(Math.min(inputRows.length, this.options.nodePointLimit));
      const deferred = this.allocateRows(inputRows.length);
      let selectedCount = 0;
      let deferredCount = 0;
      for (let index = 0; index < inputRows.length; index++) {
        if (index % 65536 === 0) await this.checkpoint();
        const row = inputRows[index];
        let cell = 0;
        for (let axis = 0; axis < 3; axis++) {
          const component = Math.min(
            resolution - 1,
            Math.floor(
              ((this.getCoordinate(row, axis) - bounds[0][axis]) /
                (bounds[1][axis] - bounds[0][axis])) *
                resolution
            )
          );
          cell = cell * resolution + component;
        }
        if (selectedCount < selected.length && !cells.has(cell)) {
          cells.add(cell);
          selected[selectedCount++] = row;
        } else deferred[deferredCount++] = row;
      }
      rows = selected.subarray(0, selectedCount);
      remaining = deferred.subarray(0, deferredCount);
      this.releaseRows(inputRows);
    }
    const state: NodeState = {
      node: {
        id,
        level: id.length - 1,
        pointCount: rows.length,
        bounds,
        geometricError: remaining.length
          ? Math.hypot(...bounds[0].map((value, axis) => bounds[1][axis] - value))
          : 0
      },
      rows,
      remaining
    };
    Object.freeze(bounds[0]);
    Object.freeze(bounds[1]);
    Object.freeze(bounds);
    Object.freeze(state.node);
    this.signal.throwIfAborted();
    // Concurrent splits may have inserted children since the preflight check.
    if (this.nodes.size >= this.options.maxNodes)
      throw new Error('PointCloudTiler: node budget exceeded');
    this.nodes.set(id, state);
    return state;
  }

  /** Reads a floating-point coordinate from a checked packed or strided accessor. */
  private getCoordinate(row: number, axis: number): number {
    const attribute = this.mesh!.attributes.POSITION;
    return Number(
      attribute.value[
        (attribute.byteOffset || 0) / attribute.value.BYTES_PER_ELEMENT +
          (row * (attribute.byteStride || 3 * attribute.value.BYTES_PER_ELEMENT)) /
            attribute.value.BYTES_PER_ELEMENT +
          axis
      ]
    );
  }

  /** Validates a typed attribute's alignment and coverage before indexing or gathering. */
  private validateAttribute(attribute: MeshAttribute, count: number): void {
    const bytes = attribute.value?.BYTES_PER_ELEMENT;
    const offset = attribute.byteOffset ?? 0;
    const stride = attribute.byteStride || attribute.size * bytes;
    if (
      !bytes ||
      !Number.isSafeInteger(attribute.size) ||
      attribute.size < 1 ||
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset % bytes ||
      !Number.isSafeInteger(stride) ||
      stride < attribute.size * bytes ||
      stride % bytes ||
      (count && offset + (count - 1) * stride + attribute.size * bytes > attribute.value.byteLength)
    )
      throw new Error('PointCloudTiler: invalid attribute layout');
  }

  /** Allocates counted row-index storage before any allocation exceeds the live budget. */
  private allocateRows(count: number): Uint32Array {
    if (count * 4 > this.options.maxIndexBytes - this.indexBytes)
      throw new Error('PointCloudTiler: index byte budget exceeded');
    const rows = new Uint32Array(count);
    this.indexBytes += rows.byteLength;
    return rows;
  }

  /** Releases the allocation underlying a row subview. */
  private releaseRows(rows: Uint32Array): void {
    this.indexBytes -= rows.buffer.byteLength;
  }

  /** Retrieves source-owned state, rejecting unknown or closed tiles. */
  private getNode(id: string): NodeState {
    this.signal.throwIfAborted();
    const state = this.nodes.get(id);
    if (!state) throw new Error(`PointCloudTiler: unknown tile ${id}`);
    return state;
  }

  /** Resolves deterministic octant ownership, assigning midpoint boundaries to the upper child. */
  private getOctant(row: number, midpoint: number[]): number {
    let octant = 0;
    for (let axis = 0; axis < 3; axis++)
      if (this.getCoordinate(row, axis) >= midpoint[axis]) octant |= 4 >> axis;
    return octant;
  }

  /** Yields to the event loop and checks cancellation without public-network or platform APIs. */
  private async checkpoint(): Promise<void> {
    this.signal.throwIfAborted();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    this.signal.throwIfAborted();
  }
}
