// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as zarrita from 'zarrita';
import type {Readable} from 'zarrita';
import type {
  RasterSelection,
  PixelData,
  PixelSourceSelection,
  TileSelection,
  Labels,
  SupportedTypedArray
} from '../types';
import {getIndexer} from './utils';
import {getCachedZarrSelection, getZarrSelectionKey} from './zarr-data-cache';

type ZarritaIndexer<S extends string[]> = (sel: {[K in S[number]]: number} | number[]) => number[];

/**
 * Pixel source backed by a zarrita array.
 */
export default class ZarritaPixelSource<S extends string[]> {
  /** Dimension labels for the backing array. */
  public readonly labels: Labels<S>;
  /** Square power-of-two tile size used by legacy tile consumers. */
  public readonly tileSize: number;
  /** Native chunk width. */
  public readonly tileWidth: number;
  /** Native chunk height. */
  public readonly tileHeight: number;
  /** Backing Zarrita array. */
  private readonly data: zarrita.Array<zarrita.DataType, Readable>;
  /** Converts named selections to positional Zarrita selections. */
  private readonly indexer: ZarritaIndexer<S>;

  /** Creates a pixel source for one Zarr pyramid level. */
  constructor(data: zarrita.Array<zarrita.DataType, Readable>, labels: Labels<S>, tileSize: number) {
    this.indexer = getIndexer(labels);
    this.data = data;
    this.labels = labels;
    this.tileSize = tileSize;
    const interleaved = labels[labels.length - 1] === '_c';
    [this.tileHeight, this.tileWidth] = data.chunks.slice(interleaved ? -3 : -2);
  }

  /** Array dimensions. */
  get shape() {
    return this.data.shape;
  }

  /** Chunk dimensions. */
  get chunks() {
    return this.data.chunks;
  }

  /** Zarrita dtype identifier. */
  get dtype() {
    return this.data.dtype;
  }

  /** Positional index of the x dimension. */
  private get xIndex() {
    const interleaved = this.labels[this.labels.length - 1] === '_c';
    return this.data.shape.length - (interleaved ? 2 : 1);
  }

  /** Inserts x and y selectors into a named or positional selection. */
  private chunkIndex<T>(selection: PixelSourceSelection<S> | number[], x: T, y: T) {
    const sel: (number | T)[] = this.indexer(selection);
    sel[this.xIndex] = x;
    sel[this.xIndex - 1] = y;
    return sel;
  }

  /** Reads a complete 2D plane from the backing array. */
  async getRaster({selection, signal}: RasterSelection<S> | {selection: number[]; signal?: AbortSignal}) {
    const sel = this.chunkIndex(selection, null, null) as Array<number | null>;
    const chunk = await getCachedZarrSelection(this.data, getZarrSelectionKey(sel), () =>
      zarrita.get(this.data, sel, {signal}) as Promise<{data: SupportedTypedArray; shape: number[]}>
    );
    if (!chunk || typeof chunk !== 'object' || !('data' in chunk) || !('shape' in chunk)) {
      throw new Error('Failed to read Zarr raster selection.');
    }

    const shape = chunk.shape as number[];
    const interleaved = this.labels[this.labels.length - 1] === '_c';
    const [height, width] = shape.slice(interleaved ? -3 : -2);
    return {data: chunk.data, width, height} as PixelData;
  }

  /** Reads one square tile from the backing array. */
  async getTile({x, y, selection, signal}: TileSelection<S>) {
    const interleaved = this.labels[this.labels.length - 1] === '_c';
    const [height, width] = this.data.shape.slice(interleaved ? -3 : -2);
    const xStart = x * this.tileSize;
    const xStop = Math.min((x + 1) * this.tileSize, width);
    const yStart = y * this.tileSize;
    const yStop = Math.min((y + 1) * this.tileSize, height);

    if (xStart === xStop || yStart === yStop) {
      throw new Error('Tile slice is zero-sized.');
    }

    const sel = this.chunkIndex(
      selection,
      zarrita.slice(xStart, xStop),
      zarrita.slice(yStart, yStop)
    ) as Array<number | zarrita.Slice>;
    const chunk = await getCachedZarrSelection(this.data, getZarrSelectionKey(sel), () =>
      zarrita.get(this.data, sel, {signal}) as Promise<{data: SupportedTypedArray; shape: number[]}>
    );
    if (!chunk || typeof chunk !== 'object' || !('data' in chunk) || !('shape' in chunk)) {
      throw new Error('Failed to read Zarr tile selection.');
    }

    const shape = chunk.shape as number[];
    const [tileHeight, tileWidth] = shape.slice(interleaved ? -3 : -2);
    return {data: chunk.data, width: tileWidth, height: tileHeight} as PixelData;
  }
}
