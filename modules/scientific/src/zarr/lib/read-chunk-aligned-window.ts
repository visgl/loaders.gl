// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as zarrita from 'zarrita';
import type {SupportedTypedArray} from '../types';
import {getCachedZarrSelection, getZarrSelectionKey} from './zarr-data-cache';

/** Inclusive start and exclusive stop coordinates for a pixel window. */
export type PixelWindow = {
  /** First included column. */
  columnStart: number;
  /** First excluded column. */
  columnStop: number;
  /** First included row. */
  rowStart: number;
  /** First excluded row. */
  rowStop: number;
};

/** Typed result of selecting a 2D plane from the array. */
type RasterSelection = {
  /** Selected values in Zarrita's native order. */
  data: SupportedTypedArray;
  /** Length of each selected axis. */
  shape: number[];
  /** Distance between consecutive samples along each selected axis. */
  stride: number[];
};

/** Assembled window and the storage order of its spatial axes. */
type ChunkAlignedWindow = {
  /** Contiguous window samples. */
  data: SupportedTypedArray;
  /** Whether samples along each column are contiguous. */
  columnMajor: boolean;
};

/** Asks Zarrita for the selection's layout without scheduling any chunk reads. */
const LAYOUT_ONLY: zarrita.GetOptions = {
  /** Supplies a queue that discards the chunk read tasks. */
  createQueue: () => ({
    /** Skips a read task. */
    add() {},
    /** Resolves immediately because no tasks run. */
    onIdle: async () => []
  })
};

/** Assembles a native-resolution window from reusable, spatially chunk-aligned selections. */
export async function readChunkAlignedWindow(
  array: zarrita.Array<zarrita.DataType, zarrita.Readable>,
  window: PixelWindow,
  yDimension: number,
  xDimension: number,
  indices: number[],
  maxConcurrentRequests: number,
  signal?: AbortSignal
): Promise<ChunkAlignedWindow> {
  signal?.throwIfAborted();
  // Two elements per axis suffice to distinguish the projected axis order.
  const template = await readSelection(
    indices.map((index, dimension) =>
      dimension === yDimension || dimension === xDimension ? zarrita.slice(0, 2) : index
    ),
    LAYOUT_ONLY
  );
  signal?.throwIfAborted();
  const innerDimension =
    template.stride[0] === 1 ? Math.min(yDimension, xDimension) : Math.max(yDimension, xDimension);
  const outerDimension = innerDimension === xDimension ? yDimension : xDimension;
  const {rowStart, rowStop, columnStart, columnStop} = window;
  const [outerStart, outerStop, innerStart, innerStop] =
    innerDimension === xDimension
      ? [rowStart, rowStop, columnStart, columnStop]
      : [columnStart, columnStop, rowStart, rowStop];
  const outerChunkSize = array.chunks[outerDimension];
  const innerChunkSize = array.chunks[innerDimension];
  const innerLength = innerStop - innerStart;
  const TypedArrayConstructor = template.data.constructor as new (
    length: number
  ) => SupportedTypedArray;
  const output = new TypedArrayConstructor((outerStop - outerStart) * innerLength);

  const firstOuter = Math.floor(outerStart / outerChunkSize) * outerChunkSize;
  const firstInner = Math.floor(innerStart / innerChunkSize) * innerChunkSize;
  const innerChunkCount = Math.ceil((innerStop - firstInner) / innerChunkSize);
  const chunkCount = Math.ceil((outerStop - firstOuter) / outerChunkSize) * innerChunkCount;
  let nextChunk = 0;
  let failed = false;
  // Zarrita allocates each selection before its store read can enter the request limiter.
  await Promise.all(Array.from({length: Math.min(maxConcurrentRequests, chunkCount)}, copyChunks));
  return {data: output, columnMajor: innerDimension === yDimension};

  /** Claims the next chunk as soon as this worker finishes copying its current chunk. */
  async function copyChunks(): Promise<void> {
    try {
      while (!failed && nextChunk < chunkCount) {
        signal?.throwIfAborted();
        const chunkIndex = nextChunk++;
        const outer = firstOuter + Math.floor(chunkIndex / innerChunkCount) * outerChunkSize;
        const inner = firstInner + (chunkIndex % innerChunkCount) * innerChunkSize;
        await copyChunk(outer, inner);
      }
    } catch (error) {
      failed = true;
      throw error;
    }
  }

  /** Reads the entire in-bounds chunk plane and copies only its overlap with the window. */
  async function copyChunk(outer: number, inner: number): Promise<void> {
    const outerEnd = Math.min(outer + outerChunkSize, array.shape[outerDimension]);
    const innerEnd = Math.min(inner + innerChunkSize, array.shape[innerDimension]);
    const selection = [...indices] as (number | zarrita.Slice)[];
    selection[outerDimension] = zarrita.slice(outer, outerEnd);
    selection[innerDimension] = zarrita.slice(inner, innerEnd);
    const {data} = await getCachedZarrSelection(
      array,
      getZarrSelectionKey(selection),
      () => readSelection(selection),
      signal
    );

    const copyStart = Math.max(inner, innerStart);
    const copyLength = Math.min(innerEnd, innerStop) - copyStart;
    for (let index = Math.max(outer, outerStart); index < Math.min(outerEnd, outerStop); index++) {
      const sourceOffset = (index - outer) * (innerEnd - inner) + copyStart - inner;
      const targetOffset = (index - outerStart) * innerLength + copyStart - innerStart;
      output.set(data.subarray(sourceOffset, sourceOffset + copyLength), targetOffset);
    }
  }

  /** Reads a 2D selection in the array's native layout, including Zarrita's fill handling. */
  async function readSelection(
    selection: (number | zarrita.Slice)[],
    options?: zarrita.GetOptions
  ): Promise<RasterSelection> {
    const result = await zarrita.get(array, selection, options);
    if (!result || typeof result !== 'object' || !('data' in result) || !('stride' in result)) {
      throw new Error('Failed to read GeoZarr raster selection.');
    }
    return result as RasterSelection;
  }
}
