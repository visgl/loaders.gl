// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable} from '@loaders.gl/schema';
import {decompressORCStream} from './orc-compression';
import {
  ORCStreamKind,
  ORCTypeKind,
  parseORC,
  type ORCCompression,
  type ORCStreamInformation,
  type ORCStripeInformation,
  type ORCTypeDescription
} from './parse-orc';

/** Parses supported ORC primitive streams into an Arrow table. */
export function parseORCToArrow(arrayBuffer: ArrayBuffer): ArrowTable {
  const bytes = new Uint8Array(arrayBuffer);
  const orcFile = parseORC(arrayBuffer);
  const rowCount = orcFile.footer.numberOfRows || 0;
  const rootType = orcFile.footer.types[0];
  if (!rootType || rootType.kind !== ORCTypeKind.STRUCT) {
    if (rowCount) throw new Error('ORC root type is not a struct');
    return {shape: 'arrow-table', data: new arrow.Table(new arrow.Schema([]))};
  }
  if (!rowCount) {
    const columns = Object.fromEntries(rootType.fieldNames.map(fieldName => [fieldName, []]));
    return {
      shape: 'arrow-table',
      data: rootType.fieldNames.length
        ? arrow.tableFromArrays(columns)
        : new arrow.Table(new arrow.Schema([]))
    };
  }
  const columns: Record<string, unknown[] | arrow.Vector> = {};
  for (let index = 0; index < rootType.subtypes.length; index++) {
    const fieldName = rootType.fieldNames[index] || `field_${index}`;
    const typeId = rootType.subtypes[index];
    const type = orcFile.footer.types[typeId];
    if (!type) throw new Error(`ORC type ${typeId} is missing`);
    const values = orcFile.footer.stripes.flatMap(stripe =>
      decodeColumn(
        bytes,
        stripe,
        orcFile.postscript.compression,
        orcFile.postscript.compressionBlockSize,
        orcFile.footer.types,
        typeId,
        type
      )
    );
    columns[fieldName] =
      type.kind === ORCTypeKind.LIST
        ? createListVector(values, orcFile.footer.types[type.subtypes[0]])
        : type.kind === ORCTypeKind.BINARY
          ? arrow.vectorFromArray(values, new arrow.Binary())
          : values;
  }
  return {
    shape: 'arrow-table',
    data: arrow.tableFromArrays(columns as unknown as Record<string, readonly unknown[]>)
  };
}

/** Creates an Arrow list vector from reconstructed JavaScript list values. */
function createListVector(values: unknown[], childType?: ORCTypeDescription): arrow.Vector {
  const flattenedValues: unknown[] = [];
  const offsets = new Int32Array(values.length + 1);
  for (let index = 0; index < values.length; index++) {
    const list = Array.isArray(values[index]) ? (values[index] as unknown[]) : [];
    flattenedValues.push(...list);
    offsets[index + 1] = flattenedValues.length;
  }
  const arrowChildType = getArrowType(childType?.kind);
  const childVector = arrow.vectorFromArray(flattenedValues, arrowChildType);
  const listType = new arrow.List(new arrow.Field('item', arrowChildType, true));
  const listData = new arrow.Data(
    listType,
    0,
    values.length,
    0,
    {[arrow.BufferType.OFFSET]: offsets},
    [childVector.data[0]]
  );
  return new arrow.Vector([listData]);
}

/** Maps an ORC primitive kind to its Arrow type. */
function getArrowType(kind?: number): arrow.DataType {
  switch (kind) {
    case ORCTypeKind.BOOLEAN:
      return new arrow.Bool();
    case ORCTypeKind.BYTE:
    case ORCTypeKind.SHORT:
    case ORCTypeKind.INT:
    case ORCTypeKind.DATE:
      return new arrow.Int32();
    case ORCTypeKind.LONG:
      return new arrow.Int64();
    case ORCTypeKind.FLOAT:
      return new arrow.Float32();
    case ORCTypeKind.DOUBLE:
      return new arrow.Float64();
    case ORCTypeKind.BINARY:
      return new arrow.Binary();
    default:
      return new arrow.Utf8();
  }
}

