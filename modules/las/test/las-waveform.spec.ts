// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {ArrayBufferFile, type ReadableFile} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {LASLoaderWithParser} from '../src/las-loader';
import {
  decodeLASWaveformSamples,
  getLASWaveformStorage,
  parseLASWaveformPacketReference,
  readLASWaveformPacket,
  readLASWaveformPackets,
  scaleLASWaveformSamples
} from '../src';
import type {LASMetadata, LASWaveformPacketDescriptor} from '../src';

describe('LAS waveform packet references', () => {
  test('preserves uint64 offsets and ArrayBufferView byte offsets', () => {
    const bytes = new Uint8Array(37);
    const dataView = new DataView(bytes.buffer, 4, 29);
    dataView.setUint8(0, 7);
    dataView.setBigUint64(1, 0x123456789abcdef0n, true);
    dataView.setUint32(9, 4096, true);
    dataView.setFloat32(13, 0.25, true);
    dataView.setFloat32(17, 1.5, true);
    dataView.setFloat32(21, -2.5, true);
    dataView.setFloat32(25, 3.5, true);

    expect(parseLASWaveformPacketReference(bytes.subarray(3, 34), 1)).toEqual({
      descriptorIndex: 7,
      byteOffset: 0x123456789abcdef0n,
      byteLength: 4096,
      returnPointLocation: 0.25,
      parametricOffset: [1.5, -2.5, 3.5]
    });
    expect(() => parseLASWaveformPacketReference(bytes.subarray(4, 32))).toThrow(/truncated/);
  });

  test('resolves mutually exclusive global-encoding storage bits', () => {
    expect(getLASWaveformStorage(createMetadata({globalEncoding: 0}))).toBeNull();
    expect(getLASWaveformStorage(createMetadata({globalEncoding: 2}))).toBe('internal');
    expect(getLASWaveformStorage(createMetadata({globalEncoding: 4}))).toBe('external');
    expect(() => getLASWaveformStorage(createMetadata({globalEncoding: 6}))).toThrow(
      /both internal and external/
    );
  });
});

describe('LAS waveform sample decoding', () => {
  test.each([
    {bitsPerSample: 2, samples: [0, 1, 2, 3, 3, 2, 1, 0]},
    {bitsPerSample: 12, samples: [0, 1, 2047, 4095, 37]},
    {bitsPerSample: 32, samples: [0, 1, 0x7fffffff, 0xffffffff]}
  ])('decodes $bitsPerSample-bit little-endian packed samples', fixture => {
    const descriptor = createDescriptor({
      bitsPerSample: fixture.bitsPerSample,
      numberOfSamples: fixture.samples.length
    });
    const data = packUnsignedSamples(fixture.samples, fixture.bitsPerSample);
    expect(Array.from(decodeLASWaveformSamples(data, descriptor))).toEqual(fixture.samples);
  });

  test('applies descriptor gain and offset', () => {
    const descriptor = createDescriptor({digitizerGain: 1.5, digitizerOffset: -2.5});
    expect(Array.from(scaleLASWaveformSamples(Uint32Array.of(0, 2, 4), descriptor))).toEqual([
      -2.5, 0.5, 3.5
    ]);
  });

  test('rejects unsupported compression, sample widths, and truncated packets', () => {
    expect(() =>
      decodeLASWaveformSamples(Uint8Array.of(0), createDescriptor({compressionType: 1}))
    ).toThrow(/compression type 1/);
    expect(() =>
      decodeLASWaveformSamples(Uint8Array.of(0), createDescriptor({bitsPerSample: 1}))
    ).toThrow(/between 2 and 32/);
    expect(() =>
      decodeLASWaveformSamples(Uint8Array.of(0), createDescriptor({numberOfSamples: -1}))
    ).toThrow(/sample count -1 is invalid/);
    expect(() =>
      decodeLASWaveformSamples(
        Uint8Array.of(0),
        createDescriptor({bitsPerSample: 16, numberOfSamples: 2})
      )
    ).toThrow(/truncated/);
  });
});

