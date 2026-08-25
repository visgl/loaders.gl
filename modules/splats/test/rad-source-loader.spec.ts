// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {DeflateCompression} from '@loaders.gl/compression/deflate-compression';
import {load, parse, parseSync} from '@loaders.gl/core';
import {RADLoader, RADSourceLoader, resolveRADChunkUrl} from '@loaders.gl/splats';
import type {RADSource} from '@loaders.gl/splats';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {
  parseRADChunkHeader,
  parseRADChunkToGaussianSplats,
  RADLoaderWithParser
} from '@loaders.gl/splats/rad-loader';

test('RADLoader parses Spark RAD metadata', async t => {
  const data = makeRADFixture();
  const metadata = await parse(data, RADLoader);

  t.equal(metadata.version, 1, 'parses version');
  t.equal(metadata.type, 'gsplat', 'parses RAD type');
  t.equal(metadata.count, 2, 'parses splat count');
  t.equal(metadata.chunks.length, 1, 'parses chunk table');
  t.equal(metadata.chunks[0].bytes, makeRADChunkFixture().byteLength, 'parses chunk byte length');
  t.equal(metadata.splatEncoding?.lodOpacity, true, 'parses splat encoding');

  const syncMetadata = parseSync(data, RADLoaderWithParser);
  t.equal(
    syncMetadata.chunksByteOffset,
    metadata.chunksByteOffset,
    'parser subpath supports parseSync'
  );
  t.end();
});

test('RADSourceLoader reads inline RAD chunk metadata from a Blob', async t => {
  const data = makeRADFixture();
  const source = (await load(new Blob([data]), RADSourceLoader)) as RADSource;
  const metadata = await source.getMetadata();
  const chunk = await source.getChunk(0);
  const chunkMetadata = await source.getChunkMetadata(0);
  const chunkTables: MeshArrowTable[] = [];
  for await (const table of source.getChunkTables({maxChunks: 1})) {
    chunkTables.push(table);
  }

  t.equal(await source.getChunkCount(), 1, 'reports chunk count');
  t.equal(metadata.count, 2, 'loads metadata from Blob');
  t.equal(chunk.byteLength, makeRADChunkFixture().byteLength, 'reads inline chunk bytes');
  t.equal(chunkMetadata.base, 0, 'parses chunk base');
  t.equal(chunkMetadata.count, 2, 'parses chunk count');
  t.ok(chunkMetadata.payloadBytes > 0, 'parses chunk payload byte length');
  t.equal(chunkTables[0].data.numRows, 2, 'iterates decoded chunk tables');
  t.end();
});

test('parseRADChunkToGaussianSplats decodes Spark RADC chunk payloads', t => {
  const splats = parseRADChunkToGaussianSplats(makeRADChunkFixture());
  const childCounts = splats.loaderData?.childCounts as Uint16Array;
  const childStarts = splats.loaderData?.childStarts as Uint32Array;

  t.equal(splats.format, 'rad', 'reports RAD source format');
  t.equal(splats.splatCount, 2, 'decodes splat count');
  t.deepEqual(Array.from(splats.positions), [1, 2, 3, 4, 5, 6], 'decodes f32_lebytes centers');
  t.deepEqual(Array.from(splats.opacities), [0.25, 0.75], 'decodes alpha values');
  t.ok(Math.abs(splats.scales[0] - 0.02) < 0.003, 'decodes ln_0r8 scales');
  t.deepEqual(Array.from(splats.rotations), [1, 0, 0, 0, 1, 0, 0, 0], 'decodes rotations');
  t.deepEqual(Array.from(splats.colors), [64, 128, 191, 128, 191, 255], 'decodes RGB bytes');
  t.deepEqual(Array.from(childCounts), [0, 2], 'decodes LoD child counts');
  t.deepEqual(Array.from(childStarts), [0, 42], 'decodes LoD child starts');
  t.end();
});

test('parseRADChunkToGaussianSplats rejects truncated chunk payloads', t => {
  const chunk = makeRADChunkFixture();

  t.throws(
    () => parseRADChunkToGaussianSplats(chunk.slice(0, chunk.byteLength - 1)),
    /chunk payload is incomplete/,
    'rejects incomplete RADC payloads'
  );
  t.end();
});

test('parseRADChunkToGaussianSplats expands Spark LoD opacity bytes', t => {
  const splats = parseRADChunkToGaussianSplats(
    makeRADChunkFixture({
      alphaEncoding: 'r8',
      splatEncoding: {lodOpacity: true}
    })
  );

  t.ok(Math.abs(splats.opacities[0] - (64 / 255) * 2) < 1e-6, 'decodes opacity below one');
  t.ok(Math.abs(splats.opacities[1] - (191 / 255) * 2) < 1e-6, 'decodes opacity above one');
  t.end();
});