/** Decodes one primitive ORC column from one stripe. */
function decodeColumn(
  bytes: Uint8Array,
  stripe: ORCStripeInformation,
  compression: ORCCompression,
  compressionBlockSize: number,
  types: ORCTypeDescription[],
  typeId: number,
  type: ORCTypeDescription,
  rowCountOverride?: number
): unknown[] {
  const rowCount = rowCountOverride ?? stripe.numberOfRows;
  if (type.kind === ORCTypeKind.STRUCT)
    return decodeStructColumn(
      bytes,
      stripe,
      compression,
      compressionBlockSize,
      types,
      type,
      rowCount
    );
  const dataStreams = getDataStreams(bytes, stripe);
  if (type.kind === ORCTypeKind.LIST || type.kind === ORCTypeKind.MAP)
    return decodeContainerColumn(
      bytes,
      stripe,
      compression,
      compressionBlockSize,
      types,
      typeId,
      type,
      dataStreams,
      rowCount
    );
  const presentStream = dataStreams.find(
    stream => stream.kind === ORCStreamKind.PRESENT && stream.column === typeId
  );
  const presence = presentStream
    ? readBooleanBits(
        getStreamBytes(bytes, presentStream, compression, compressionBlockSize),
        rowCount
      )
    : new Array(rowCount).fill(true);
  const valueCount = presence.filter(Boolean).length;
  if (valueCount === 0) return presence.map(() => null);
  const dataStream = dataStreams.find(
    stream => stream.kind === ORCStreamKind.DATA && stream.column === typeId
  );
  if (!dataStream) throw new Error(`ORC data stream is missing for column ${typeId}`);
  const data = getStreamBytes(bytes, dataStream, compression, compressionBlockSize);
  const encodingKind = getColumnEncodingKind(stripe, typeId);
  switch (type.kind) {
    case ORCTypeKind.BOOLEAN:
      return expandNulls(readBooleanBits(data, valueCount), presence);
    case ORCTypeKind.BYTE:
    case ORCTypeKind.SHORT:
    case ORCTypeKind.INT:
    case ORCTypeKind.LONG:
    case ORCTypeKind.DATE:
      return expandNulls(readORCIntegers(data, valueCount, encodingKind, true), presence);
    case ORCTypeKind.FLOAT:
      return expandNulls(readFixedNumbers(data, valueCount, 4), presence);
    case ORCTypeKind.DOUBLE:
      return expandNulls(readFixedNumbers(data, valueCount, 8), presence);
    case ORCTypeKind.STRING:
    case ORCTypeKind.BINARY:
      return readBytesColumn(
        bytes,
        dataStreams,
        stripe,
        compression,
        compressionBlockSize,
        typeId,
        data,
        valueCount,
        presence,
        type.kind
      );
    default:
      throw new Error(`ORC type kind ${type.kind} is not supported yet`);
  }
}

