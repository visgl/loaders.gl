// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as zarrita from 'zarrita';
import type {Readable} from 'zarrita';
import type {RasterSelection, PixelData, PixelSourceSelection, TileSelection, Labels} from '../types';
import {isInterleaved, getIndexer} from './utils';

type ZarritaIndexer<S extends string[]> = (sel: {[K in S[number]]: number} | number[]) => number[];

/**
 * Pixel source backed by a zarrita array.
 */
export default class ZarritaPixelSource<S extends string[]> {
  public labels: Labels<S>;
  public tileSize: number;
  private readonly data: zarrita.Array<zarrita.DataType, Readable>;
  private readonly indexer: ZarritaIndexer<S>;

  constructor(data: zarrita.Array<zarrita.DataType, Readable>, labels: Labels<S>, tileSize: number) {
    this.indexer = getIndexer(labels);
    this.data = data;
    this.labels = labels;
    this.tileSize = tileSize;
  }

  get shape() {
    return this.data.shape;
  }

  get chunks() {
    return this.data.chunks;
  }

  get dtype() {
    return this.data.dtype;
  }

  private get xIndex() {
    const interleaved = isInterleaved(this.data.shape);
    return this.data.shape.length - (interleaved ? 2 : 1);
  }

  private chunkIndex<T>(selection: PixelSourceSelection<S> | number[], x: T, y: T) {
    const sel: (number | T)[] = this.indexer(selection);
    sel[this.xIndex] = x;
    sel[this.xIndex - 1] = y;
    return sel;
  }

  async getRaster({selection, signal}: RasterSelection<S> | {selection: number[]; signal?: AbortSignal}) {
    const sel = this.chunkIndex(selection, null, null) as Array<number | null>;
    const chunk = await zarrita.get(this.data, sel, {signal});
    if (!chunk || typeof chunk !== 'object' || !('data' in chunk) || !('shape' in chunk)) {
      throw new Error('Failed to read Zarr raster selection.');
    }

    const shape = chunk.shape as number[];
    const interleaved = isInterleaved(shape);
    const [height, width] = shape.slice(interleaved ? -3 : -2);
    return {data: chunk.data, width, height} as PixelData;
  }

  async getTile({x, y, selection, signal}: TileSelection<S>) {
    const interleaved = isInterleaved(this.data.shape);
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
    const chunk = await zarrita.get(this.data, sel, {signal});
    if (!chunk || typeof chunk !== 'object' || !('data' in chunk) || !('shape' in chunk)) {
      throw new Error('Failed to read Zarr tile selection.');
    }

    const shape = chunk.shape as number[];
    const [tileHeight, tileWidth] = shape.slice(interleaved ? -3 : -2);
    return {data: chunk.data, width: tileWidth, height: tileHeight} as PixelData;
  }
}
