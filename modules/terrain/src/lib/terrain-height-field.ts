// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {sampleTerrainHeightGrid} from './terrain-height-grid';
import type {TerrainHeightGrid} from './terrain-contracts';

/** Absolute EPSG:3857 [west, south, east, north], including zero-width probe bounds. */
export type TerrainFieldBounds = readonly [number, number, number, number];

/** Retained mask admission; geometry, source arrays and JavaScript metadata are separate. */
export interface TerrainHeightFieldOptions {
  /** Maximum retained summed-area mask bytes; default 8 MiB. Zero uses exact sample scans. */
  maxMaskBytes?: number;
}

/** Detached operation counts, suitable for deterministic performance tests rather than FPS estimates. */
export interface TerrainHeightFieldStatistics {
  /** Number of retained immutable source references. */
  grids: number;
  /** Retained summed-area mask bytes, excluding source arrays and tree metadata. */
  maskBytes: number;
  /** Admitted mask constructions, each built at most once per grid. */
  maskBuilds: number;
  /** Validity samples read during mask construction or exact fallback scans. */
  maskSamples: number;
  /** Spatial tree envelopes tested by sampling and coverage queries. */
  boundsTests: number;
  /** Candidate grid footprints visited after tree pruning. */
  candidateGrids: number;
}

/** Private source identity, detached footprint and lazy mask state. */
interface FieldEntry {
  /** Detached descriptor sharing immutable sample arrays. */
  grid: TerrainHeightGrid;
  /** Original accumulation order, independent of spatial sorting. */
  index: number;
  /** Exact source footprint. */
  bounds: TerrainFieldBounds;
  /** Legacy touching-edge tolerance envelope. */
  sampleBounds: TerrainFieldBounds;
  /** Lazy prefix; null means fully valid, undefined means unprepared/unadmitted. */
  mask?: Uint32Array | null;
}

/** Balanced spatial envelope; leaves contain exactly one source. */
interface FieldNode {
  /** Closed union of every descendant sampling envelope. */
  bounds: TerrainFieldBounds;
  /** Source owner on a leaf. */
  entry?: FieldEntry;
  /** Median-partitioned child envelopes on an internal node. */
  children?: readonly [FieldNode, FieldNode];
}

/**
 * Immutable-source physical height sampling and conservative footprint admission.
 * Snapshots membership/bounds, not height arrays: do not mutate shared grids.
 * No provider, worker, deck view, GPU resource or implicit longitude wrapping is owned.
 */
export class TerrainHeightField {
  /** Original order for small-field direct sampling, avoiding tree/sort overhead. */
  private readonly entries: readonly FieldEntry[];
  /** Immutable spatial tree built once per admitted field. */
  private readonly root: FieldNode | null;
  /** Fixed retained summed-area mask admission limit. */
  private readonly maxMaskBytes: number;
  /** Mutable counters never exposed by reference. */
  private readonly statistics: TerrainHeightFieldStatistics;

  /** Retain structurally valid decoded grids with one datum; overlaps preserve ordered sample averaging. */
  constructor(grids: readonly TerrainHeightGrid[], options: TerrainHeightFieldOptions = {}) {
    this.maxMaskBytes = options.maxMaskBytes ?? 8 * 1024 * 1024;
    if (!Number.isSafeInteger(this.maxMaskBytes) || this.maxMaskBytes < 0)
      throw new Error('Invalid terrain field mask budget');
    this.statistics = {
      grids: grids.length,
      maskBytes: 0,
      maskBuilds: 0,
      maskSamples: 0,
      boundsTests: 0,
      candidateGrids: 0
    };
    const entries = grids.map((grid, index): FieldEntry => {
      const [west, south, east, north] = grid.bounds;
      if (
        grid.bounds.length !== 4 ||
        !grid.bounds.every(Number.isFinite) ||
        west >= east ||
        south >= north ||
        !Number.isFinite(east - west) ||
        !Number.isFinite(north - south) ||
        !Number.isSafeInteger(grid.width) ||
        !Number.isSafeInteger(grid.height) ||
        grid.width < 2 ||
        grid.height < 2 ||
        !Number.isSafeInteger(grid.width * grid.height) ||
        grid.heights.length !== grid.width * grid.height ||
        grid.valid.length !== grid.heights.length ||
        !['pixel-center', 'grid-node'].includes(grid.registration) ||
        !['unknown', 'ellipsoidal', 'orthometric'].includes(grid.verticalDatum) ||
        grid.verticalDatum !== grids[0].verticalDatum
      )
        throw new Error('Invalid terrain field grid or datum');
      const bounds: TerrainFieldBounds = [west, south, east, north];
      const tolerance = Math.max(east - west, north - south) * 1e-10;
      return {
        grid: {...grid, bounds},
        index,
        bounds,
        sampleBounds: [west - tolerance, south - tolerance, east + tolerance, north + tolerance]
      };
    });
    this.entries = entries;
    this.root = entries.length ? buildFieldNode([...entries]) : null;
  }