/** Decodes ORC LIST and MAP parent streams and reconstructs flattened children. */
function decodeContainerColumn(
  bytes: Uint8Array,
  stripe: ORCStripeInformation,
  compression: ORCCompression,
  compressionBlockSize: number,
  types: ORCTypeDescription[],
  typeId: number,
  type: ORCTypeDescription,
  dataStreams: LocatedStream[],
  rowCount: number
): unknown[] {
  const presence = readColumnPresence(
    bytes,
    dataStreams,
    typeId,
    rowCount,
    compression,
    compressionBlockSize
  );
  const lengthStream = dataStreams.find(
    stream => stream.kind === ORCStreamKind.LENGTH && stream.column === typeId
  );
  if (!lengthStream) throw new Error(`ORC length stream is missing for column ${typeId}`);
  const lengths = readORCIntegers(
    getStreamBytes(bytes, lengthStream, compression, compressionBlockSize),
    presence.filter(Boolean).length,
    getColumnEncodingKind(stripe, typeId),
    false
  );
  const totalValueCount = lengths.reduce((total, length) => total + length, 0);
  if (lengths.some(length => length < 0)) throw new Error('Invalid ORC container length');
  const childTypes = type.subtypes.map(typeId => types[typeId]);
  if (childTypes.some(childType => !childType))
    throw new Error('ORC container child type is missing');
  const childValues = childTypes.map((childType, index) =>
    decodeColumn(
      bytes,
      stripe,
      compression,
      compressionBlockSize,
      types,
      type.subtypes[index],
      childType,
      totalValueCount
    )
  );
  let lengthIndex = 0;
  let valueOffset = 0;
  return presence.map(isPresent => {
    if (!isPresent) return null;
    const length = lengths[lengthIndex++];
    if (type.kind === ORCTypeKind.LIST) {
      const values = childValues[0].slice(valueOffset, valueOffset + length);
      valueOffset += length;
      return values;
    }
    const map = new Map<unknown, unknown>();
    for (let index = 0; index < length; index++) {
      map.set(childValues[0][valueOffset + index], childValues[1][valueOffset + index]);
    }
    valueOffset += length;
    return map;
  });
}

/** Decodes a struct by recursively assembling its child columns. */
function decodeStructColumn(
  bytes: Uint8Array,
  stripe: ORCStripeInformation,
  compression: ORCCompression,
  compressionBlockSize: number,
  types: ORCTypeDescription[],
  type: ORCTypeDescription,
  rowCount: number
): Record<string, unknown>[] {
  const childColumns = type.subtypes.map((typeId, index) => {
    const childType = types[typeId];
    return {
      name: type.fieldNames[index] || `field_${index}`,
      values: childType
        ? decodeColumn(
            bytes,
            stripe,
            compression,
            compressionBlockSize,
            types,
            typeId,
            childType,
            rowCount
          )
        : new Array(rowCount).fill(null)
    };
  });
  return Array.from({length: rowCount}, (_, rowIndex) => {
    const record: Record<string, unknown> = {};
    for (const child of childColumns) record[child.name] = child.values[rowIndex];
    return record;
  });
}

/** Returns the encoding kind declared for an ORC column, if available. */
function getColumnEncodingKind(stripe: ORCStripeInformation, typeId: number): number | undefined {
  return stripe.encodings?.find(encoding => encoding.column === typeId)?.kind;
}

/** Reads a column PRESENT stream, expanding it to the requested row count. */
function readColumnPresence(
  bytes: Uint8Array,
  dataStreams: LocatedStream[],
  typeId: number,
  rowCount: number,
  compression: ORCCompression,
  compressionBlockSize: number
): boolean[] {
  const presentStream = dataStreams.find(
    stream => stream.kind === ORCStreamKind.PRESENT && stream.column === typeId
  );
  return presentStream
    ? readBooleanBits(
        getStreamBytes(bytes, presentStream, compression, compressionBlockSize),
        rowCount
      )
    : new Array(rowCount).fill(true);
}

type LocatedStream = ORCStreamInformation & {offset: number};

/** Reads and decompresses one ORC stream. */
function getStreamBytes(
  bytes: Uint8Array,
  stream: LocatedStream,
  compression: ORCCompression,
  compressionBlockSize: number
): Uint8Array {
  return decompressORCStream(
    bytes.subarray(stream.offset, stream.offset + stream.length),
    compression,
    compressionBlockSize
  );
}

