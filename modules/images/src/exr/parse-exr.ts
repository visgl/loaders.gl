// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** One decoded full-resolution OpenEXR channel. */
export type EXRChannel = {
  /** Authored channel name, including any layer prefix. */
  name: string;
  /** Original sample representation. HALF is expanded exactly to float32. */
  pixelType: 'uint' | 'half' | 'float';
  /** Perceptual linearity hint from the channel list. */
  perceptuallyLinear: boolean;
  /** Row-major samples in increasing data-window Y order. */
  data: Uint32Array | Float32Array;
};
/** Single-part scanline OpenEXR data without color conversion or GPU allocation. */
export type EXRImage = {
  /** Data-window width. */
  width: number;
  /** Data-window height. */
  height: number;
  /** Inclusive minimum X/Y and maximum X/Y coordinates. */
  dataWindow: number[];
  /** Inclusive display-window coordinates. */
  displayWindow: number[];
  /** Authored compression method. */
  compression: 'none' | 'rle' | 'zips' | 'zip';
  /** Named channel planes in file order. */
  channels: EXRChannel[];
  /** Raw attribute payloads, retaining chromaticities and other authored metadata. */
  attributes: Record<string, {type: string; data: Uint8Array}>;
};

/** Bounded little-endian reader for EXR headers and scanline records. */
class EXRReader {
  /** Current byte offset. */
  offset = 0;
  /** Source bytes. */
  readonly bytes: Uint8Array;
  /** Source numeric view. */
  readonly view: DataView;
  /** Wraps a complete EXR buffer. */
  constructor(buffer: ArrayBuffer) {
    this.bytes = new Uint8Array(buffer);
    this.view = new DataView(buffer);
  }
  /** Reads a bounded byte span. */
  take(count: number): Uint8Array {
    if (!Number.isSafeInteger(count) || count < 0 || this.offset + count > this.bytes.length)
      throw new Error('EXR: truncated data');
    const result = this.bytes.subarray(this.offset, this.offset + count);
    this.offset += count;
    return result;
  }
  /** Reads a little-endian signed 32-bit integer. */
  integer(): number {
    const offset = this.offset;
    this.take(4);
    return this.view.getInt32(offset, true);
  }
  /** Reads a bounded null-terminated ASCII name. */
  string(): string {
    const start = this.offset;
    while (
      this.offset < this.bytes.length &&
      this.bytes[this.offset] !== 0 &&
      this.offset - start <= 255
    )
      this.offset++;
    if (this.offset >= this.bytes.length || this.offset - start > 255)
      throw new Error('EXR: invalid string');
    const result = new TextDecoder().decode(this.bytes.subarray(start, this.offset));
    this.offset++;
    return result;
  }
}