describe('LAS waveform range reads', () => {
  test('range-reads internal packets relative to the public-header waveform offset', async () => {
    const sourceBytes = new Uint8Array(256);
    sourceBytes.set([1, 2, 3, 4], 124);
    const reads: Array<{start: number | bigint | undefined; length: number | undefined}> = [];
    const source = createRecordingFile(sourceBytes.buffer, reads);
    const metadata = createMetadata({
      globalEncoding: 2,
      waveformDataOffset: 64n,
      waveformPacketDescriptors: [
        createDescriptor({numberOfSamples: 4, digitizerGain: 2, digitizerOffset: -1})
      ]
    });
    const reference = createReference({byteOffset: 60n, byteLength: 4});

    const packet = await readLASWaveformPacket(source, reference, metadata);

    expect(reads).toEqual([{start: 124n, length: 4}]);
    expect(packet.sourceByteOffset).toBe(124n);
    expect(Array.from(packet.data)).toEqual([1, 2, 3, 4]);
    expect(Array.from(packet.samples)).toEqual([1, 2, 3, 4]);
    expect(Array.from(packet.amplitudes)).toEqual([1, 3, 5, 7]);
  });

  test('range-reads external WDP packets from their reference offsets', async () => {
    const sourceBytes = new Uint8Array(128);
    sourceBytes.set([5, 6], 60);
    const metadata = createMetadata({
      globalEncoding: 4,
      waveformPacketDescriptors: [createDescriptor({numberOfSamples: 2})]
    });
    const packet = await readLASWaveformPacket(
      new ArrayBufferFile(sourceBytes.buffer),
      createReference({byteOffset: 60n, byteLength: 2}),
      metadata
    );

    expect(packet.sourceByteOffset).toBe(60n);
    expect(Array.from(packet.samples)).toEqual([5, 6]);
  });

  test('reads multiple packets concurrently while preserving input order', async () => {
    const sourceBytes = new Uint8Array(128);
    sourceBytes.set([4, 3, 2, 1], 60);
    const metadata = createMetadata({
      globalEncoding: 4,
      waveformPacketDescriptors: [createDescriptor({numberOfSamples: 2})]
    });
    const packets = await readLASWaveformPackets(
      new ArrayBufferFile(sourceBytes.buffer),
      [
        createReference({byteOffset: 62n, byteLength: 2}),
        createReference({byteOffset: 60n, byteLength: 2})
      ],
      metadata,
      {concurrency: 2}
    );

    expect(packets.map(packet => Array.from(packet.samples))).toEqual([
      [2, 1],
      [4, 3]
    ]);
    await expect(
      readLASWaveformPackets(new ArrayBufferFile(sourceBytes.buffer), [], metadata)
    ).resolves.toEqual([]);
    await expect(
      readLASWaveformPackets(new ArrayBufferFile(sourceBytes.buffer), [], metadata, {
        concurrency: 0
      })
    ).rejects.toThrow(/positive integer/);
  });

  test('reports missing storage, offsets, descriptors, and short reads', async () => {
    const source = new ArrayBufferFile(new ArrayBuffer(4));
    const reference = createReference({byteLength: 4});
    await expect(readLASWaveformPacket(source, reference, createMetadata())).rejects.toThrow(
      /does not declare/
    );
    await expect(
      readLASWaveformPacket(
        source,
        reference,
        createMetadata({
          globalEncoding: 2,
          waveformPacketDescriptors: [createDescriptor({numberOfSamples: 4})]
        })
      )
    ).rejects.toThrow(/offset is missing/);
    await expect(
      readLASWaveformPacket(
        source,
        createReference({descriptorIndex: 0, byteLength: 0}),
        createMetadata({globalEncoding: 4})
      )
    ).rejects.toThrow(/index 0/);
    await expect(
      readLASWaveformPacket(source, reference, createMetadata({globalEncoding: 4}))
    ).rejects.toThrow(/descriptor VLR 100 is missing/);
    await expect(
      readLASWaveformPacket(
        source,
        createReference({byteOffset: 10n, byteLength: 4}),
        createMetadata({
          globalEncoding: 4,
          waveformPacketDescriptors: [createDescriptor({numberOfSamples: 4})]
        })
      )
    ).rejects.toThrow(/range read returned 0 bytes/);
  });

  test('forwards abort signals to the range source', async () => {
    const abortController = new AbortController();
    abortController.abort();
    const metadata = createMetadata({
      globalEncoding: 4,
      waveformPacketDescriptors: [createDescriptor()]
    });
    await expect(
      readLASWaveformPacket(
        new ArrayBufferFile(Uint8Array.of(1).buffer),
        createReference(),
        metadata,
        {signal: abortController.signal}
      )
    ).rejects.toThrow(/aborted/);
  });
});

