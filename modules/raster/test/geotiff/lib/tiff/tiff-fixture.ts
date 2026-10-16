// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** An authored directory entry for the small synthetic TIFF encoder. */
export type FixtureTag = {tag: number; type: number; values: number[] | bigint[] | string};

/** Builds tiny TIFFs from independently specified values, with padded tiles or final short strips. */
export function createTiffFixture(
  options: {
    bigTiff?: boolean;
    littleEndian?: boolean;
    width?: number;
    height?: number;
    bits?: number[];
    formats?: number[];
    planar?: boolean;
    tileSize?: [number, number];
    rowsPerStrip?: number;
    values?: number[][];
    tags?: FixtureTag[];
  } = {}
) {
  const bigTiff = options.bigTiff ?? false;
  const littleEndian = options.littleEndian ?? true;
  const width = options.width ?? 3;
  const height = options.height ?? 3;
  const bits = options.bits ?? [16];
  const formats = options.formats ?? bits.map(() => 1);
  const bands = bits.length;
  const blockWidth = options.tileSize?.[0] ?? width;
  const blockHeight = options.tileSize?.[1] ?? options.rowsPerStrip ?? 2;
  const columns = Math.ceil(width / blockWidth);
  const rows = Math.ceil(height / blockHeight);
  const values =
    options.values ??
    bits.map((_, band) =>
      Array.from(
        {length: width * height},
        (_value, pixel) =>
          (formats[band] === 2 ? -1 : 1) *
          (band * 32 + pixel + 1 + (formats[band] === 3 ? 0.25 : 0))
      )
    );
  const blocks: {
    offset: number;
    length: number;
    row: number;
    column: number;
    height: number;
    band?: number;
  }[] = [];
  let byteLength = 4096;
  for (const band of options.planar ? bits.map((_, index) => index) : [undefined]) {
    for (let row = 0; row < rows; row++)
      for (let column = 0; column < columns; column++) {
        const storedHeight = options.tileSize
          ? blockHeight
          : Math.min(blockHeight, height - row * blockHeight);
        const bytesPerPixel =
          band === undefined ? bits.reduce((sum, value) => sum + value / 8, 0) : bits[band] / 8;
        const length = blockWidth * storedHeight * bytesPerPixel;
        blocks.push({
          offset: byteLength,
          length,
          row: row * blockHeight,
          column: column * blockWidth,
          height: storedHeight,
          band
        });
        byteLength += length;
      }
  }
  const offsetType = bigTiff ? 16 : 4;
  const tags: FixtureTag[] = [
    {tag: 256, type: 4, values: [width]},
    {tag: 257, type: 4, values: [height]},
    {tag: 258, type: 3, values: bits},
    {tag: 259, type: 3, values: [1]},
    {tag: 262, type: 3, values: [1]},
    {tag: 277, type: 3, values: [bands]},
    {tag: 284, type: 3, values: [options.planar ? 2 : 1]},
    {tag: 339, type: 3, values: formats},
    {
      tag: options.tileSize ? 324 : 273,
      type: offsetType,
      values: blocks.map(block => block.offset)
    },
    {
      tag: options.tileSize ? 325 : 279,
      type: offsetType,
      values: blocks.map(block => block.length)
    },
    ...(options.tileSize
      ? [
          {tag: 322, type: 4, values: [blockWidth]},
          {tag: 323, type: 4, values: [blockHeight]}
        ]
      : [{tag: 278, type: 4, values: [blockHeight]}])
  ];
  for (const tag of options.tags ?? []) {
    const existing = tags.findIndex(entry => entry.tag === tag.tag);
    if (existing >= 0) tags[existing] = tag;
    else tags.push(tag);
  }
  tags.sort((left, right) => left.tag - right.tag);
  const directoryOffset = bigTiff ? 16 : 8;
  const countBytes = bigTiff ? 8 : 2;
  const entryBytes = bigTiff ? 20 : 12;
  const inlineBytes = bigTiff ? 8 : 4;
  const sizes: Record<number, number> = {
    1: 1,
    2: 1,
    3: 2,
    4: 4,
    5: 8,
    6: 1,
    7: 1,
    8: 2,
    9: 4,
    10: 8,
    11: 4,
    12: 8,
    13: 4,
    16: 8,
    17: 8,
    18: 8
  };
  const data = new ArrayBuffer(byteLength);
  const view = new DataView(data);
  const bytes = new Uint8Array(data);
  bytes.set(littleEndian ? [73, 73] : [77, 77]);
  view.setUint16(2, bigTiff ? 43 : 42, littleEndian);
  if (bigTiff) {
    view.setUint16(4, 8, littleEndian);
    view.setBigUint64(8, 16n, littleEndian);
    view.setBigUint64(16, BigInt(tags.length), littleEndian);
  } else {
    view.setUint32(4, 8, littleEndian);
    view.setUint16(8, tags.length, littleEndian);
  }
  const entryOffsets = new Map<number, number>();
  let payloadOffset = directoryOffset + countBytes + tags.length * entryBytes + inlineBytes;
  for (const [index, tag] of tags.entries()) {
    const position = directoryOffset + countBytes + index * entryBytes;
    entryOffsets.set(tag.tag, position);
    const content =
      typeof tag.values === 'string'
        ? Array.from(new TextEncoder().encode(`${tag.values}\0`))
        : tag.values;
    const length = content.length * sizes[tag.type];
    view.setUint16(position, tag.tag, littleEndian);
    view.setUint16(position + 2, tag.type, littleEndian);
    if (bigTiff) view.setBigUint64(position + 4, BigInt(content.length), littleEndian);
    else view.setUint32(position + 4, content.length, littleEndian);
    const valuePosition = position + (bigTiff ? 12 : 8);
    let offset = valuePosition;
    if (length > inlineBytes) {
      payloadOffset = Math.ceil(payloadOffset / 8) * 8;
      offset = payloadOffset;
      if (bigTiff) view.setBigUint64(valuePosition, BigInt(offset), littleEndian);
      else view.setUint32(valuePosition, offset, littleEndian);
      payloadOffset += length;
    }
    if (payloadOffset >= 4096) throw new Error('Synthetic TIFF metadata overlaps sample blocks');
    for (const [valueIndex, value] of content.entries())
      writeFixtureValue(view, offset + valueIndex * sizes[tag.type], tag.type, value, littleEndian);
  }
  for (const block of blocks) {
    let offset = block.offset;
    for (let row = 0; row < block.height; row++)
      for (let column = 0; column < blockWidth; column++) {
        for (const band of block.band === undefined
          ? bits.map((_, index) => index)
          : [block.band]) {
          const imageRow = block.row + row;
          const imageColumn = block.column + column;
          const value =
            imageRow < height && imageColumn < width
              ? values[band][imageRow * width + imageColumn]
              : 99;
          const type =
            formats[band] === 3
              ? bits[band] === 32
                ? 11
                : 12
              : formats[band] === 2
                ? ({8: 6, 16: 8, 32: 9} as Record<number, number>)[bits[band]]
                : ({8: 1, 16: 3, 32: 4} as Record<number, number>)[bits[band]];
          writeFixtureValue(view, offset, type, value, littleEndian);
          offset += bits[band] / 8;
        }
      }
  }
  return {data, values, blocks, entryOffsets, directoryOffset, littleEndian, bigTiff};
}