test('RADSourceLoader uses source-level splat encoding for chunk decoding', async t => {
  const source = (await load(
    new Blob([
      makeRADFixture({
        splatEncoding: {
          rgbMin: 0,
          rgbMax: 1,
          lnScaleMin: -12,
          lnScaleMax: 9,
          lodOpacity: true
        },
        chunkOptions: {
          alphaEncoding: 'r8',
          omitPropertyRanges: true
        }
      })
    ]),
    RADSourceLoader
  )) as RADSource;

  const splats = await source.getChunkSplats(0);

  t.ok(Math.abs(splats.scales[0] - 0.02) < 0.003, 'decodes top-level scale range');
  t.deepEqual(
    Array.from(splats.colors),
    [64, 128, 191, 128, 191, 255],
    'decodes top-level RGB range'
  );
  t.ok(Math.abs(splats.opacities[1] - (191 / 255) * 2) < 1e-6, 'uses top-level LoD opacity');
  t.end();
});

test('RADSourceLoader resolves and fetches sidecar RADC chunks', async t => {
  const chunk = makeRADChunkFixture();
  const rad = makeRADFixture({chunkFilename: 'chunks/scene-0.radc', inlineChunk: false});
  const fetchedUrls: string[] = [];
  const source = RADSourceLoader.createDataSource('https://example.com/assets/scene.rad', {
    core: {
      loadOptions: {
        core: {
          fetch: async (url: string | RequestInfo | URL) => {
            const urlString = String(url);
            fetchedUrls.push(urlString);
            return new Response(urlString.endsWith('.radc') ? chunk : rad);
          }
        }
      }
    }
  });

  const metadata = await source.getMetadata();
  const chunkUrl = await source.getChunkUrl(0);
  const sidecarChunk = await source.getChunk(0);

  t.equal(metadata.chunks[0].filename, 'chunks/scene-0.radc', 'parses sidecar chunk filename');
  t.equal(chunkUrl, 'https://example.com/assets/chunks/scene-0.radc', 'resolves sidecar chunk URL');
  t.deepEqual(
    fetchedUrls,
    ['https://example.com/assets/scene.rad', 'https://example.com/assets/chunks/scene-0.radc'],
    'fetches RAD header and sidecar chunk'
  );
  t.equal(sidecarChunk.byteLength, chunk.byteLength, 'loads sidecar chunk bytes');
  t.end();
});

test('RADSourceLoader bounds concurrent pruned chunk table reads', async t => {
  const chunk = makeRADChunkFixture();
  const rad = makeRADFixture({
    chunkFilenames: [
      'chunks/scene-0.radc',
      'chunks/scene-1.radc',
      'chunks/scene-2.radc',
      'chunks/scene-3.radc'
    ],
    inlineChunk: false
  });
  let activeChunkFetchCount = 0;
  let maxActiveChunkFetchCount = 0;
  const source = RADSourceLoader.createDataSource('https://example.com/assets/scene.rad', {
    core: {
      loadOptions: {
        core: {
          fetch: async (url: string | RequestInfo | URL) => {
            const urlString = String(url);
            if (!urlString.endsWith('.radc')) {
              return new Response(rad);
            }
            activeChunkFetchCount++;
            maxActiveChunkFetchCount = Math.max(maxActiveChunkFetchCount, activeChunkFetchCount);
            await new Promise(resolve => setTimeout(resolve, 10));
            activeChunkFetchCount--;
            return new Response(chunk);
          }
        }
      }
    }
  });

  const chunkTables: MeshArrowTable[] = [];
  for await (const table of source.getChunkTables({
    maxChunks: 4,
    maxConcurrentChunkRequests: 2,
    pruneLoadedLoDParents: true
  })) {
    chunkTables.push(table);
  }

  t.equal(chunkTables.length, 4, 'iterates all selected pruned chunk tables');
  t.equal(maxActiveChunkFetchCount, 2, 'limits concurrent chunk fetches');
  t.end();
});

test('RAD parsing validates magic headers', t => {
  t.throws(
    () => parseRADChunkHeader(new ArrayBuffer(16)),
    /RADC magic header/,
    'rejects invalid RADC chunk magic'
  );
  t.equal(
    resolveRADChunkUrl('https://example.com/path/scene.rad', '0.radc'),
    'https://example.com/path/0.radc',
    'resolves relative chunk URLs'
  );
  t.end();
});

/** Options for building deterministic RAD fixtures. */
type RADFixtureOptions = {
  /** Optional sidecar chunk filename. */
  chunkFilename?: string;
  /** Optional sidecar chunk filenames. */
  chunkFilenames?: string[];
  /** Whether to append chunk bytes inline after the RAD header. */
  inlineChunk?: boolean;
  /** Optional top-level RAD splat encoding metadata. */
  splatEncoding?: Record<string, unknown>;
  /** Optional deterministic RADC chunk fixture options. */
  chunkOptions?: RADChunkFixtureOptions;
};