  /** Sample physical meters in original source order; any contributing no-data support remains a hole. */
  sampleHeight(position: readonly [number, number]): number | null {
    if (position.length !== 2 || !position.every(Number.isFinite)) return null;
    const direct = this.entries.length <= 16;
    const bounds: TerrainFieldBounds = [position[0], position[1], position[0], position[1]];
    const candidates = direct ? this.entries : this.findEntries(bounds);
    let sum = 0,
      count = 0;
    for (const entry of candidates) {
      if (direct) this.statistics.boundsTests++;
      if (!intersectsBounds(entry.sampleBounds, bounds)) continue;
      if (direct) this.statistics.candidateGrids++;
      const [west, south, east, north] = entry.bounds;
      const height = sampleTerrainHeightGrid(entry.grid, [
        Math.max(west, Math.min(east, position[0])),
        Math.max(south, Math.min(north, position[1]))
      ]);
      if (height === null) return null;
      sum += height;
      count++;
    }
    return count ? sum / count : null;
  }

  /** Require complete rectangular footprint coverage and no invalid bilinear-support sample; not an exact triangle mask. */
  coversBounds(bounds: TerrainFieldBounds): boolean {
    if (
      bounds.length !== 4 ||
      !bounds.every(Number.isFinite) ||
      bounds[0] > bounds[2] ||
      bounds[1] > bounds[3] ||
      !Number.isFinite(bounds[2] - bounds[0]) ||
      !Number.isFinite(bounds[3] - bounds[1])
    )
      throw new Error('Invalid terrain field probe bounds');
    const width = bounds[2] - bounds[0],
      height = bounds[3] - bounds[1];
    if (!Number.isFinite(width * height) || (width > 0 && height > 0 && width * height === 0))
      throw new Error('Terrain field probe area must be finite and representable');
    if (!width && !height) return this.sampleHeight([bounds[0], bounds[1]]) !== null;
    const clipped: TerrainFieldBounds[] = [];
    for (const entry of this.findEntries(bounds)) {
      const left = Math.max(bounds[0], entry.bounds[0]),
        right = Math.min(bounds[2], entry.bounds[2]);
      const bottom = Math.max(bounds[1], entry.bounds[1]),
        top = Math.min(bounds[3], entry.bounds[3]);
      if (left > right || bottom > top || (width && left === right) || (height && bottom === top))
        continue;
      if (this.hasMissingSamples(entry, [left, bottom, right, top])) return false;
      clipped.push([left, bottom, right, top]);
    }
    // Exact slab/interval coverage: an arbitrarily narrow representable gap stays a gap.
    if (!width || !height) {
      return coversInterval(
        clipped.map(rectangle =>
          width ? [rectangle[0], rectangle[2]] : [rectangle[1], rectangle[3]]
        ),
        width ? bounds[0] : bounds[1],
        width ? bounds[2] : bounds[3]
      );
    }
    const columns = [
      ...new Set([
        bounds[0],
        bounds[2],
        ...clipped.flatMap(rectangle => [rectangle[0], rectangle[2]])
      ])
    ].sort((first, second) => first - second);
    for (let column = 1; column < columns.length; column++) {
      const left = columns[column - 1],
        right = columns[column];
      const intervals: [number, number][] = clipped
        .filter(rectangle => rectangle[0] <= left && rectangle[2] >= right)
        .map(rectangle => [rectangle[1], rectangle[3]]);
      if (!coversInterval(intervals, bounds[1], bounds[3])) return false;
    }
    return true;
  }

  /** Scalar counters only; callers cannot mutate cache ownership through diagnostics. */
  getStatistics(): TerrainHeightFieldStatistics {
    return {...this.statistics};
  }

  /** Traverse closed envelopes, then preserve original source order for floating-point accumulation. */
  private findEntries(bounds: TerrainFieldBounds): FieldEntry[] {
    const entries: FieldEntry[] = [],
      pending = this.root ? [this.root] : [];
    while (pending.length) {
      const node = pending.pop()!;
      this.statistics.boundsTests++;
      if (!intersectsBounds(node.bounds, bounds)) continue;
      if (node.entry) {
        entries.push(node.entry);
        this.statistics.candidateGrids++;
      } else if (node.children) pending.push(...node.children);
    }
    return entries.sort((first, second) => first.index - second.index);
  }

