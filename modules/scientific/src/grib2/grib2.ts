// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ScientificArraySource,
  ScientificArray,
  ScientificDatasetMetadata,
  ScientificSelection,
  ScientificSourceCapabilities
} from '../scientific-array';

/** Initial GRIB2 scope: edition 2, regular lat/lon grid template 3.0, simple packing 5.0. */
export type GRIB2Message = {
  /** Discipline code from the indicator section. */
  discipline: number;
  /** Parameter category code. */
  category: number;
  /** Parameter number within the category. */
  parameter: number;
  /** Forecast time encoded by product template 4.0. */
  forecastTime: number;
  /** Grid dimensions and original scanning-mode flags. */
  grid: {width: number; height: number; scanningMode: number};
  /** Decoded values in encoded scanning order, with NaN for missing cells. */
  values: Float32Array;
};

/** Require a valid GRIB2 condition and report a format-specific error. */
function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('GRIB2: ' + message);
}
/** Read an unsigned packed value at an arbitrary bit offset. */
function bits(data: Uint8Array, offset: number, count: number): number {
  let value = 0;
  for (let i = 0; i < count; i++) {
    const bit = offset + i;
    check(bit < data.length * 8, 'packed data truncated');
    value = value * 2 + ((data[bit >>> 3] >>> (7 - (bit & 7))) & 1);
  }
  return value;
}
/** Decode a GRIB2 signed-magnitude scale factor. */
function signedMagnitude(view: DataView, offset: number, bytes: 2 | 4): number {
  const raw = bytes === 2 ? view.getUint16(offset) : view.getUint32(offset);
  const sign = bytes === 2 ? 0x8000 : 0x80000000;
  return raw & sign ? -(raw & (sign - 1)) : raw;
}
/** Decode all messages in a GRIB2 byte stream; reject unsupported templates explicitly. */
export function parseGRIB2(input: ArrayBuffer | Uint8Array): GRIB2Message[] {
  const data = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const result: GRIB2Message[] = [];
  let cursor = 0;
  while (cursor < data.length) {
    check(cursor + 16 <= data.length, 'incomplete indicator section');
    check(
      String.fromCharCode(...data.subarray(cursor, cursor + 4)) === 'GRIB',
      'invalid signature'
    );
    check(data[cursor + 7] === 2, 'only edition 2 is supported');
    const length = Number(view.getBigUint64(cursor + 8));
    check(
      Number.isSafeInteger(length) && length >= 20 && cursor + length <= data.length,
      'invalid message length'
    );
    const end = cursor + length;
    check(String.fromCharCode(...data.subarray(end - 4, end)) === '7777', 'missing end marker');
    const discipline = data[cursor + 6];
    let offset = cursor + 16;
    let width = 0,
      height = 0,
      scanningMode = 0;
    let count = 0,
      reference = 0,
      binaryScale = 0,
      decimalScale = 0,
      bitWidth = 0;
    let category = -1,
      parameter = -1,
      forecastTime = 0;
    let bitmap: Uint8Array | null = null;
    let values: Float32Array | null = null;
    let lastSection = 0;
    while (offset < end - 4) {
      check(offset + 5 <= end - 4, 'truncated section header');
      const size = view.getUint32(offset);
      const section = data[offset + 4];
      check(size >= 5 && offset + size <= end - 4, 'invalid section length');
      check(section >= 1 && section <= 7, 'invalid section number');
      check(
        section >= lastSection || (lastSection === 7 && section === 3),
        'out-of-order sections'
      );
      lastSection = section;
      if (section === 3) {
        check(size >= 72, 'grid definition too short');
        check(view.getUint16(offset + 12) === 0, 'only grid template 3.0 supported');
        width = view.getUint32(offset + 30);
        height = view.getUint32(offset + 34);
        scanningMode = data[offset + 71];
        check(width > 0 && height > 0 && width * height <= 50_000_000, 'invalid grid dimensions');
        check(view.getUint32(offset + 6) === width * height, 'grid point count mismatch');
      } else if (section === 4) {
        check(size >= 34, 'product definition too short');
        check(view.getUint16(offset + 7) === 0, 'only product template 4.0 supported');
        category = data[offset + 9];
        parameter = data[offset + 10];
        forecastTime = view.getUint32(offset + 18);
      } else if (section === 5) {
        check(size >= 21, 'representation section too short');
        count = view.getUint32(offset + 5);
        check(view.getUint16(offset + 9) === 0, 'only simple packing template 5.0 supported');
        reference = view.getFloat32(offset + 11);
        binaryScale = signedMagnitude(view, offset + 15, 2);
        decimalScale = signedMagnitude(view, offset + 17, 2);
        bitWidth = data[offset + 19];
        check(bitWidth <= 32 && Number.isFinite(reference), 'invalid simple packing parameters');
      } else if (section === 6) {
        const indicator = data[offset + 5];
        check(indicator === 255 || indicator === 0, 'unsupported bitmap indicator');
        bitmap = indicator === 0 ? data.subarray(offset + 6, offset + size) : null;
        if (bitmap) check(bitmap.length * 8 >= width * height, 'bitmap truncated');
      } else if (section === 7) {
        check(width > 0 && height > 0 && category >= 0, 'missing grid or product definition');
        const total = width * height;
        const expected = bitmap
          ? Array.from({length: total}, (_, i) => (bitmap![i >>> 3] >>> (7 - (i & 7))) & 1).reduce(
              (a, b) => a + b,
              0
            )
          : total;
        check(count === expected, 'packed value count mismatch');
        const payload = data.subarray(offset + 5, offset + size);
        check(bitWidth * count <= payload.length * 8, 'data section truncated');
        values = new Float32Array(total);
        const binary = 2 ** binaryScale,
          decimal = 10 ** -decimalScale;
        let packedIndex = 0;
        for (let i = 0; i < total; i++) {
          if (bitmap && !(bitmap[i >>> 3] & (128 >>> (i & 7)))) {
            values[i] = NaN;
          } else {
            values[i] =
              (reference + bits(payload, packedIndex++ * bitWidth, bitWidth) * binary) * decimal;
          }
        }
      }
      offset += size;
    }
    check(offset === end - 4 && values !== null, 'incomplete GRIB2 message');
    result.push({
      discipline,
      category,
      parameter,
      forecastTime,
      grid: {width, height, scanningMode},
      values
    });
    cursor = end;
  }
  return result;
}