/** Builds a deterministic single-chunk Spark RAD fixture. */
function makeRADFixture(options: RADFixtureOptions = {}): ArrayBuffer {
  const chunk = makeRADChunkFixture(options.chunkOptions);
  const inlineChunk = options.inlineChunk ?? true;
  const chunkFilenames =
    options.chunkFilenames || (options.chunkFilename ? [options.chunkFilename] : undefined);
  const chunkCount = chunkFilenames?.length || 1;
  const metadata = {
    version: 1,
    type: 'gsplat',
    count: chunkCount * 2,
    maxSh: 0,
    chunkSize: 2,
    allChunkBytes: inlineChunk ? chunk.byteLength * chunkCount : 0,
    chunks: Array.from({length: chunkCount}, (_, chunkIndex) => ({
      offset: inlineChunk ? chunk.byteLength * chunkIndex : 0,
      bytes: chunk.byteLength,
      filename: chunkFilenames?.[chunkIndex]
    })),
    splatEncoding: options.splatEncoding ?? {lodOpacity: true}
  };

  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const chunksByteOffset = 8 + roundUpToEight(metadataBytes.byteLength);
  const data = new ArrayBuffer(chunksByteOffset + (inlineChunk ? chunk.byteLength : 0));
  const dataView = new DataView(data);
  const bytes = new Uint8Array(data);

  dataView.setUint32(0, 0x30444152, true);
  dataView.setUint32(4, metadataBytes.byteLength, true);
  bytes.set(metadataBytes, 8);
  if (inlineChunk) {
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
      bytes.set(new Uint8Array(chunk), chunksByteOffset + chunk.byteLength * chunkIndex);
    }
  }
  return data;
}

/** Options for building deterministic RADC chunk fixtures. */
type RADChunkFixtureOptions = {
  /** Encoding used for the alpha property. */
  alphaEncoding?: 'f32' | 'r8';
  /** Optional chunk-local splat encoding metadata. */
  splatEncoding?: Record<string, unknown>;
  /** Whether quantized property min/max values should be omitted from property metadata. */
  omitPropertyRanges?: boolean;
};

/** Builds a deterministic Spark RADC chunk fixture. */
function makeRADChunkFixture(options: RADChunkFixtureOptions = {}): ArrayBuffer {
  const alphaPayload =
    options.alphaEncoding === 'r8'
      ? makeRADChunkPayload('alpha', 'r8', new Uint8Array([64, 191]), {min: 0, max: 1})
      : makeRADChunkPayload('alpha', 'f32', encodeF32(new Float32Array([0.25, 0.75]), 1, 2));
  const propertyPayloads = [
    makeRADChunkPayload(
      'center',
      'f32_lebytes',
      encodeF32LeBytes(new Float32Array([1, 2, 3, 4, 5, 6]), 3, 2),
      {
        compression: 'gz'
      }
    ),
    alphaPayload,
    makeRADChunkPayload(
      'rgb',
      'r8_delta',
      encodeR8Delta(new Float32Array([0.25, 0.5, 0.75, 0.5, 0.75, 1]), 3, 2, 0, 1),
      options.omitPropertyRanges ? {} : {min: 0, max: 1}
    ),
    makeRADChunkPayload(
      'scales',
      'ln_0r8',
      encodeScaleR8(new Float32Array([0.02, 0.03, 0.04, 0.05, 0.06, 0.07]), 3, 2, -12, 9),
      options.omitPropertyRanges ? {} : {min: -12, max: 9}
    ),
    makeRADChunkPayload('orientation', 'oct88r8', new Uint8Array([128, 128, 0, 128, 128, 0])),
    makeRADChunkPayload('child_count', 'u16', new Uint8Array([0, 0, 2, 0])),
    makeRADChunkPayload('child_start', 'u32', new Uint8Array([0, 0, 0, 0, 42, 0, 0, 0]))
  ];
  let payloadBytes = 0;
  const properties = propertyPayloads.map(payload => {
    const property = {
      offset: payloadBytes,
      bytes: payload.bytes.byteLength,
      property: payload.property,
      encoding: payload.encoding,
      compression: payload.compression,
      min: payload.min,
      max: payload.max
    };
    payloadBytes += roundUpToEight(payload.bytes.byteLength);
    return property;
  });
  const metadata = {
    version: 1,
    base: 0,
    count: 2,
    payloadBytes,
    maxSh: 0,
    lodTree: true,
    splatEncoding: options.splatEncoding,
    properties
  };
  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const payloadByteLengthOffset = 8 + roundUpToEight(metadataBytes.byteLength);
  const payloadByteOffset = payloadByteLengthOffset + 8;
  const data = new ArrayBuffer(payloadByteOffset + payloadBytes);
  const dataView = new DataView(data);
  const bytes = new Uint8Array(data);

  dataView.setUint32(0, 0x43444152, true);
  dataView.setUint32(4, metadataBytes.byteLength, true);
  bytes.set(metadataBytes, 8);
  dataView.setBigUint64(payloadByteLengthOffset, BigInt(payloadBytes), true);
  for (const payload of propertyPayloads) {
    bytes.set(
      payload.bytes,
      payloadByteOffset + properties[propertyPayloads.indexOf(payload)].offset
    );
  }
  return data;
}