/** Parses single-part scanline EXR with NONE/RLE/ZIPS/ZIP compression and unit sampling. */
export async function parseEXR(buffer: ArrayBuffer): Promise<EXRImage> {
  const reader = new EXRReader(buffer);
  if (reader.integer() !== 20000630) throw new Error('EXR: invalid magic');
  const version = reader.integer();
  if ((version & 255) !== 2 || (version & ~(255 | 0x400)) !== 0)
    throw new Error('EXR: unsupported version, tiled, multipart or deep image');
  const attributes: EXRImage['attributes'] = Object.create(null);
  while (true) {
    const name = reader.string();
    if (!name) break;
    const type = reader.string();
    const length = reader.integer();
    if (name in attributes) throw new Error('EXR: duplicate attribute');
    attributes[name] = {type, data: reader.take(length).slice()};
  }
  const dataWindow = readWindow(attributes.dataWindow);
  const displayWindow = readWindow(attributes.displayWindow);
  const width = dataWindow[2] - dataWindow[0] + 1,
    height = dataWindow[3] - dataWindow[1] + 1;
  const compressionAttribute = attributes.compression;
  if (compressionAttribute?.type !== 'compression' || compressionAttribute.data.length !== 1)
    throw new Error('EXR: missing compression');
  const compressionIndex = compressionAttribute.data[0];
  if (compressionIndex > 3) throw new Error('EXR: unsupported compression');
  const lineOrder = attributes.lineOrder;
  if (lineOrder?.type !== 'lineOrder' || lineOrder.data.length !== 1 || lineOrder.data[0] > 2)
    throw new Error('EXR: invalid lineOrder');
  if (attributes.type && new TextDecoder().decode(attributes.type.data) !== 'scanlineimage')
    throw new Error('EXR: unsupported part type');
  const channelAttribute = attributes.channels;
  if (channelAttribute?.type !== 'chlist') throw new Error('EXR: missing channel list');
  const channelReader = new EXRReader(channelAttribute.data.slice().buffer);
  const channels: EXRChannel[] = [];
  while (true) {
    const name = channelReader.string();
    if (!name) break;
    const type = channelReader.integer();
    const linear = channelReader.take(4)[0];
    const samplingX = channelReader.integer(),
      samplingY = channelReader.integer();
    if (
      type < 0 ||
      type > 2 ||
      samplingX !== 1 ||
      samplingY !== 1 ||
      linear > 1 ||
      channels.some(channel => channel.name === name)
    )
      throw new Error('EXR: unsupported or invalid channel');
    if (
      !Number.isSafeInteger(width * height) ||
      width * height < 1 ||
      width * height > 64 * 1024 * 1024
    )
      throw new Error('EXR: image exceeds size limit');
    if ((channels.length + 1) * width * height * 4 > 256 * 1024 * 1024)
      throw new Error('EXR: channels exceed 256 MiB limit');
    channels.push({
      name,
      pixelType: (['uint', 'half', 'float'] as const)[type],
      perceptuallyLinear: Boolean(linear),
      data: type === 0 ? new Uint32Array(width * height) : new Float32Array(width * height)
    });
  }
  if (!channels.length || channelReader.offset !== channelReader.bytes.length)
    throw new Error('EXR: invalid channel list length');
  const scanlineBytes =
    width * channels.reduce((sum, channel) => sum + (channel.pixelType === 'half' ? 2 : 4), 0);
  const linesPerChunk = compressionIndex === 3 ? 16 : 1;
  const chunkCount = Math.ceil(height / linesPerChunk);
  const offsets: number[] = [];
  for (let chunk = 0; chunk < chunkCount; chunk++) {
    const offset = reader.offset;
    reader.take(8);
    const value = reader.view.getBigUint64(offset, true);
    if (value > BigInt(buffer.byteLength - 8)) throw new Error('EXR: invalid chunk offset');
    offsets.push(Number(value));
  }
  const firstChunkOffset = reader.offset;
  const seen = new Uint8Array(height);
  for (const offset of offsets) {
    if (offset < firstChunkOffset) throw new Error('EXR: chunk overlaps header');
    reader.offset = offset;
    const y = reader.integer();
    const storedSize = reader.integer();
    const row = y - dataWindow[1];
    if (row < 0 || row >= height || row % linesPerChunk !== 0)
      throw new Error('EXR: invalid scanline index');
    const rowCount = Math.min(linesPerChunk, height - row);
    const expected = rowCount * scanlineBytes;
    const stored = reader.take(storedSize);
    let decoded = stored;
    if (storedSize !== expected) {
      if (compressionIndex === 0) throw new Error('EXR: uncompressed size mismatch');
      const transformed =
        compressionIndex === 1 ? decodeRLE(stored, expected) : await inflate(stored, expected);
      decoded = undoPredictor(transformed);
    }
    if (decoded.length !== expected) throw new Error('EXR: decoded size mismatch');
    const view = new DataView(decoded.buffer, decoded.byteOffset, decoded.byteLength);
    let cursor = 0;
    for (let localRow = 0; localRow < rowCount; localRow++) {
      if (seen[row + localRow]) throw new Error('EXR: duplicate scanline');
      seen[row + localRow] = 1;
      for (const channel of channels) {
        for (let column = 0; column < width; column++) {
          const value =
            channel.pixelType === 'uint'
              ? view.getUint32(cursor, true)
              : channel.pixelType === 'float'
                ? view.getFloat32(cursor, true)
                : decodeHalf(view.getUint16(cursor, true));
          channel.data[(row + localRow) * width + column] = value;
          cursor += channel.pixelType === 'half' ? 2 : 4;
        }
      }
    }
  }
  if (seen.some(value => value !== 1)) throw new Error('EXR: missing scanline');
  return {
    width,
    height,
    dataWindow,
    displayWindow,
    channels,
    attributes,
    compression: (['none', 'rle', 'zips', 'zip'] as const)[compressionIndex]
  };
}