test('LASLoader extracts the complete legacy PDRF 4 waveform reference', () => {
  const headerSize = 235;
  const pointDataRecordLength = 57;
  const arrayBuffer = new ArrayBuffer(headerSize + pointDataRecordLength);
  const bytes = new Uint8Array(arrayBuffer);
  const dataView = new DataView(arrayBuffer);
  dataView.setUint32(0, 0x4653414c, true);
  bytes[24] = 1;
  bytes[25] = 3;
  dataView.setUint16(94, headerSize, true);
  dataView.setUint32(96, headerSize, true);
  bytes[104] = 4;
  dataView.setUint16(105, pointDataRecordLength, true);
  dataView.setUint32(107, 1, true);
  dataView.setFloat64(131, 1, true);
  dataView.setFloat64(139, 1, true);
  dataView.setFloat64(147, 1, true);
  const waveformOffset = headerSize + 28;
  dataView.setUint8(waveformOffset, 7);
  dataView.setBigUint64(waveformOffset + 1, 0x123456789abcdef0n, true);
  dataView.setUint32(waveformOffset + 9, 16, true);

  const table = LASLoaderWithParser.parseSync!(arrayBuffer, {
    las: {shape: 'arrow-table', columns: ['POSITION', 'WAVEFORM']}
  }) as MeshArrowTable;
  const waveform = table.data.getChild('WAVEFORM')?.get(0) as Iterable<number>;

  expect(Array.from(waveform)[0]).toBe(7);
  expect(parseLASWaveformPacketReference(Uint8Array.from(waveform))).toMatchObject({
    descriptorIndex: 7,
    byteOffset: 0x123456789abcdef0n,
    byteLength: 16
  });
});

/** Creates a complete metadata object with waveform-specific overrides. */
function createMetadata(overrides: Partial<LASMetadata> = {}): LASMetadata {
  return {
    fileSourceId: 0,
    globalEncoding: 0,
    projectId: '00000000-0000-0000-0000-000000000000',
    systemIdentifier: '',
    generatingSoftware: '',
    creationDayOfYear: 0,
    creationYear: 0,
    headerSize: 375,
    vlrCount: 0,
    vlrs: [],
    evlrs: [],
    extraBytes: [],
    waveformPacketDescriptors: [],
    ...overrides
  };
}

/** Creates one waveform descriptor with deterministic uncompressed defaults. */
function createDescriptor(
  overrides: Partial<LASWaveformPacketDescriptor> = {}
): LASWaveformPacketDescriptor {
  return {
    recordId: 100,
    bitsPerSample: 8,
    compressionType: 0,
    numberOfSamples: 1,
    temporalSampleSpacing: 250,
    digitizerGain: 1,
    digitizerOffset: 0,
    ...overrides
  };
}

/** Creates one waveform packet reference with deterministic defaults. */
function createReference(
  overrides: Partial<ReturnType<typeof parseLASWaveformPacketReference>> = {}
): ReturnType<typeof parseLASWaveformPacketReference> {
  return {
    descriptorIndex: 1,
    byteOffset: 0n,
    byteLength: 1,
    returnPointLocation: 0,
    parametricOffset: [0, 0, 0],
    ...overrides
  };
}

/** Packs unsigned integer samples in LAS little-endian bit order. */
function packUnsignedSamples(samples: number[], bitsPerSample: number): Uint8Array {
  const bytes = new Uint8Array(Math.ceil((samples.length * bitsPerSample) / 8));
  let bitOffset = 0;
  for (const sample of samples) {
    for (let bitIndex = 0; bitIndex < bitsPerSample; bitIndex++) {
      if (Math.floor(sample / 2 ** bitIndex) % 2) {
        bytes[Math.floor(bitOffset / 8)] |= 1 << (bitOffset % 8);
      }
      bitOffset++;
    }
  }
  return bytes;
}

/** Wraps an ArrayBuffer file and records each requested range. */
function createRecordingFile(
  arrayBuffer: ArrayBuffer,
  reads: Array<{start: number | bigint | undefined; length: number | undefined}>
): ReadableFile {
  const file = new ArrayBufferFile(arrayBuffer);
  return {
    ...file,
    read: async (start, length, signal) => {
      reads.push({start, length});
      return file.read(start, length, signal);
    },
    close: () => file.close()
  };
}
