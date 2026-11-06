// SPDX-License-Identifier: MIT
/** Numeric storage supported by the initial NRRD decoder. */
export type NRRDArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;
/** Multidimensional NRRD data, preserving file axis order and authored orientation. */
export type NRRDData = {
  /** Decoded scalar samples. Axis zero varies fastest. */
  data: NRRDArray;
  /** Number of samples on each axis. */
  shape: number[];
  /** Original normalized header fields. */
  fields: Record<string, string>;
  /** Authored custom key/value metadata. */
  metadata: Record<string, string>;
  /** World-space coordinate of the first sample, if authored. */
  origin?: number[];
  /** World-space step vector per array axis; null represents a nonspatial axis. */
  directions?: (number[] | null)[];
  /** Axis kinds, when supplied. */
  kinds?: string[];
};

/** Descriptor for one supported NRRD scalar type. */
type ScalarType = {
  /** Typed-array constructor. */
  construct: (length: number) => NRRDArray;
  /** Bytes per sample. */
  bytes: number;
  /** Reads a sample with the specified byte order. */
  read: (view: DataView, offset: number, little: boolean) => number;
  /** Whether integer range validation is required. */
  integer: boolean;
};

const TYPES: [string[], ScalarType][] = [
  [
    ['signed char', 'int8', 'int8_t'],
    {
      construct: count => new Int8Array(count),
      bytes: 1,
      read: (view, offset) => view.getInt8(offset),
      integer: true
    }
  ],
  [
    ['uchar', 'unsigned char', 'uint8', 'uint8_t'],
    {
      construct: count => new Uint8Array(count),
      bytes: 1,
      read: (view, offset) => view.getUint8(offset),
      integer: true
    }
  ],
  [
    ['short', 'short int', 'signed short', 'signed short int', 'int16', 'int16_t'],
    {
      construct: count => new Int16Array(count),
      bytes: 2,
      read: (view, offset, little) => view.getInt16(offset, little),
      integer: true
    }
  ],
  [
    ['ushort', 'unsigned short', 'unsigned short int', 'uint16', 'uint16_t'],
    {
      construct: count => new Uint16Array(count),
      bytes: 2,
      read: (view, offset, little) => view.getUint16(offset, little),
      integer: true
    }
  ],
  [
    ['int', 'signed int', 'int32', 'int32_t'],
    {
      construct: count => new Int32Array(count),
      bytes: 4,
      read: (view, offset, little) => view.getInt32(offset, little),
      integer: true
    }
  ],
  [
    ['uint', 'unsigned int', 'uint32', 'uint32_t'],
    {
      construct: count => new Uint32Array(count),
      bytes: 4,
      read: (view, offset, little) => view.getUint32(offset, little),
      integer: true
    }
  ],
  [
    ['float'],
    {
      construct: count => new Float32Array(count),
      bytes: 4,
      read: (view, offset, little) => view.getFloat32(offset, little),
      integer: false
    }
  ],
  [
    ['double'],
    {
      construct: count => new Float64Array(count),
      bytes: 8,
      read: (view, offset, little) => view.getFloat64(offset, little),
      integer: false
    }
  ]
];