/** Reads a required inclusive integer window. */
function readWindow(attribute: EXRImage['attributes'][string] | undefined): number[] {
  if (attribute?.type !== 'box2i' || attribute.data.length !== 16)
    throw new Error('EXR: missing or invalid window');
  const view = new DataView(attribute.data.buffer, attribute.data.byteOffset, 16);
  const values = [0, 4, 8, 12].map(offset => view.getInt32(offset, true));
  if (values[2] < values[0] || values[3] < values[1]) throw new Error('EXR: inverted window');
  return values;
}

/** Expands IEEE binary16 to a JavaScript number without clamping HDR values. */
function decodeHalf(bits: number): number {
  const sign = bits & 0x8000 ? -1 : 1,
    exponent = (bits >>> 10) & 31,
    fraction = bits & 1023;
  if (exponent === 31) return fraction ? NaN : sign * Infinity;
  return (
    sign * (exponent === 0 ? fraction * 2 ** -24 : (1 + fraction / 1024) * 2 ** (exponent - 15))
  );
}

/** Expands EXR signed-count RLE into an exactly bounded byte buffer. */
function decodeRLE(bytes: Uint8Array, length: number): Uint8Array {
  const result = new Uint8Array(length);
  let source = 0,
    target = 0;
  while (source < bytes.length) {
    const count = (bytes[source++] << 24) >> 24;
    const size = count < 0 ? -count : count + 1;
    if (target + size > length) throw new Error('EXR: RLE exceeds decoded size');
    if (count < 0) {
      if (source + size > bytes.length) throw new Error('EXR: truncated RLE literals');
      result.set(bytes.subarray(source, source + size), target);
      source += size;
    } else {
      if (source >= bytes.length) throw new Error('EXR: truncated RLE run');
      result.fill(bytes[source++], target, target + size);
    }
    target += size;
  }
  if (target !== length) throw new Error('EXR: RLE size mismatch');
  return result;
}

/** Reverses EXR byte prediction and even/odd byte separation. */
function undoPredictor(bytes: Uint8Array): Uint8Array {
  for (let index = 1; index < bytes.length; index++)
    bytes[index] = (bytes[index - 1] + bytes[index] - 128) & 255;
  const result = new Uint8Array(bytes.length);
  let first = 0,
    second = Math.ceil(bytes.length / 2);
  for (let index = 0; index < result.length; index++)
    result[index] = bytes[index % 2 === 0 ? first++ : second++];
  return result;
}

/** Uses the native zlib decoder with an exact decoded-length bound. */
async function inflate(bytes: Uint8Array, length: number): Promise<Uint8Array> {
  const copy = new Uint8Array(bytes);
  const reader = new Blob([copy])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'))
    .getReader();
  const output = new Uint8Array(length);
  let offset = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      if (offset + value.length > length) throw new Error('EXR: ZIP exceeds decoded size');
      output.set(value, offset);
      offset += value.length;
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  if (offset !== length) throw new Error('EXR: ZIP size mismatch');
  return output;
}