/** Locates data-area streams using the lengths recorded in the stripe footer. */
function getDataStreams(bytes: Uint8Array, stripe: ORCStripeInformation): LocatedStream[] {
  const streams = stripe.streams || [];
  const dataStart = stripe.offset + stripe.indexLength;
  let offset = dataStart;
  const located: LocatedStream[] = [];
  for (const stream of streams) {
    if (
      stream.kind === ORCStreamKind.PRESENT ||
      stream.kind === ORCStreamKind.DATA ||
      stream.kind === ORCStreamKind.LENGTH ||
      stream.kind === ORCStreamKind.DICTIONARY_DATA ||
      stream.kind === ORCStreamKind.DICTIONARY_COUNT
    ) {
      located.push({...stream, offset});
      offset += stream.length;
    }
  }
  if (offset > bytes.length) throw new Error('Truncated ORC stripe data');
  return located;
}

/** Decodes ORC boolean DATA streams, packed most-significant bit first. */
function readBooleanBits(bytes: Uint8Array, count: number): boolean[] {
  const expectedLength = Math.ceil(count / 8);
  let bitBytes = bytes;
  if (bytes.length !== expectedLength) {
    try {
      const decoded = decodeByteRLE(bytes);
      if (decoded.length >= expectedLength) bitBytes = decoded;
    } catch {
      // Keep accepting raw packed bits from early experimental ORC fixtures.
    }
  }
  const values: boolean[] = [];
  for (let index = 0; index < count; index++)
    values.push(Boolean(bitBytes[index >> 3] & (0x80 >> (index & 7))));
  return values;
}

/** Decodes the ORC byte RLE encoding used by BOOLEAN and PRESENT streams. */
function decodeByteRLE(bytes: Uint8Array): Uint8Array {
  const output: number[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const control = bytes[offset++];
    if (control < 0x80) {
      const length = control + 3;
      if (offset >= bytes.length) throw new Error('Truncated ORC byte RLE run');
      const value = bytes[offset++];
      for (let index = 0; index < length; index++) output.push(value);
    } else {
      const length = 0x100 - control;
      if (offset + length > bytes.length) throw new Error('Truncated ORC byte RLE literal');
      output.push(...bytes.subarray(offset, offset + length));
      offset += length;
    }
  }
  return Uint8Array.from(output);
}

/** Decodes little-endian IEEE-754 primitive streams. */
function readFixedNumbers(bytes: Uint8Array, count: number, width: 4 | 8): number[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values: number[] = [];
  for (let index = 0; index < count; index++) {
    const offset = index * width;
    if (offset + width > bytes.length) throw new Error('Truncated ORC numeric stream');
    values.push(width === 4 ? view.getFloat32(offset, true) : view.getFloat64(offset, true));
  }
  return values;
}

/** Decodes ORC string or binary DATA and LENGTH streams. */
function readBytesColumn(
  bytes: Uint8Array,
  streams: LocatedStream[],
  stripe: ORCStripeInformation,
  compression: ORCCompression,
  compressionBlockSize: number,
  typeId: number,
  data: Uint8Array,
  valueCount: number,
  presence: boolean[],
  typeKind: number
): unknown[] {
  const encoding = stripe.encodings?.find(encoding => encoding.column === typeId);
  if (encoding?.kind === 1 || encoding?.kind === 3) {
    return readDictionaryColumn(
      bytes,
      streams,
      compression,
      compressionBlockSize,
      typeId,
      data,
      valueCount,
      presence,
      typeKind,
      encoding
    );
  }
  const lengthStream = streams.find(
    stream => stream.kind === ORCStreamKind.LENGTH && stream.column === typeId
  );
  if (!lengthStream) throw new Error(`ORC length stream is missing for column ${typeId}`);
  const lengths = readORCIntegers(
    getStreamBytes(bytes, lengthStream, compression, compressionBlockSize),
    valueCount,
    getColumnEncodingKind(stripe, typeId),
    false
  );
  const values: unknown[] = [];
  let offset = 0;
  for (const length of lengths) {
    if (length < 0 || offset + length > data.length) throw new Error('Truncated ORC string stream');
    const value = data.subarray(offset, offset + length);
    values.push(typeKind === ORCTypeKind.STRING ? new TextDecoder().decode(value) : value.slice());
    offset += length;
  }
  return expandNulls(values, presence);
}

