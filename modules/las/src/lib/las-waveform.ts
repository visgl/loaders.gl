// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {LASMetadata, LASWaveformPacketDescriptor} from './las-types';

const WAVEFORM_PACKET_REFERENCE_BYTE_LENGTH = 29;
const INTERNAL_WAVEFORM_DATA_MASK = 1 << 1;
const EXTERNAL_WAVEFORM_DATA_MASK = 1 << 2;

/** Location of waveform packet data selected by the LAS global-encoding field. */
export type LASWaveformStorage = 'internal' | 'external';

/** Lossless fields stored in one PDRF 4, 5, 9, or 10 waveform packet reference. */
export type LASWaveformPacketReference = {
  /** Waveform descriptor index; descriptor VLR record id is this value plus 99. */
  descriptorIndex: number;
  /** Packet byte offset relative to the waveform data packet record. */
  byteOffset: bigint;
  /** Packet byte length. */
  byteLength: number;
  /** Temporal offset in picoseconds from the waveform anchor to this return. */
  returnPointLocation: number;
  /** Parametric XYZ offsets per picosecond. */
  parametricOffset: [number, number, number];
};

/** Decoded waveform packet and the metadata required to interpret its samples. */
export type LASWaveformPacket = {
  /** Original lossless point-record reference. */
  reference: LASWaveformPacketReference;
  /** Descriptor selected by the packet reference. */
  descriptor: LASWaveformPacketDescriptor;
  /** Absolute byte offset read from the supplied LAS or WDP source. */
  sourceByteOffset: bigint;
  /** Exact packet bytes read from the source. */
  data: Uint8Array;
  /** Unsigned integer sample values decoded from the packet. */
  samples: Uint32Array;
  /** Sample amplitudes after applying descriptor gain and offset. */
  amplitudes: Float64Array;
};

/** Options for waveform packet range reads. */
export type LASWaveformReadOptions = {
  /** Abort signal forwarded to the underlying range read. */
  signal?: AbortSignal;
  /** Maximum simultaneous reads used by `readLASWaveformPackets`. */
  concurrency?: number;
};

/**
 * Parses one fixed-width LAS waveform packet reference without losing its 64-bit offset.
 * @param data Buffer or view containing the reference.
 * @param byteOffset Byte offset of the reference within `data`.
 * @returns Parsed packet reference.
 */
export function parseLASWaveformPacketReference(
  data: ArrayBuffer | ArrayBufferView,
  byteOffset = 0
): LASWaveformPacketReference {
  const bytes = getUint8Array(data);
  if (
    !Number.isInteger(byteOffset) ||
    byteOffset < 0 ||
    byteOffset + WAVEFORM_PACKET_REFERENCE_BYTE_LENGTH > bytes.byteLength
  ) {
    throw new Error('LAS waveform packet reference is truncated');
  }
  const dataView = new DataView(
    bytes.buffer,
    bytes.byteOffset + byteOffset,
    WAVEFORM_PACKET_REFERENCE_BYTE_LENGTH
  );
  return {
    descriptorIndex: dataView.getUint8(0),
    byteOffset: dataView.getBigUint64(1, true),
    byteLength: dataView.getUint32(9, true),
    returnPointLocation: dataView.getFloat32(13, true),
    parametricOffset: [
      dataView.getFloat32(17, true),
      dataView.getFloat32(21, true),
      dataView.getFloat32(25, true)
    ]
  };
}

/**
 * Returns the waveform storage selected by LAS global-encoding bits.
 * @param metadata Parsed LAS metadata.
 * @returns Internal or external storage, or `null` when the file declares neither.
 */
export function getLASWaveformStorage(metadata: LASMetadata): LASWaveformStorage | null {
  const hasInternalData = Boolean(metadata.globalEncoding & INTERNAL_WAVEFORM_DATA_MASK);
  const hasExternalData = Boolean(metadata.globalEncoding & EXTERNAL_WAVEFORM_DATA_MASK);
  if (hasInternalData && hasExternalData) {
    throw new Error('LAS waveform data cannot be both internal and external');
  }
  return hasInternalData ? 'internal' : hasExternalData ? 'external' : null;
}

/**
 * Decodes uncompressed 2-32 bit LAS waveform samples.
 * @param data Exact waveform packet bytes.
 * @param descriptor Waveform descriptor selected by the point record.
 * @returns Unsigned integer waveform samples.
 */
export function decodeLASWaveformSamples(
  data: Uint8Array,
  descriptor: LASWaveformPacketDescriptor
): Uint32Array {
  const requiredByteLength = validateLASWaveformDescriptor(descriptor);
  if (data.byteLength < requiredByteLength) {
    throw new Error(
      `LAS waveform packet is truncated: expected ${requiredByteLength} bytes, received ${data.byteLength}`
    );
  }

  const bitsPerSample = descriptor.bitsPerSample;
  const samples = new Uint32Array(descriptor.numberOfSamples);
  const sampleDivisor = 2 ** bitsPerSample;
  let bitBuffer = 0;
  let availableBitCount = 0;
  let sourceByteIndex = 0;
  for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex++) {
    while (availableBitCount < bitsPerSample) {
      bitBuffer += data[sourceByteIndex++] * 2 ** availableBitCount;
      availableBitCount += 8;
    }
    samples[sampleIndex] = bitBuffer % sampleDivisor;
    bitBuffer = Math.floor(bitBuffer / sampleDivisor);
    availableBitCount -= bitsPerSample;
  }
  return samples;
}