/** In-memory scientific adapter; full-grid decoding is residual, not remote pushdown. */
export class GRIB2Source implements ScientificArraySource {
  /** Capabilities of this in-memory source. */
  readonly scientificCapabilities: ScientificSourceCapabilities = {
    selection: 'residual',
    remoteRanges: false,
    streaming: false,
    cancellation: false
  };
  /** Decoded GRIB2 messages in stream order. */
  private readonly messages: GRIB2Message[];
  /** Decode an in-memory GRIB2 message stream. */
  constructor(data: ArrayBuffer | Uint8Array) {
    this.messages = parseGRIB2(data);
  }
  /** Describe message variables and grid dimensions. */
  async getScientificMetadata(): Promise<ScientificDatasetMetadata> {
    return {
      dimensions: this.messages.flatMap((message, index) => [
        {name: 'y_' + index, length: message.grid.height},
        {name: 'x_' + index, length: message.grid.width}
      ]),
      variables: this.messages.map((message, index) => ({
        name: 'message_' + index,
        dimensions: ['y_' + index, 'x_' + index],
        shape: [message.grid.height, message.grid.width],
        dtype: 'float32',
        attributes: {
          discipline: message.discipline,
          category: message.category,
          parameter: message.parameter,
          forecastTime: message.forecastTime,
          scanningMode: message.grid.scanningMode
        }
      }))
    };
  }
  /** Read a message variable and apply a residual grid selection. */
  async readScientificVariable(
    name: string,
    selection: ScientificSelection = {}
  ): Promise<ScientificArray> {
    const match = /^message_(\d+)$/.exec(name);
    const index = match ? Number(match[1]) : -1;
    const message = this.messages[index];
    check(message, 'unknown variable ' + name);
    const {width, height} = message.grid;
    const dimensionNames = ['y_' + index, 'x_' + index];
    for (const key of Object.keys(selection))
      check(dimensionNames.includes(key), 'unknown dimension ' + key);
    const range = (key: string, length: number): [number, number] => {
      const value = selection[key];
      const start = value === undefined ? 0 : typeof value === 'number' ? value : value[0];
      const end = value === undefined ? length : typeof value === 'number' ? value + 1 : value[1];
      check(
        Number.isInteger(start) &&
          Number.isInteger(end) &&
          start >= 0 &&
          end <= length &&
          end > start,
        'invalid slice'
      );
      return [start, end];
    };
    const [y0, y1] = range(dimensionNames[0], height);
    const [x0, x1] = range(dimensionNames[1], width);
    const output = new Float32Array((y1 - y0) * (x1 - x0));
    let k = 0;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) output[k++] = message.values[y * width + x];
    return {data: output, dimensions: dimensionNames, shape: [y1 - y0, x1 - x0]};
  }
}