/** Decodes ORC dictionary-encoded string or binary streams. */
function readDictionaryColumn(
  bytes: Uint8Array,
  streams: LocatedStream[],
  compression: ORCCompression,
  compressionBlockSize: number,
  typeId: number,
  indexes: Uint8Array,
  valueCount: number,
  presence: boolean[],
  typeKind: number,
  encoding: {kind: number; dictionarySize?: number}
): unknown[] {
  const dictionaryDataStream = streams.find(
    stream => stream.kind === ORCStreamKind.DICTIONARY_DATA && stream.column === typeId
  );
  const lengthStream = streams.find(
    stream => stream.kind === ORCStreamKind.LENGTH && stream.column === typeId
  );
  if (!dictionaryDataStream || !lengthStream)
    throw new Error(`ORC dictionary streams are missing for column ${typeId}`);
  const dictionarySize = encoding.dictionarySize || 0;
  if (!dictionarySize) throw new Error(`ORC dictionary size is missing for column ${typeId}`);
  const lengths = readORCIntegers(
    getStreamBytes(bytes, lengthStream, compression, compressionBlockSize),
    dictionarySize,
    encoding.kind,
    false
  );
  const dictionaryBytes = getStreamBytes(
    bytes,
    dictionaryDataStream,
    compression,
    compressionBlockSize
  );
  const dictionary: unknown[] = [];
  let dictionaryOffset = 0;
  for (const length of lengths) {
    if (length < 0 || dictionaryOffset + length > dictionaryBytes.length)
      throw new Error('Truncated ORC dictionary stream');
    const value = dictionaryBytes.subarray(dictionaryOffset, dictionaryOffset + length);
    dictionary.push(
      typeKind === ORCTypeKind.STRING ? new TextDecoder().decode(value) : value.slice()
    );
    dictionaryOffset += length;
  }
  const dictionaryIndexes = readORCIntegers(indexes, valueCount, encoding.kind, false);
  const values = dictionaryIndexes.map(index => {
    if (index < 0 || index >= dictionary.length) throw new Error('Invalid ORC dictionary index');
    return dictionary[index];
  });
  return expandNulls(values, presence);
}

/** Restores null positions after decoding the compact non-null value stream. */
function expandNulls(values: unknown[], presence: boolean[]): unknown[] {
  let valueIndex = 0;
  return presence.map(isPresent => (isPresent ? values[valueIndex++] : null));
}

const RLEv2BitWidths = [
  1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, 26, 28, 30, 32, 40, 48, 56, 64
];

/** Decodes an ORC integer stream using the encoding declared by the stripe footer. */
function readORCIntegers(
  bytes: Uint8Array,
  count: number,
  encodingKind: number | undefined,
  signed: boolean
): number[] {
  if (encodingKind === undefined || encodingKind >= 2)
    return readRLEv2Integers(bytes, count, signed);
  try {
    return readRLEv1Integers(bytes, count, signed);
  } catch (error) {
    throw new Error(
      `ORC RLEv1 decode failed (encoding ${encodingKind}, signed ${signed}, ${bytes.length} bytes, ${count} values): ${error instanceof Error ? error.message : String(error)}`,
      {cause: error}
    );
  }
}