/** Writes authored scalar values without consulting any production TIFF parser or decoder. */
function writeFixtureValue(
  view: DataView,
  offset: number,
  type: number,
  value: number | bigint,
  littleEndian: boolean
): void {
  switch (type) {
    case 1:
    case 2:
    case 7:
      view.setUint8(offset, Number(value));
      break;
    case 6:
      view.setInt8(offset, Number(value));
      break;
    case 3:
      view.setUint16(offset, Number(value), littleEndian);
      break;
    case 8:
      view.setInt16(offset, Number(value), littleEndian);
      break;
    case 4:
    case 13:
      view.setUint32(offset, Number(value), littleEndian);
      break;
    case 9:
      view.setInt32(offset, Number(value), littleEndian);
      break;
    case 11:
      view.setFloat32(offset, Number(value), littleEndian);
      break;
    case 12:
      view.setFloat64(offset, Number(value), littleEndian);
      break;
    case 16:
    case 18:
      view.setBigUint64(offset, BigInt(value), littleEndian);
      break;
    case 17:
      view.setBigInt64(offset, BigInt(value), littleEndian);
      break;
    case 5:
      view.setUint32(offset, Number(value), littleEndian);
      view.setUint32(offset + 4, 1, littleEndian);
      break;
    case 10:
      view.setInt32(offset, Number(value), littleEndian);
      view.setInt32(offset + 4, 1, littleEndian);
      break;
    default:
      throw new Error('Unsupported authored TIFF field type');
  }
}