  /** Admit a lazy reusable prefix or scan the same support rectangle exactly when it does not fit. */
  private hasMissingSamples(entry: FieldEntry, bounds: TerrainFieldBounds): boolean {
    const {grid} = entry,
      stride = grid.width + 1;
    const required = stride * (grid.height + 1) * Uint32Array.BYTES_PER_ELEMENT;
    if (entry.mask === undefined && required <= this.maxMaskBytes - this.statistics.maskBytes) {
      let hasMissing = false;
      for (const valid of grid.valid) {
        this.statistics.maskSamples++;
        if (!valid) {
          hasMissing = true;
          break;
        }
      }
      if (!hasMissing) {
        entry.mask = null;
        return false;
      }
      const prefix = new Uint32Array(stride * (grid.height + 1));
      for (let row = 0; row < grid.height; row++)
        for (let column = 0; column < grid.width; column++) {
          const offset = (row + 1) * stride + column + 1,
            invalid = Number(!grid.valid[row * grid.width + column]);
          prefix[offset] =
            invalid + prefix[offset - 1] + prefix[offset - stride] - prefix[offset - stride - 1];
        }
      this.statistics.maskSamples += grid.valid.length;
      entry.mask = prefix;
      this.statistics.maskBytes += required;
      this.statistics.maskBuilds++;
    }
    if (entry.mask === null) return false;
    const pixel = grid.registration === 'pixel-center';
    const column = (x: number) =>
      Math.max(
        0,
        Math.min(
          grid.width - 1,
          ((x - grid.bounds[0]) / (grid.bounds[2] - grid.bounds[0])) *
            (pixel ? grid.width : grid.width - 1) -
            (pixel ? 0.5 : 0)
        )
      );
    const row = (y: number) =>
      Math.max(
        0,
        Math.min(
          grid.height - 1,
          ((grid.bounds[3] - y) / (grid.bounds[3] - grid.bounds[1])) *
            (pixel ? grid.height : grid.height - 1) -
            (pixel ? 0.5 : 0)
        )
      );
    const firstColumn = Math.floor(column(bounds[0])),
      lastColumn = Math.ceil(column(bounds[2]));
    const firstRow = Math.floor(row(bounds[3])),
      lastRow = Math.ceil(row(bounds[1]));
    if (entry.mask)
      return Boolean(
        entry.mask[(lastRow + 1) * stride + lastColumn + 1] -
          entry.mask[firstRow * stride + lastColumn + 1] -
          entry.mask[(lastRow + 1) * stride + firstColumn] +
          entry.mask[firstRow * stride + firstColumn]
      );
    for (let row = firstRow; row <= lastRow; row++)
      for (let column = firstColumn; column <= lastColumn; column++) {
        this.statistics.maskSamples++;
        if (!grid.valid[row * grid.width + column]) return true;
      }
    return false;
  }
}

/** Closed rectangle intersection, including tolerance-expanded sampling envelopes. */
function intersectsBounds(first: TerrainFieldBounds, second: TerrainFieldBounds): boolean {
  return (
    first[0] <= second[2] && first[2] >= second[0] && first[1] <= second[3] && first[3] >= second[1]
  );
}

/** Median split on the longest axis; no external spatial-index dependency is needed. */
function buildFieldNode(entries: FieldEntry[]): FieldNode {
  const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const entry of entries) {
    bounds[0] = Math.min(bounds[0], entry.sampleBounds[0]);
    bounds[1] = Math.min(bounds[1], entry.sampleBounds[1]);
    bounds[2] = Math.max(bounds[2], entry.sampleBounds[2]);
    bounds[3] = Math.max(bounds[3], entry.sampleBounds[3]);
  }
  if (entries.length === 1) return {bounds, entry: entries[0]};
  const axis = bounds[2] - bounds[0] >= bounds[3] - bounds[1] ? 0 : 1;
  entries.sort(
    (first, second) =>
      first.bounds[axis] / 2 +
        first.bounds[axis + 2] / 2 -
        (second.bounds[axis] / 2 + second.bounds[axis + 2] / 2) || first.index - second.index
  );
  const middle = Math.floor(entries.length / 2);
  return {
    bounds,
    children: [buildFieldNode(entries.slice(0, middle)), buildFieldNode(entries.slice(middle))]
  };
}

/** Merge closed intervals without using an area/length tolerance that could conceal holes. */
function coversInterval(intervals: [number, number][], minimum: number, maximum: number): boolean {
  intervals.sort((first, second) => first[0] - second[0]);
  let covered = minimum;
  for (const [left, right] of intervals) {
    if (left > covered) return false;
    covered = Math.max(covered, right);
    if (covered >= maximum) return true;
  }
  return false;
}