/** Decodes the RLEv1 integer encoding used by older ORC files. */
function readRLEv1Integers(bytes: Uint8Array, count: number, signed: boolean): number[] {
  const values: number[] = [];
  let offset = 0;
  while (values.length < count) {
    if (offset >= bytes.length)
      throw new Error(`Truncated ORC RLEv1 stream at ${values.length}/${count}`);
    const control = bytes[offset++];
    if (control < 0x80) {
      const runLength = control + 3;
      if (offset >= bytes.length)
        throw new Error(`Truncated ORC RLEv1 run at ${values.length}/${count}`);
      const deltaByte = bytes[offset++];
      const delta = deltaByte < 0x80 ? deltaByte : deltaByte - 0x100;
      const first = signed ? readVslong(bytes, offset) : readVulong(bytes, offset);
      offset = first.offset;
      for (let index = 0; index < runLength && values.length < count; index++)
        values.push(first.value + index * delta);
    } else {
      const literalCount = 0x100 - control;
      for (let index = 0; index < literalCount && values.length < count; index++) {
        let value: {value: number; offset: number};
        try {
          value = signed ? readVslong(bytes, offset) : readVulong(bytes, offset);
        } catch (error) {
          throw new Error(`Truncated ORC RLEv1 literal at byte ${offset}`, {cause: error});
        }
        offset = value.offset;
        values.push(value.value);
      }
    }
  }
  return values;
}

/** Decodes the direct and short-repeat forms of ORC RLEv2 integer streams. */
function readRLEv2Integers(bytes: Uint8Array, count: number, signed: boolean): number[] {
  const values: number[] = [];
  let offset = 0;
  while (values.length < count) {
    if (offset >= bytes.length) throw new Error('Truncated ORC RLEv2 stream');
    const header = bytes[offset++];
    const encoding = header >> 6;
    if (encoding === 0) {
      const repeatWidth = (header >> 3) & 7;
      const repeatCount = (header & 7) + 3;
      const width = repeatWidth + 1;
      const valueBytes = bytes.subarray(offset, offset + width);
      if (valueBytes.length !== width) throw new Error('Truncated ORC short-repeat stream');
      offset += width;
      const value = signed ? decodeSignedBigInt(valueBytes) : decodeUnsignedBigInt(valueBytes);
      for (let index = 0; index < repeatCount && values.length < count; index++)
        values.push(Number(value));
    } else if (encoding === 1) {
      if (offset >= bytes.length) throw new Error('Truncated ORC direct stream');
      const width = getRLEv2Width((header >> 1) & 0x1f);
      const length = ((header & 1) << 8) | bytes[offset++];
      const bitReader = new BitReader(bytes, offset);
      for (let index = 0; index < length + 1 && values.length < count; index++) {
        const encoded = bitReader.read(width);
        values.push(Number(signed ? decodeZigzag(encoded) : encoded));
      }
      offset = bitReader.offset;
    } else if (encoding === 2) {
      if (offset + 3 > bytes.length) throw new Error('Truncated ORC patched-base header');
      const width = getRLEv2Width((header >> 1) & 0x1f);
      const runLength = (((header & 1) << 8) | bytes[offset++]) + 1;
      const thirdHeaderByte = bytes[offset++];
      const fourthHeaderByte = bytes[offset++];
      const baseBytes = (thirdHeaderByte >> 5) + 1;
      const patchWidth = getRLEv2Width(thirdHeaderByte & 0x1f);
      const patchGapWidth = (fourthHeaderByte >> 5) + 1;
      const patchLength = fourthHeaderByte & 0x1f;
      if (offset + baseBytes > bytes.length) throw new Error('Truncated ORC patched-base value');
      const encodedBase = bytes.subarray(offset, offset + baseBytes);
      offset += baseBytes;
      const baseSign = Boolean(encodedBase[0] & 0x80);
      let base = 0n;
      for (const byte of encodedBase) base = (base << 8n) | BigInt(byte);
      if (baseSign) {
        base &= ~(1n << BigInt(baseBytes * 8 - 1));
        base = -base;
      }
      const baseReader = new BitReader(bytes, offset);
      const baseValues = Array.from({length: runLength}, () => baseReader.read(width));
      offset = baseReader.offset;
      const patchReader = new BitReader(bytes, offset);
      const patchBits = patchGapWidth + patchWidth;
      let patchIndex = 0;
      for (let index = 0; index < patchLength; index++) {
        const packedPatch = patchReader.read(patchBits);
        const patch = packedPatch & ((1n << BigInt(patchWidth)) - 1n);
        const gap = Number(packedPatch >> BigInt(patchWidth));
        patchIndex += gap;
        if (gap === 255 && patch === 0n) continue;
        if (patchIndex >= baseValues.length) throw new Error('Invalid ORC patched-base gap');
        baseValues[patchIndex] |= patch << BigInt(width);
      }
      offset = patchReader.offset;
      for (const value of baseValues) values.push(Number(base + value));
    } else if (encoding === 3) {
      const widthCode = (header >> 1) & 0x1f;
      const width = widthCode === 0 ? 0 : getRLEv2Width(widthCode);
      const length = ((header & 1) << 8) | bytes[offset++];
      const firstValue = readVslong(bytes, offset);
      offset = firstValue.offset;
      const deltaBase = readVslong(bytes, offset);
      offset = deltaBase.offset;
      let value = firstValue.value;
      values.push(value);
      if (width === 0) {
        for (let index = 0; index < length && values.length < count; index++) {
          value += deltaBase.value;
          values.push(value);
        }
      } else {
        const bitReader = new BitReader(bytes, offset);
        let delta = deltaBase.value;
        for (let index = 0; index < length && values.length < count; index++) {
          value += delta;
          values.push(value);
          const magnitude = Number(bitReader.read(width));
          delta = deltaBase.value < 0 ? -magnitude : magnitude;
        }
        offset = bitReader.offset;
      }
    } else {
      throw new Error('ORC RLEv2 encoding is not supported yet');
    }
  }
  return values;
}

