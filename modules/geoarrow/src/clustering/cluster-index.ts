// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** A geographic extent, including west > east for an antimeridian crossing. */
export type ClusterBounds = readonly [west: number, south: number, east: number, north: number];

/** Numeric input column and associative aggregation. Values align with input positions. */
export type ClusterAggregation = {
  /** One finite value per input point. */
  values: ArrayLike<number>;
  /** Operation applied to all descendants, independent of hierarchy depth. */
  operation: 'sum' | 'min' | 'max';
};

/** Construction options for an immutable geographic clustering hierarchy. */
export type ClusterIndexOptions = {
  /** Radius in map pixels at integer zoom levels. Defaults to 40. */
  radiusPixels?: number;
  /** Map world width at zoom zero. Defaults to 512 pixels. */
  tileSize?: number;
  /** Lowest indexed zoom. Defaults to 0. */
  minZoom?: number;
  /** Highest clustered zoom, from 0 through 30. Defaults to 16. */
  maxZoom?: number;
  /** Minimum number of original points required to form a cluster. Defaults to 2. */
  minPoints?: number;
  /** Original table row per point. Defaults to the point's input offset. */
  rowIndices?: ArrayLike<number>;
  /** Named numeric aggregations; arrays align with positions, not rowIndices. */
  aggregations?: Readonly<Record<string, ClusterAggregation>>;
};

/** A point or cluster; IDs are meaningful only within the index that produced them. */
export type ClusterNode = {
  /** Opaque index-local identifier used for hierarchy queries. */
  id: number;
  /** Whether the node contains multiple input points. */
  isCluster: boolean;
  /** Longitude and latitude of the representative position. */
  position: [number, number];
  /** Number of original points, including duplicates. */
  pointCount: number;
  /** Original table row for a leaf, otherwise null. */
  rowIndex: number | null;
  /** Numeric aggregate values, returned as an independent object. */
  properties: Record<string, number>;
};

/** Typed columns for one zoom level. Unchanged levels share their storage. */
type ClusterLevel = {
  /** Interleaved normalized Mercator positions. */
  positions: Float64Array;
  /** Original point counts. */
  counts: Float64Array;
  /** Opaque node identifiers. */
  identifiers: Float64Array;
  /** Named aggregate columns. */
  aggregates: Record<string, Float64Array>;
  /** Spatial bins used by extent and radius queries. */
  grid: PointGrid;
};

/** Location and descendants of a newly formed cluster. */
type ClusterBranch = {
  /** Level where this node was first formed. */
  level: ClusterLevel;
  /** Offset in the level columns. */
  index: number;
  /** Zoom where this node splits. */
  expansionZoom: number;
  /** IDs of immediate children, in deterministic input order. */
  children: Float64Array;
};

/**
 * Immutable, columnar point clustering with a deterministic greedy zoom hierarchy.
 *
 * Input is interleaved longitude/latitude. The index snapshots all inputs, wraps longitude,
 * clamps Mercator latitude, and groups across the antimeridian. Grouping is seed-radius based,
 * not transitive connected components; input order can affect membership. Rebuild after edits.
 */
export class ClusterIndex {
  /** Number of indexed input points. */
  readonly pointCount: number;
  /** Lowest available zoom. */
  readonly minZoom: number;
  /** Last zoom containing clusters; maxZoom + 1 always returns leaves. */
  readonly maxZoom: number;
  /** Pixel radius used to construct the hierarchy. */
  readonly radiusPixels: number;
  /** World width in pixels at zoom zero. */
  readonly tileSize: number;
  /** Minimum descendant count for a new cluster. */
  readonly minPoints: number;
  /** Original, unprojected leaf positions. */
  private readonly coordinates: Float64Array;
  /** Original table row references. */
  private readonly rowIndices: Float64Array;
  /** Immutable aggregation operation names. */
  private readonly operations: Record<string, ClusterAggregation['operation']>;
  /** Zoom-level columns and spatial bins. */
  private readonly levels = new Map<number, ClusterLevel>();
  /** Cluster records; leaves use their input offset as ID. */
  private readonly branches = new Map<number, ClusterBranch>();