/** Decodes attached raw, ASCII or gzip NRRD without interpreting spatial axes as colors. */
export async function parseNRRD(input: ArrayBuffer): Promise<NRRDData> {
  const bytes = new Uint8Array(input);
  let headerEnd = -1;
  for (let index = 0; index < Math.min(bytes.length, 1024 * 1024); index++) {
    if (bytes[index] === 10 && bytes[index + 1] === 10) {
      headerEnd = index + 2;
      break;
    }
    if (
      bytes[index] === 13 &&
      bytes[index + 1] === 10 &&
      bytes[index + 2] === 13 &&
      bytes[index + 3] === 10
    ) {
      headerEnd = index + 4;
      break;
    }
  }
  if (headerEnd < 0) throw new Error('NRRD: missing or oversized attached header');
  const lines = new TextDecoder().decode(bytes.subarray(0, headerEnd)).split(/\r?\n/);
  if (!/^NRRD000[1-5]$/.test(lines.shift() || '')) throw new Error('NRRD: unsupported signature');
  const fields: Record<string, string> = Object.create(null);
  const metadata: Record<string, string> = Object.create(null);
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator <= 0) throw new Error('NRRD: malformed header field');
    const name = line.slice(0, separator);
    if (line[separator + 1] === '=') {
      metadata[name] = line.slice(separator + 2);
      continue;
    }
    const key = name.toLowerCase();
    if (key in fields) throw new Error('NRRD: duplicate header field');
    fields[key] = line.slice(separator + 1).trim();
  }
  if (
    'data file' in fields ||
    'datafile' in fields ||
    Number(fields['byte skip'] || 0) !== 0 ||
    Number(fields['line skip'] || 0) !== 0
  )
    throw new Error('NRRD: detached data and skip directives are unsupported');
  const dimension = Number(fields.dimension);
  const shape = (fields.sizes || '').split(/\s+/).map(Number);
  if (
    !Number.isInteger(dimension) ||
    dimension < 1 ||
    dimension > 16 ||
    shape.length !== dimension ||
    shape.some(size => !Number.isSafeInteger(size) || size < 1)
  )
    throw new Error('NRRD: invalid dimensions');
  const scalar = TYPES.find(([names]) => names.includes((fields.type || '').toLowerCase()))?.[1];
  if (!scalar) throw new Error('NRRD: unsupported scalar type');
  const count = shape.reduce((product, size) => product * size, 1);
  const byteLength = count * scalar.bytes;
  if (!Number.isSafeInteger(byteLength) || byteLength > 256 * 1024 * 1024)
    throw new Error('NRRD: decoded size exceeds 256 MiB limit');
  const encoding = (fields.encoding || '').toLowerCase();
  const ascii = ['ascii', 'text', 'txt'].includes(encoding);
  if (
    !ascii &&
    scalar.bytes > 1 &&
    !['little', 'big'].includes((fields.endian || '').toLowerCase())
  )
    throw new Error('NRRD: binary multibyte data requires endian');
  let payload = bytes.slice(headerEnd);
  if (encoding === 'gzip' || encoding === 'gz') payload = await decompressGzip(payload, byteLength);
  else if (!ascii && encoding !== 'raw') throw new Error('NRRD: unsupported encoding');
  const data = scalar.construct(count);
  if (ascii) {
    const tokens = new TextDecoder().decode(payload).trim().split(/\s+/);
    if (tokens.length !== count) throw new Error('NRRD: ASCII sample count mismatch');
    for (let index = 0; index < count; index++) {
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(tokens[index]))
        throw new Error('NRRD: invalid ASCII sample');
      const value = Number(tokens[index]);
      data[index] = value;
      if (!Number.isFinite(data[index]) || (scalar.integer && data[index] !== value))
        throw new Error('NRRD: scalar value out of range');
    }
  } else {
    if (payload.byteLength !== byteLength) throw new Error('NRRD: payload size mismatch');
    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    for (let index = 0; index < count; index++)
      data[index] = scalar.read(view, index * scalar.bytes, fields.endian?.toLowerCase() !== 'big');
  }
  const origin = fields['space origin'] ? parseVector(fields['space origin']) : undefined;
  const directions = fields['space directions']
    ?.match(/none|\([^()]*\)/gi)
    ?.map(value => (value.toLowerCase() === 'none' ? null : parseVector(value)));
  if (fields['space directions']) {
    const residue = fields['space directions'].replace(/none|\([^()]*\)/gi, '').trim();
    if (!directions || directions.length !== dimension || residue)
      throw new Error('NRRD: invalid space directions');
  }
  const spatialDimension =
    origin?.length || Number(fields['space dimension']) || directions?.find(value => value)?.length;
  if (directions?.some(value => value && value.length !== spatialDimension))
    throw new Error('NRRD: inconsistent spatial dimension');
  const kinds = fields.kinds?.split(/\s+/);
  if (kinds && kinds.length !== dimension) throw new Error('NRRD: invalid kinds count');
  return {data, shape, fields, metadata, origin, directions, kinds};
}

/** Parses one finite world-space vector. */
function parseVector(text: string): number[] {
  if (!/^\([^()]+\)$/.test(text.trim())) throw new Error('NRRD: invalid spatial vector');
  const values = text
    .trim()
    .slice(1, -1)
    .split(',')
    .map(value => {
      if (!value.trim()) throw new Error('NRRD: empty spatial vector component');
      return Number(value.trim());
    });
  if (!values.length || values.some(value => !Number.isFinite(value)))
    throw new Error('NRRD: invalid spatial vector');
  return values;
}

/** Decompresses gzip incrementally, enforcing the declared decoded length. */
async function decompressGzip(
  payload: Uint8Array<ArrayBuffer>,
  expectedLength: number
): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const result = new Uint8Array(expectedLength);
  let offset = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      if (offset + value.length > expectedLength)
        throw new Error('NRRD: gzip exceeds declared size');
      result.set(value, offset);
      offset += value.length;
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  if (offset !== expectedLength) throw new Error('NRRD: gzip sample count mismatch');
  return result;
}