/** Returns the bit width represented by an ORC RLEv2 header code. */
function getRLEv2Width(code: number): number {
  return RLEv2BitWidths[code];
}

/** Decodes a big-endian signed integer used by ORC short-repeat values. */
function decodeSignedBigInt(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  const signBit = 1n << BigInt(bytes.length * 8 - 1);
  return value & signBit ? value - (signBit << 1n) : value;
}

/** Decodes a big-endian unsigned integer used by ORC RLEv2 values. */
function decodeUnsignedBigInt(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
}

/** Reads an ORC signed variable-length integer. */
function readVslong(bytes: Uint8Array, offset: number): {value: number; offset: number} {
  let encoded = 0n;
  let shift = 0n;
  while (true) {
    if (offset >= bytes.length) throw new Error('Truncated ORC variable-length integer');
    const byte = bytes[offset++];
    encoded |= BigInt(byte & 0x7f) << shift;
    if (!(byte & 0x80)) break;
    shift += 7n;
    if (shift > 63n) throw new Error('ORC variable-length integer is too large');
  }
  return {value: Number(decodeZigzag(encoded)), offset};
}

/** Reads an ORC unsigned variable-length integer. */
function readVulong(bytes: Uint8Array, offset: number): {value: number; offset: number} {
  let value = 0n;
  let shift = 0n;
  while (true) {
    if (offset >= bytes.length) throw new Error('Truncated ORC variable-length integer');
    const byte = bytes[offset++];
    value |= BigInt(byte & 0x7f) << shift;
    if (!(byte & 0x80)) break;
    shift += 7n;
    if (shift > 63n) throw new Error('ORC variable-length integer is too large');
  }
  return {value: Number(value), offset};
}

/** Decodes an ORC zigzag integer. */
function decodeZigzag(value: bigint): bigint {
  return (value >> 1n) ^ -(value & 1n);
}

/** Reads arbitrary-width big-endian bit-packed values. */
class BitReader {
  offset: number;
  private bitOffset = 0;

  constructor(
    private readonly bytes: Uint8Array,
    offset: number
  ) {
    this.offset = offset;
  }

  read(width: number): bigint {
    let value = 0n;
    for (let index = 0; index < width; index++) {
      value = (value << 1n) | BigInt((this.bytes[this.offset] >> (7 - this.bitOffset)) & 1);
      this.bitOffset++;
      if (this.bitOffset === 8) {
        this.bitOffset = 0;
        this.offset++;
      }
    }
    return value;
  }
}