  /** Copies coordinates and aggregate columns, then builds every requested zoom level. */
  constructor(coordinates: ArrayLike<number>, options: ClusterIndexOptions = {}) {
    this.pointCount = coordinates.length / 2;
    this.minZoom = options.minZoom ?? 0;
    this.maxZoom = options.maxZoom ?? 16;
    this.radiusPixels = options.radiusPixels ?? 40;
    this.tileSize = options.tileSize ?? 512;
    this.minPoints = options.minPoints ?? 2;
    if (!Number.isSafeInteger(this.pointCount) || this.pointCount < 0) {
      throw new Error('Cluster coordinates must contain longitude/latitude pairs');
    }
    if (
      !Number.isInteger(this.minZoom) ||
      !Number.isInteger(this.maxZoom) ||
      this.minZoom < 0 ||
      this.maxZoom > 30 ||
      this.minZoom > this.maxZoom
    ) {
      throw new Error('Cluster zoom range must contain integers between 0 and 30');
    }
    if (
      !Number.isFinite(this.radiusPixels) ||
      this.radiusPixels <= 0 ||
      !Number.isFinite(this.tileSize) ||
      this.tileSize <= 0 ||
      !Number.isSafeInteger(this.minPoints) ||
      this.minPoints < 2 ||
      !Number.isFinite(this.radiusPixels / this.tileSize) ||
      this.radiusPixels / (this.tileSize * 2 ** this.maxZoom) < 2 / Number.MAX_SAFE_INTEGER
    ) {
      throw new Error('Invalid cluster radius, tile size or minimum point count');
    }
    if (options.rowIndices && options.rowIndices.length !== this.pointCount) {
      throw new Error('Cluster row indices must align with positions');
    }
    this.coordinates = Float64Array.from(coordinates);
    this.rowIndices = new Float64Array(this.pointCount);
    const positions = new Float64Array(coordinates.length);
    for (let index = 0; index < this.pointCount; index++) {
      const longitude = this.coordinates[index * 2];
      const latitude = this.coordinates[index * 2 + 1];
      const rowIndex = options.rowIndices?.[index] ?? index;
      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        Math.abs(latitude) > 90 ||
        !Number.isSafeInteger(rowIndex) ||
        rowIndex < 0
      ) {
        throw new Error(
          'Cluster positions must be finite geographic coordinates and rows nonnegative integers'
        );
      }
      this.rowIndices[index] = rowIndex;
      positions[index * 2] = wrapUnit(longitude / 360 + 0.5);
      positions[index * 2 + 1] = projectLatitude(latitude);
    }
    const aggregates: Record<string, Float64Array> = Object.create(null);
    this.operations = Object.create(null);
    for (const [name, aggregation] of Object.entries(options.aggregations || {})) {
      if (
        !['sum', 'min', 'max'].includes(aggregation.operation) ||
        aggregation.values.length !== this.pointCount
      ) {
        throw new Error(`Invalid cluster aggregation: ${name}`);
      }
      const values = Float64Array.from(aggregation.values);
      if (!values.every(Number.isFinite)) throw new Error(`Nonfinite cluster aggregation: ${name}`);
      aggregates[name] = values;
      this.operations[name] = aggregation.operation;
    }
    let level = createLevel(
      positions,
      new Float64Array(this.pointCount).fill(1),
      Float64Array.from({length: this.pointCount}, (_, index) => index),
      aggregates,
      this.getRadius(this.maxZoom)
    );
    this.levels.set(this.maxZoom + 1, level);
    for (let zoom = this.maxZoom; zoom >= this.minZoom; zoom--) {
      level = this.createParentLevel(level, zoom);
      this.levels.set(zoom, level);
    }
  }

  /** Queries cluster centers in an inclusive geographic extent at floor(zoom), clamped to the index. */
  getClusters(bounds: ClusterBounds, zoom: number): ClusterNode[] {
    if (!bounds.every(Number.isFinite) || bounds[1] > bounds[3] || !Number.isFinite(zoom)) {
      throw new Error('Cluster query requires finite bounds, ordered latitudes and a finite zoom');
    }
    if (bounds[1] > 90 || bounds[3] < -90) return [];
    const level = this.levels.get(
      Math.max(this.minZoom, Math.min(this.maxZoom + 1, Math.floor(zoom)))
    )!;
    const minimumY = projectLatitude(bounds[3]);
    const maximumY = projectLatitude(bounds[1]);
    const minimumX = wrapUnit(bounds[0] / 360 + 0.5);
    const maximumX = wrapUnit(bounds[2] / 360 + 0.5);
    const ranges =
      Math.abs(bounds[2] - bounds[0]) >= 360
        ? [[0, 1]]
        : minimumX <= maximumX
          ? [[minimumX, maximumX]]
          : [
              [minimumX, 1],
              [0, maximumX]
            ];
    const indices = new Set<number>();
    for (const [start, end] of ranges) {
      for (const index of level.grid.query(start, minimumY, end, maximumY)) indices.add(index);
    }
    return [...indices]
      .sort((first, second) => first - second)
      .map(index => this.readNode(level, index))
      .filter(node => node.position[1] >= bounds[1] && node.position[1] <= bounds[3]);
  }

  /** Returns immediate child nodes; rejects leaf IDs and IDs absent from this index. */
  getChildren(clusterId: number): ClusterNode[] {
    return Array.from(this.getBranch(clusterId).children, identifier => this.getNode(identifier));
  }

  /** Returns original rows in depth-first order without materializing skipped subtrees. */
  getLeaves(
    clusterId: number,
    options: {
      /** Maximum returned rows; defaults to 100. */ limit?: number;
      /** Rows to skip; defaults to zero. */ offset?: number;
    } = {}
  ): number[] {
    const branch = this.getBranch(clusterId);
    const limit = options.limit ?? 100;
    let offset = options.offset ?? 0;
    if (
      (!Number.isSafeInteger(limit) && limit !== Infinity) ||
      limit < 0 ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    )
      throw new Error('Invalid cluster leaf pagination');
    const rows: number[] = [];
    const pending = Array.from(branch.children).reverse();
    while (pending.length && rows.length < limit) {
      const identifier = pending.pop()!;
      const child = this.branches.get(identifier);
      const count = child ? child.level.counts[child.index] : 1;
      if (offset >= count) {
        offset -= count;
        continue;
      }
      if (child) {
        for (let index = child.children.length - 1; index >= 0; index--)
          pending.push(child.children[index]);
      } else rows.push(this.rowIndices[identifier]);
    }
    return rows;
  }

  /** First integer zoom where the cluster splits; coincident leaves split at maxZoom + 1. */
  getExpansionZoom(clusterId: number): number {
    return this.getBranch(clusterId).expansionZoom;
  }

  /** Returns an independent node snapshot for a leaf or cluster ID. */
  getNode(identifier: number): ClusterNode {
    if (Number.isInteger(identifier) && identifier >= 0 && identifier < this.pointCount) {
      return this.readNode(this.levels.get(this.maxZoom + 1)!, identifier);
    }
    const branch = this.getBranch(identifier);
    return this.readNode(branch.level, branch.index);
  }

  /** Resolves a cluster ID without allowing accidental leaf queries. */
  private getBranch(identifier: number): ClusterBranch {
    const branch = this.branches.get(identifier);
    if (!branch) throw new Error(`Unknown cluster ID: ${identifier}`);
    return branch;
  }

  /** Converts the pixel radius into normalized world units. */
  private getRadius(zoom: number): number {
    return this.radiusPixels / this.tileSize / 2 ** zoom;
  }

  /** Forms disjoint seed-radius groups; stable candidate order makes results reproducible. */
  private createParentLevel(previous: ClusterLevel, zoom: number): ClusterLevel {
    const radius = this.getRadius(zoom);
    const grid =
      previous.grid.cellSize === radius ? previous.grid : new PointGrid(previous.positions, radius);
    const visited = new Uint8Array(previous.counts.length);
    const positions: number[] = [];
    const counts: number[] = [];
    const identifiers: number[] = [];
    const aggregates: Record<string, number[]> = Object.create(null);
    for (const name of Object.keys(this.operations)) aggregates[name] = [];
    const branches: {identifier: number; index: number; children: Float64Array}[] = [];
    for (let seed = 0; seed < visited.length; seed++) {
      if (visited[seed]) continue;
      const seedX = previous.positions[seed * 2];
      const seedY = previous.positions[seed * 2 + 1];
      const candidates = grid
        .queryRadius(seedX, seedY, radius)
        .filter(index => !visited[index])
        .sort((first, second) => first - second);
      const count = candidates.reduce((total, index) => total + previous.counts[index], 0);
      const group = candidates.length > 1 && count >= this.minPoints ? candidates : [seed];
      let totalCount = 0;
      let centerX = 0;
      let centerY = 0;
      for (const index of group) {
        visited[index] = 1;
        const pointCount = previous.counts[index];
        let deltaX = previous.positions[index * 2] - seedX;
        deltaX -= Math.round(deltaX);
        centerX += (seedX + deltaX) * pointCount;
        centerY += previous.positions[index * 2 + 1] * pointCount;
        totalCount += pointCount;
      }
      const identifier =
        group.length === 1
          ? previous.identifiers[seed]
          : this.pointCount + this.branches.size + branches.length;
      if (group.length > 1)
        branches.push({
          identifier,
          index: counts.length,
          children: Float64Array.from(group, index => previous.identifiers[index])
        });
      positions.push(wrapUnit(centerX / totalCount), centerY / totalCount);
      counts.push(totalCount);
      identifiers.push(identifier);
      for (const [name, operation] of Object.entries(this.operations)) {
        let value = previous.aggregates[name][group[0]];
        for (let index = 1; index < group.length; index++) {
          const next = previous.aggregates[name][group[index]];
          value =
            operation === 'sum'
              ? value + next
              : operation === 'min'
                ? Math.min(value, next)
                : Math.max(value, next);
        }
        if (!Number.isFinite(value)) throw new Error(`Cluster aggregation overflow: ${name}`);
        aggregates[name].push(value);
      }
    }
    if (!branches.length) return previous;
    const columns: Record<string, Float64Array> = Object.create(null);
    for (const name of Object.keys(aggregates)) columns[name] = Float64Array.from(aggregates[name]);
    const level = createLevel(
      Float64Array.from(positions),
      Float64Array.from(counts),
      Float64Array.from(identifiers),
      columns,
      this.getRadius(zoom - 1)
    );
    for (const branch of branches)
      this.branches.set(branch.identifier, {
        level,
        index: branch.index,
        children: branch.children,
        expansionZoom: zoom + 1
      });
    return level;
  }

  /** Materializes only requested output nodes, preserving exact leaf coordinates. */
  private readNode(level: ClusterLevel, index: number): ClusterNode {
    const identifier = level.identifiers[index];
    const isCluster = identifier >= this.pointCount;
    const properties: Record<string, number> = Object.create(null);
    for (const name of Object.keys(this.operations))
      properties[name] = level.aggregates[name][index];
    const projectedY = level.positions[index * 2 + 1];
    return {
      id: identifier,
      isCluster,
      pointCount: level.counts[index],
      rowIndex: isCluster ? null : this.rowIndices[identifier],
      properties,
      position: isCluster
        ? [
            level.positions[index * 2] * 360 - 180,
            (Math.atan(Math.sinh(Math.PI * (1 - 2 * projectedY))) * 180) / Math.PI
          ]
        : [this.coordinates[identifier * 2], this.coordinates[identifier * 2 + 1]]
    };
  }
}

