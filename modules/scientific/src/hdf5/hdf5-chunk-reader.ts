// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {HDF5ByteSource} from './hdf5-binary';
import {decodeHDF5Filters, type HDF5Filter} from './hdf5-filters';
import {decodeHDF5Primitive, type HDF5Primitive} from './hdf5-dataset-messages';

/** Storage index entry, populated by a format-specific HDF5 chunk-index decoder. */
export type HDF5ChunkEntry = {
  /** Logical element offset in each dimension (not byte offset). */
  origin: readonly number[];
  /** Absolute byte address of the compressed chunk. */
  address: bigint;
  /** Number of stored bytes before decompression. */
  storedByteLength: number;
  /** Bit mask of filters skipped for this chunk. */
  filterMask: number;
};
/** Resolved metadata needed to read a numeric chunked dataset. */
export type HDF5ChunkedDataset = {
  /** Dataset shape in elements. */
  shape: readonly number[];
  /** Shape of each chunk in elements. */
  chunkShape: readonly number[];
  /** Primitive numeric datatype. */
  type: HDF5Primitive;
  /** Filters applied during storage. */
  filters: readonly HDF5Filter[];
  /** Located chunk entries. */
  chunks: readonly HDF5ChunkEntry[];
  /** Value of unallocated chunks; required when the selection includes sparse chunks. */
  fillValue?: number | bigint;
};
/** Number of chunks and bytes fetched for a selection. */
export type HDF5ChunkReadStats = {chunksFetched: number; bytesFetched: number};
/** Half-open bounds for each dataset dimension. */
export type HDF5ChunkSelection = readonly (readonly [number, number])[];

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('HDF5: ' + message);
}
function product(shape: readonly number[]): number {
  let total = 1;
  for (const size of shape) {
    check(
      Number.isSafeInteger(size) && size > 0 && total <= 100_000_000 / size,
      'invalid or oversized chunk/selection shape'
    );
    total *= size;
  }
  return total;
}
function safeAddress(value: bigint): number {
  check(value >= 0n && value <= BigInt(Number.MAX_SAFE_INTEGER), 'unsafe chunk address');
  return Number(value);
}
function intersection(
  entry: HDF5ChunkEntry,
  chunkShape: readonly number[],
  ranges: HDF5ChunkSelection
): [number, number][] | null {
  const result: [number, number][] = [];
  for (let axis = 0; axis < ranges.length; axis++) {
    const start = Math.max(entry.origin[axis], ranges[axis][0]);
    const end = Math.min(entry.origin[axis] + chunkShape[axis], ranges[axis][1]);
    if (end <= start) return null;
    result.push([start, end]);
  }
  return result;
}
function linear(coordinates: readonly number[], shape: readonly number[]): number {
  let index = 0;
  for (let i = 0; i < shape.length; i++) index = index * shape[i] + coordinates[i];
  return index;
}
async function inflateDeflate(bytes: Uint8Array): Promise<Uint8Array> {
  check(typeof DecompressionStream !== 'undefined', 'deflate requires DecompressionStream');
  const stream = new Blob([Uint8Array.from(bytes)])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
/**
 * Read a hyperslab using a resolved chunk index. Fetches only intersecting chunks.
 * Does not interpret HDF5 B-trees or filter metadata; callers must supply verified entries.
 */
export async function readHDF5ChunkSelection(
  source: HDF5ByteSource,
  dataset: HDF5ChunkedDataset,
  ranges: HDF5ChunkSelection,
  options: {signal?: AbortSignal; inflate?: (bytes: Uint8Array) => Promise<Uint8Array>} = {}
): Promise<{data: ArrayBufferView; shape: number[]; stats: HDF5ChunkReadStats}> {
  const {shape, chunkShape, type} = dataset;
  check(
    shape.length > 0 && shape.length === chunkShape.length && ranges.length === shape.length,
    'chunk rank mismatch'
  );
  const outputShape = shape.map((size, axis) => {
    const [start, end] = ranges[axis];
    check(
      Number.isSafeInteger(start) &&
        Number.isSafeInteger(end) &&
        start >= 0 &&
        end <= size &&
        start < end,
      'invalid hyperslab range'
    );
    check(Number.isSafeInteger(chunkShape[axis]) && chunkShape[axis] > 0, 'invalid chunk extent');
    return end - start;
  });
  const outputCount = product(outputShape);
  const chunkCount = product(chunkShape);
  const Constructor = (
    {
      'integer:1:true': Int8Array,
      'integer:1:false': Uint8Array,
      'integer:2:true': Int16Array,
      'integer:2:false': Uint16Array,
      'integer:4:true': Int32Array,
      'integer:4:false': Uint32Array,
      'integer:8:true': BigInt64Array,
      'integer:8:false': BigUint64Array,
      'float:4:true': Float32Array,
      'float:4:false': Float32Array,
      'float:8:true': Float64Array,
      'float:8:false': Float64Array
    } as Record<string, any>
  )[type.kind + ':' + type.size + ':' + type.signed];
  check(Constructor, 'unsupported primitive output type');
  const output = new Constructor(outputCount);
  if (dataset.fillValue !== undefined) output.fill(dataset.fillValue);
  const visited = new Set<string>();
  const filled = new Uint8Array(outputCount);
  let chunksFetched = 0,
    bytesFetched = 0;
  for (const entry of dataset.chunks) {
    check(
      entry.origin.length === shape.length &&
        entry.origin.every(
          (n, axis) =>
            Number.isSafeInteger(n) && n >= 0 && n < shape[axis] && n % chunkShape[axis] === 0
        ),
      'invalid or unaligned chunk origin'
    );
    const key = entry.origin.join(',');
    check(!visited.has(key), 'duplicate chunk origin');
    visited.add(key);
    const overlap = intersection(entry, chunkShape, ranges);
    if (!overlap) continue;
    check(
      Number.isSafeInteger(entry.storedByteLength) &&
        entry.storedByteLength > 0 &&
        entry.storedByteLength <= 512 * 1024 * 1024,
      'invalid stored chunk size'
    );
    const bytes = await source.read(
      safeAddress(entry.address),
      entry.storedByteLength,
      options.signal
    );
    check(bytes.length === entry.storedByteLength, 'truncated chunk');
    chunksFetched++;
    bytesFetched += bytes.length;
    const decoded = await decodeHDF5Filters(
      bytes,
      dataset.filters,
      entry.filterMask,
      options.inflate ?? inflateDeflate
    );
    check(decoded.length === chunkCount * type.size, 'decoded chunk length mismatch');
    const values = decodeHDF5Primitive(decoded, type) as any;
    const coordinate = overlap.map(([start]) => start);
    while (true) {
      const src = linear(
        coordinate.map((n, i) => n - entry.origin[i]),
        chunkShape
      );
      const dst = linear(
        coordinate.map((n, i) => n - ranges[i][0]),
        outputShape
      );
      output[dst] = values[src];
      filled[dst] = 1;
      let axis = coordinate.length - 1;
      while (axis >= 0) {
        coordinate[axis]++;
        if (coordinate[axis] < overlap[axis][1]) break;
        coordinate[axis] = overlap[axis][0];
        axis--;
      }
      if (axis < 0) break;
    }
  }
  if (dataset.fillValue === undefined && filled.some(value => value === 0)) {
    throw new Error('HDF5: unallocated chunks without an explicit fill policy');
  }
  return {data: output, shape: outputShape, stats: {chunksFetched, bytesFetched}};
}