/** One encoded RADC property fixture payload. */
type RADChunkPayload = {
  /** Property semantic name. */
  property: string;
  /** Property encoding name. */
  encoding: string;
  /** Encoded bytes. */
  bytes: Uint8Array;
  /** Optional property compression. */
  compression?: string;
  /** Optional quantization minimum. */
  min?: number;
  /** Optional quantization maximum. */
  max?: number;
};

/** Builds one encoded RADC property fixture payload. */
function makeRADChunkPayload(
  property: string,
  encoding: string,
  bytes: Uint8Array,
  options: {compression?: string; min?: number; max?: number} = {}
): RADChunkPayload {
  const encodedBytes =
    options.compression === 'gz'
      ? new Uint8Array(new DeflateCompression().compressSync(bytes.buffer.slice(0)))
      : bytes;
  return {property, encoding, bytes: encodedBytes, ...options};
}

/** Encodes row-major Float32 values into Spark planar f32 bytes. */
function encodeF32(values: Float32Array, dimensions: number, count: number): Uint8Array {
  const bytes = new Uint8Array(values.byteLength);
  const dataView = new DataView(bytes.buffer);
  for (let dimension = 0; dimension < dimensions; dimension++) {
    for (let rowIndex = 0; rowIndex < count; rowIndex++) {
      dataView.setFloat32(
        (dimension * count + rowIndex) * 4,
        values[rowIndex * dimensions + dimension],
        true
      );
    }
  }
  return bytes;
}

/** Encodes row-major Float32 values into Spark byte-plane f32 bytes. */
function encodeF32LeBytes(values: Float32Array, dimensions: number, count: number): Uint8Array {
  const bytes = new Uint8Array(values.byteLength);
  const scratch = new Uint8Array(4);
  const scratchView = new DataView(scratch.buffer);
  const stride = dimensions * count;
  for (let byteIndex = 0; byteIndex < 4; byteIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      for (let rowIndex = 0; rowIndex < count; rowIndex++) {
        scratchView.setFloat32(0, values[rowIndex * dimensions + dimension], true);
        bytes[byteIndex * stride + dimension * count + rowIndex] = scratch[byteIndex];
      }
    }
  }
  return bytes;
}

/** Encodes row-major Float32 values into Spark delta R8 bytes. */
function encodeR8Delta(
  values: Float32Array,
  dimensions: number,
  count: number,
  min: number,
  max: number
): Uint8Array {
  const bytes = new Uint8Array(values.length);
  for (let dimension = 0; dimension < dimensions; dimension++) {
    let last = 0;
    for (let rowIndex = 0; rowIndex < count; rowIndex++) {
      const value = Math.round(
        Math.min(
          Math.max(((values[rowIndex * dimensions + dimension] - min) / (max - min)) * 255, 0),
          255
        )
      );
      bytes[dimension * count + rowIndex] = (value - last) & 0xff;
      last = value;
    }
  }
  return bytes;
}

/** Encodes row-major linear scales into Spark scale8 bytes. */
function encodeScaleR8(
  values: Float32Array,
  dimensions: number,
  count: number,
  min: number,
  max: number
): Uint8Array {
  const bytes = new Uint8Array(values.length);
  for (let dimension = 0; dimension < dimensions; dimension++) {
    for (let rowIndex = 0; rowIndex < count; rowIndex++) {
      bytes[dimension * count + rowIndex] = encodeScale8(
        values[rowIndex * dimensions + dimension],
        min,
        max
      );
    }
  }
  return bytes;
}

/** Encodes one linear scale into Spark scale8. */
function encodeScale8(scale: number, min: number, max: number): number {
  if (scale <= 0) {
    return 0;
  }
  const normalized = (Math.log(scale) - min) / (max - min);
  return 1 + Math.round(Math.min(Math.max(normalized, 0), 1) * 254);
}

/** Rounds fixture byte lengths to RAD's 8-byte alignment. */
function roundUpToEight(byteLength: number): number {
  return (byteLength + 7) & ~7;
}