/** Creates indexed column storage for one level. */
function createLevel(
  positions: Float64Array,
  counts: Float64Array,
  identifiers: Float64Array,
  aggregates: Record<string, Float64Array>,
  cellSize: number
): ClusterLevel {
  return {positions, counts, identifiers, aggregates, grid: new PointGrid(positions, cellSize)};
}

/** Sparse uniform grid; large queries scan occupied points instead of empty world cells. */
class PointGrid {
  /** Point offsets per cell. */
  private readonly cells = new Map<string, number[]>();
  /** Coordinate columns retained without a second copy. */
  private readonly positions: Float64Array;
  /** Positive bin width in normalized world units. */
  readonly cellSize: number;

  /** Assigns each point to exactly one spatial bin. */
  constructor(positions: Float64Array, cellSize: number) {
    this.positions = positions;
    this.cellSize = cellSize;
    for (let index = 0; index < positions.length / 2; index++) {
      const key = `${Math.floor(positions[index * 2] / cellSize)},${Math.floor(positions[index * 2 + 1] / cellSize)}`;
      const cell = this.cells.get(key);
      if (cell) cell.push(index);
      else this.cells.set(key, [index]);
    }
  }

  /** Returns offsets inside an inclusive rectangle. */
  query(minimumX: number, minimumY: number, maximumX: number, maximumY: number): number[] {
    const firstColumn = Math.floor(minimumX / this.cellSize);
    const lastColumn = Math.floor(maximumX / this.cellSize);
    const firstRow = Math.floor(minimumY / this.cellSize);
    const lastRow = Math.floor(maximumY / this.cellSize);
    const result: number[] = [];
    /** Refines a bin candidate against exact rectangle boundaries. */
    const considerPoint = (index: number): void => {
      const positionX = this.positions[index * 2];
      const positionY = this.positions[index * 2 + 1];
      if (
        positionX >= minimumX &&
        positionX <= maximumX &&
        positionY >= minimumY &&
        positionY <= maximumY
      )
        result.push(index);
    };
    if ((lastColumn - firstColumn + 1) * (lastRow - firstRow + 1) > this.cells.size * 4) {
      for (let index = 0; index < this.positions.length / 2; index++) considerPoint(index);
    } else {
      for (let column = firstColumn; column <= lastColumn; column++) {
        for (let row = firstRow; row <= lastRow; row++) {
          const cell = this.cells.get(`${column},${row}`);
          if (cell) for (const index of cell) considerPoint(index);
        }
      }
    }
    return result;
  }