/** Validates one waveform descriptor and returns its uncompressed packet byte length. */
function validateLASWaveformDescriptor(descriptor: LASWaveformPacketDescriptor): number {
  if (descriptor.compressionType !== 0) {
    throw new Error(`LAS waveform compression type ${descriptor.compressionType} is not supported`);
  }
  const bitsPerSample = descriptor.bitsPerSample;
  if (!Number.isInteger(bitsPerSample) || bitsPerSample < 2 || bitsPerSample > 32) {
    throw new Error(
      `LAS waveform bits per sample must be between 2 and 32; received ${bitsPerSample}`
    );
  }
  if (!Number.isInteger(descriptor.numberOfSamples) || descriptor.numberOfSamples < 0) {
    throw new Error(`LAS waveform sample count ${descriptor.numberOfSamples} is invalid`);
  }
  const requiredByteLength = Math.ceil((descriptor.numberOfSamples * bitsPerSample) / 8);
  if (!Number.isSafeInteger(requiredByteLength) || requiredByteLength < 0) {
    throw new Error(`LAS waveform sample count ${descriptor.numberOfSamples} is invalid`);
  }
  return requiredByteLength;
}

/**
 * Applies waveform descriptor gain and offset to integer samples.
 * @param samples Unsigned integer waveform samples.
 * @param descriptor Waveform descriptor containing gain and offset.
 * @returns Scaled sample amplitudes.
 */
export function scaleLASWaveformSamples(
  samples: Uint32Array,
  descriptor: LASWaveformPacketDescriptor
): Float64Array {
  const amplitudes = new Float64Array(samples.length);
  for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex++) {
    amplitudes[sampleIndex] =
      descriptor.digitizerOffset + descriptor.digitizerGain * samples[sampleIndex];
  }
  return amplitudes;
}

/**
 * Range-reads and decodes one internal LAS or external WDP waveform packet.
 *
 * Supply the LAS file when `metadata.globalEncoding` declares internal waveform data and the
 * companion WDP file when it declares external waveform data.
 *
 * @param source Random-access LAS or WDP source selected by the file's global-encoding field.
 * @param reference Lossless waveform packet reference from a point record.
 * @param metadata Parsed metadata from the owning LAS file.
 * @param options Range-read options.
 * @returns Decoded waveform packet.
 */
export async function readLASWaveformPacket(
  source: ReadableFile,
  reference: LASWaveformPacketReference,
  metadata: LASMetadata,
  options: LASWaveformReadOptions = {}
): Promise<LASWaveformPacket> {
  const storage = getLASWaveformStorage(metadata);
  if (!storage) {
    throw new Error('LAS file does not declare internal or external waveform data');
  }
  if (reference.descriptorIndex === 0) {
    throw new Error('LAS waveform descriptor index 0 does not reference a waveform packet');
  }
  const descriptorRecordId = reference.descriptorIndex + 99;
  const descriptor = metadata.waveformPacketDescriptors.find(
    candidate => candidate.recordId === descriptorRecordId
  );
  if (!descriptor) {
    throw new Error(`LAS waveform descriptor VLR ${descriptorRecordId} is missing`);
  }
  const requiredByteLength = validateLASWaveformDescriptor(descriptor);
  if (!Number.isInteger(reference.byteLength) || reference.byteLength < requiredByteLength) {
    throw new Error(
      `LAS waveform packet size ${reference.byteLength} is smaller than the descriptor requires (${requiredByteLength})`
    );
  }
  const sourceByteOffset =
    storage === 'internal'
      ? getInternalWaveformSourceOffset(metadata) + reference.byteOffset
      : reference.byteOffset;
  const arrayBuffer = await source.read(sourceByteOffset, reference.byteLength, options.signal);
  if (arrayBuffer.byteLength !== reference.byteLength) {
    throw new Error(
      `LAS waveform range read returned ${arrayBuffer.byteLength} bytes; expected ${reference.byteLength}`
    );
  }
  const data = new Uint8Array(arrayBuffer);
  const samples = decodeLASWaveformSamples(data, descriptor);
  return {
    reference,
    descriptor,
    sourceByteOffset,
    data,
    samples,
    amplitudes: scaleLASWaveformSamples(samples, descriptor)
  };
}

/**
 * Range-reads multiple waveform packets with bounded concurrency.
 * @param source Random-access LAS or WDP source selected by the file's global-encoding field.
 * @param references Waveform packet references in desired result order.
 * @param metadata Parsed metadata from the owning LAS file.
 * @param options Range-read and concurrency options.
 * @returns Decoded waveform packets in input order.
 */
export async function readLASWaveformPackets(
  source: ReadableFile,
  references: Iterable<LASWaveformPacketReference>,
  metadata: LASMetadata,
  options: LASWaveformReadOptions = {}
): Promise<LASWaveformPacket[]> {
  const referenceArray = Array.from(references);
  const concurrency = options.concurrency ?? 8;
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(
      `LAS waveform read concurrency must be a positive integer; received ${concurrency}`
    );
  }
  const packets = new Array<LASWaveformPacket>(referenceArray.length);
  let nextReferenceIndex = 0;

  /** Reads packet references from the shared index until none remain. */
  const readNextPackets = async (): Promise<void> => {
    while (nextReferenceIndex < referenceArray.length) {
      const referenceIndex = nextReferenceIndex++;
      packets[referenceIndex] = await readLASWaveformPacket(
        source,
        referenceArray[referenceIndex],
        metadata,
        options
      );
    }
  };

  const workerCount = Math.min(concurrency, referenceArray.length);
  await Promise.all(Array.from({length: workerCount}, () => readNextPackets()));
  return packets;
}

function getInternalWaveformSourceOffset(metadata: LASMetadata): bigint {
  if (metadata.waveformDataOffset === undefined) {
    throw new Error('LAS internal waveform data offset is missing from the public header');
  }
  return metadata.waveformDataOffset;
}

function getUint8Array(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  return data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}
