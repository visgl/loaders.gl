// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TiffBlock, TiffDirectory} from './tiff-types';
import {checkTiffRange} from './read-tiff-directory';

/** Reads numeric tag values, rejecting lossy conversions when an integer drives addressing. */
export function getTiffNumbers(
  directory: TiffDirectory,
  tag: number,
  defaults: readonly number[] = []
): number[] {
  const values = directory.tags.get(tag);
  if (values === undefined) return [...defaults];
  if (typeof values === 'string') throw new Error(`Invalid numeric TIFF tag ${tag}`);
  return values.map(value => {
    const number = Number(value);
    if (typeof value === 'bigint' && (!Number.isSafeInteger(number) || BigInt(number) !== value)) {
      throw new Error('TIFF integer tag exceeds safe precision');
    }
    return number;
  });
}

/** Requires one positive integer for dimensions and block geometry. */
export function getTiffDimension(
  directory: TiffDirectory,
  tag: number,
  defaultValue?: number
): number {
  const values = getTiffNumbers(directory, tag, defaultValue === undefined ? [] : [defaultValue]);
  if (
    values.length !== 1 ||
    !Number.isSafeInteger(values[0]) ||
    values[0] <= 0 ||
    (tag === 277 && values[0] > 65535)
  ) {
    throw new Error(`Invalid TIFF dimension tag ${tag}`);
  }
  return values[0];
}

/** Validates selected original bands without changing their order. */
export function selectTiffBands(bands: readonly number[] | undefined, bandCount: number): number[] {
  const selected =
    bands === undefined ? Array.from({length: bandCount}, (_, index) => index) : [...bands];
  if (
    !selected.length ||
    new Set(selected).size !== selected.length ||
    !selected.every(band => Number.isSafeInteger(band) && band >= 0 && band < bandCount)
  ) {
    throw new Error('Invalid TIFF band selection');
  }
  return selected;
}

/** Plans only intersecting blocks, retaining physical edge-tile strides and planar band identities. */
export function planTiffBlocks(
  directory: TiffDirectory,
  fileLength: number,
  window: readonly number[],
  bands?: readonly number[]
): TiffBlock[] {
  const imageWidth = getTiffDimension(directory, 256);
  const imageHeight = getTiffDimension(directory, 257);
  const bandCount = getTiffDimension(directory, 277, 1);
  const selectedBands = selectTiffBands(bands, bandCount);
  if (
    window.length !== 4 ||
    !window.every(value => Number.isSafeInteger(value) && value >= 0) ||
    window[0] >= window[2] ||
    window[1] >= window[3] ||
    window[2] > imageWidth ||
    window[3] > imageHeight
  ) {
    throw new Error('Invalid TIFF native window');
  }
  const planarConfiguration = getTiffDimension(directory, 284, 1);
  if (planarConfiguration !== 1 && planarConfiguration !== 2)
    throw new Error('Invalid TIFF planar configuration');
  const tiled = directory.tags.has(324);
  if (tiled && (directory.tags.has(273) || directory.tags.has(279)))
    throw new Error('Conflicting TIFF tile and strip storage');
  const blockWidth = tiled ? getTiffDimension(directory, 322) : imageWidth;
  const blockHeight = tiled
    ? getTiffDimension(directory, 323)
    : getTiffDimension(directory, 278, imageHeight);
  const columns = Math.ceil(imageWidth / blockWidth);
  const rows = Math.ceil(imageHeight / blockHeight);
  const blocksPerBand = columns * rows;
  const expectedBlocks = blocksPerBand * (planarConfiguration === 2 ? bandCount : 1);
  if (!Number.isSafeInteger(expectedBlocks)) throw new Error('Unsafe TIFF block count');
  const offsets = getTiffNumbers(directory, tiled ? 324 : 273);
  const lengths = getTiffNumbers(directory, tiled ? 325 : 279);
  if (offsets.length !== expectedBlocks || lengths.length !== expectedBlocks)
    throw new Error('Invalid TIFF block table lengths');
  // Validate all descriptors, including unselected blocks; a selected read must not hide malformed metadata.
  offsets.forEach((offset, index) => {
    if (lengths[index] <= 0) throw new Error('Invalid TIFF block byte count');
    checkTiffRange(offset, lengths[index], fileLength);
  });
  const blocks: TiffBlock[] = [];
  for (const band of planarConfiguration === 2 ? selectedBands : [undefined]) {
    for (
      let rowIndex = Math.floor(window[1] / blockHeight);
      rowIndex < Math.ceil(window[3] / blockHeight);
      rowIndex++
    ) {
      for (
        let columnIndex = Math.floor(window[0] / blockWidth);
        columnIndex < Math.ceil(window[2] / blockWidth);
        columnIndex++
      ) {
        const index = (band ?? 0) * blocksPerBand + rowIndex * columns + columnIndex;
        const row = rowIndex * blockHeight;
        blocks.push({
          offset: offsets[index],
          byteLength: lengths[index],
          column: columnIndex * blockWidth,
          row,
          width: blockWidth,
          height: tiled ? blockHeight : Math.min(blockHeight, imageHeight - row),
          band
        });
      }
    }
  }
  return blocks;
}