  /** Finds neighbors in a wrapped Euclidean Mercator circle. */
  queryRadius(positionX: number, positionY: number, radius: number): number[] {
    const candidates = new Set(
      this.query(
        Math.max(0, positionX - radius),
        positionY - radius,
        Math.min(1, positionX + radius),
        positionY + radius
      )
    );
    if (positionX - radius < 0)
      for (const index of this.query(
        Math.max(0, 1 + positionX - radius),
        positionY - radius,
        1,
        positionY + radius
      ))
        candidates.add(index);
    if (positionX + radius >= 1)
      for (const index of this.query(
        0,
        positionY - radius,
        Math.min(1, positionX + radius - 1),
        positionY + radius
      ))
        candidates.add(index);
    return [...candidates].filter(index => {
      const deltaX = Math.abs(this.positions[index * 2] - positionX);
      return (
        Math.hypot(Math.min(deltaX, 1 - deltaX), this.positions[index * 2 + 1] - positionY) <=
        radius
      );
    });
  }
}

/** Wraps a normalized world coordinate into [0, 1). */
function wrapUnit(value: number): number {
  const remainder = value % 1;
  return remainder < 0 ? remainder + 1 : remainder;
}

/** Projects latitude with a finite Mercator pole clamp. */
function projectLatitude(latitude: number): number {
  const clampedLatitude = Math.max(-85.0511287798066, Math.min(85.0511287798066, latitude));
  return Math.max(
    0,
    Math.min(1, (1 - Math.asinh(Math.tan((clampedLatitude * Math.PI) / 180)) / Math.PI) / 2)
  );
}
