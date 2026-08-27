import {expect, test} from 'vitest';
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
test('RADLoader parses Spark RAD metadata', async () => {
  const data = makeRADFixture();
  const metadata = await parse(data, RADLoader);
  expect(metadata.version, 'parses version').toBe(1);
  expect(metadata.type, 'parses RAD type').toBe('gsplat');
  expect(metadata.count, 'parses splat count').toBe(2);
  expect(metadata.chunks.length, 'parses chunk table').toBe(1);
  expect(metadata.chunks[0].bytes, 'parses chunk byte length').toBe(
    makeRADChunkFixture().byteLength
  );
  expect(metadata.splatEncoding?.lodOpacity, 'parses splat encoding').toBe(true);
  const syncMetadata = parseSync(data, RADLoaderWithParser);
  expect(syncMetadata.chunksByteOffset, 'parser subpath supports parseSync').toBe(
    metadata.chunksByteOffset
  );
});
test('RADSourceLoader reads inline RAD chunk metadata from a Blob', async () => {
  const data = makeRADFixture();
  const source = (await load(new Blob([data]), RADSourceLoader)) as RADSource;
  const metadata = await source.getMetadata();
  const chunk = await source.getChunk(0);
  const chunkMetadata = await source.getChunkMetadata(0);
  const chunkTables: MeshArrowTable[] = [];
  for await (const table of source.getChunkTables({maxChunks: 1})) {
    chunkTables.push(table);
  }
  expect(await source.getChunkCount(), 'reports chunk count').toBe(1);
  expect(metadata.count, 'loads metadata from Blob').toBe(2);
  expect(chunk.byteLength, 'reads inline chunk bytes').toBe(makeRADChunkFixture().byteLength);
  expect(chunkMetadata.base, 'parses chunk base').toBe(0);
  expect(chunkMetadata.count, 'parses chunk count').toBe(2);
  expect(chunkMetadata.payloadBytes > 0, 'parses chunk payload byte length').toBeTruthy();
  expect(chunkTables[0].data.numRows, 'iterates decoded chunk tables').toBe(2);
});
test('parseRADChunkToGaussianSplats decodes Spark RADC chunk payloads', () => {
  const splats = parseRADChunkToGaussianSplats(makeRADChunkFixture());
  const childCounts = splats.loaderData?.childCounts as Uint16Array;
  const childStarts = splats.loaderData?.childStarts as Uint32Array;
  expect(splats.format, 'reports RAD source format').toBe('rad');
  expect(splats.splatCount, 'decodes splat count').toBe(2);
  expect(Array.from(splats.positions), 'decodes f32_lebytes centers').toEqual([1, 2, 3, 4, 5, 6]);
  expect(Array.from(splats.opacities), 'decodes alpha values').toEqual([0.25, 0.75]);
  expect(Math.abs(splats.scales[0] - 0.02) < 0.003, 'decodes ln_0r8 scales').toBeTruthy();
  expect(Array.from(splats.rotations), 'decodes rotations').toEqual([1, 0, 0, 0, 1, 0, 0, 0]);
  expect(Array.from(splats.colors), 'decodes RGB bytes').toEqual([64, 128, 191, 128, 191, 255]);
  expect(Array.from(childCounts), 'decodes LoD child counts').toEqual([0, 2]);
  expect(Array.from(childStarts), 'decodes LoD child starts').toEqual([0, 42]);
});
test('parseRADChunkToGaussianSplats rejects truncated chunk payloads', () => {
  const chunk = makeRADChunkFixture();
  expect(
    () => parseRADChunkToGaussianSplats(chunk.slice(0, chunk.byteLength - 1)),
    'rejects incomplete RADC payloads'
  ).toThrow(/chunk payload is incomplete/);
});
test('parseRADChunkToGaussianSplats expands Spark LoD opacity bytes', () => {
  const splats = parseRADChunkToGaussianSplats(
    makeRADChunkFixture({
      alphaEncoding: 'r8',
      splatEncoding: {lodOpacity: true}
    })
  );
  expect(
    Math.abs(splats.opacities[0] - (64 / 255) * 2) < 1e-6,
    'decodes opacity below one'
  ).toBeTruthy();
  expect(
    Math.abs(splats.opacities[1] - (191 / 255) * 2) < 1e-6,
    'decodes opacity above one'
  ).toBeTruthy();
});

test('parseRADChunkToGaussianSplats supports alternate numeric encodings and defaults', () => {
  const splats = parseRADChunkToGaussianSplats(
    makeRADChunkFixture({
      alphaEncoding: 'r8',
      centerEncoding: 'f16',
      rgbEncoding: 'r8',
      scalesEncoding: 'ln_f16',
      orientationEncoding: 'f16',
      includeLoDTree: false
    })
  );

  expect(Array.from(splats.positions)).toEqual([1, 2, 3, 4, 5, 6]);
  expect(Array.from(splats.colors)).toEqual([64, 128, 191, 128, 191, 255]);
  expect(splats.opacities[0]).toBeCloseTo(64 / 255);
  expect(splats.scales[0]).toBeCloseTo(0.5, 2);
  expect(Array.from(splats.rotations)).toHaveLength(8);
  expect(splats.loaderData?.childCounts).toBeUndefined();
});

test('parseRADChunkToGaussianSplats decodes signed and delta scale encodings', () => {
  for (const scalesEncoding of ['s8', 's8_delta'] as const) {
    const splats = parseRADChunkToGaussianSplats(
      makeRADChunkFixture({scalesEncoding, scaleMax: 2})
    );
    expect(splats.scales[0]).toBeCloseTo(0.5, 1);
    expect(splats.scales[3]).toBeCloseTo(1, 1);
  }
});

test('parseRADChunkToGaussianSplats supplies defaults for optional properties', () => {
  const splats = parseRADChunkToGaussianSplats(
    makeRADChunkFixture({omitProperties: ['alpha', 'rgb', 'scales', 'orientation']})
  );

  expect(Array.from(splats.opacities)).toEqual([1, 1]);
  expect(Array.from(splats.colors)).toEqual([255, 255, 255, 255, 255, 255]);
  expect(Array.from(splats.scales)).toEqual([1, 1, 1, 1, 1, 1]);
  expect(Array.from(splats.rotations)).toEqual([1, 0, 0, 0, 1, 0, 0, 0]);
});

test('parseRADChunkToGaussianSplats decodes spherical harmonic rest coefficients', () => {
  const splats = parseRADChunkToGaussianSplats(
    makeRADChunkFixture({includeSphericalHarmonics: true}),
    {radChunk: {includeSphericalHarmonics: true}}
  );

  expect(splats.sphericalHarmonicsComponentCount).toBe(9);
  expect(splats.sphericalHarmonics).toHaveLength(18);
  expect(splats.sphericalHarmonics?.[0]).toBeCloseTo(0.1);
});

test('parseRADChunkToGaussianSplats rejects missing quantization ranges', () => {
  expect(() =>
    parseRADChunkToGaussianSplats(
      makeRADChunkFixture({omitPropertyRanges: true, splatEncoding: {}})
    )
  ).toThrow(/property rgb is missing min/);
});
test('RADSourceLoader uses source-level splat encoding for chunk decoding', async () => {
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
  expect(Math.abs(splats.scales[0] - 0.02) < 0.003, 'decodes top-level scale range').toBeTruthy();
  expect(Array.from(splats.colors), 'decodes top-level RGB range').toEqual([
    64, 128, 191, 128, 191, 255
  ]);
  expect(
    Math.abs(splats.opacities[1] - (191 / 255) * 2) < 1e-6,
    'uses top-level LoD opacity'
  ).toBeTruthy();
});
test('RADSourceLoader resolves and fetches sidecar RADC chunks', async () => {
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
  expect(metadata.chunks[0].filename, 'parses sidecar chunk filename').toBe('chunks/scene-0.radc');
  expect(chunkUrl, 'resolves sidecar chunk URL').toBe(
    'https://example.com/assets/chunks/scene-0.radc'
  );
  expect(fetchedUrls, 'fetches RAD header and sidecar chunk').toEqual([
    'https://example.com/assets/scene.rad',
    'https://example.com/assets/chunks/scene-0.radc'
  ]);
  expect(sidecarChunk.byteLength, 'loads sidecar chunk bytes').toBe(chunk.byteLength);
});
test('RADSourceLoader bounds concurrent pruned chunk table reads', async () => {
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
  expect(chunkTables.length, 'iterates all selected pruned chunk tables').toBe(4);
  expect(maxActiveChunkFetchCount, 'limits concurrent chunk fetches').toBe(2);
});
test('RAD parsing validates magic headers', () => {
  expect(
    () => parseRADChunkHeader(new ArrayBuffer(16)),
    'rejects invalid RADC chunk magic'
  ).toThrow(/RADC magic header/);
  expect(
    resolveRADChunkUrl('https://example.com/path/scene.rad', '0.radc'),
    'resolves relative chunk URLs'
  ).toBe('https://example.com/path/0.radc');
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
  /** Encoding used for the center property. */
  centerEncoding?: 'f32' | 'f16' | 'f32_lebytes' | 'f16_lebytes';
  /** Encoding used for the RGB property. */
  rgbEncoding?: 'r8' | 'r8_delta';
  /** Encoding used for the scale property. */
  scalesEncoding?: 'ln_0r8' | 'ln_f16' | 's8' | 's8_delta';
  /** Encoding used for the orientation property. */
  orientationEncoding?: 'oct88r8' | 'f32' | 'f16';
  /** Maximum value used by signed scale encodings. */
  scaleMax?: number;
  /** Whether LoD child properties are included. */
  includeLoDTree?: boolean;
  /** Optional property names omitted from the chunk. */
  omitProperties?: string[];
  /** Whether one spherical harmonic rest property is included. */
  includeSphericalHarmonics?: boolean;
  /** Optional chunk-local splat encoding metadata. */
  splatEncoding?: Record<string, unknown>;
  /** Whether quantized property min/max values should be omitted from property metadata. */
  omitPropertyRanges?: boolean;
};
/** Builds a deterministic Spark RADC chunk fixture. */
function makeRADChunkFixture(options: RADChunkFixtureOptions = {}): ArrayBuffer {
  const centerEncoding = options.centerEncoding ?? 'f32_lebytes';
  const rgbEncoding = options.rgbEncoding ?? 'r8_delta';
  const scalesEncoding = options.scalesEncoding ?? 'ln_0r8';
  const orientationEncoding = options.orientationEncoding ?? 'oct88r8';
  const includeLoDTree = options.includeLoDTree ?? true;
  const alphaPayload =
    options.alphaEncoding === 'r8'
      ? makeRADChunkPayload('alpha', 'r8', new Uint8Array([64, 191]), {min: 0, max: 1})
      : makeRADChunkPayload('alpha', 'f32', encodeF32(new Float32Array([0.25, 0.75]), 1, 2));
  const propertyPayloads = [
    makeRADChunkPayload(
      'center',
      centerEncoding,
      encodeNumericValues(new Float32Array([1, 2, 3, 4, 5, 6]), 3, 2, centerEncoding),
      {
        compression: 'gz'
      }
    ),
    alphaPayload,
    makeRADChunkPayload(
      'rgb',
      rgbEncoding,
      rgbEncoding === 'r8'
        ? new Uint8Array([64, 128, 128, 191, 191, 255])
        : encodeR8Delta(new Float32Array([0.25, 0.5, 0.75, 0.5, 0.75, 1]), 3, 2, 0, 1),
      options.omitPropertyRanges ? {} : {min: 0, max: 1}
    ),
    makeRADChunkPayload(
      'scales',
      scalesEncoding,
      encodeScaleValues(scalesEncoding, options.scaleMax ?? 2),
      options.omitPropertyRanges
        ? {}
        : scalesEncoding === 'ln_0r8'
          ? {min: -12, max: 9}
          : {max: options.scaleMax ?? 2}
    ),
    makeRADChunkPayload(
      'orientation',
      orientationEncoding,
      orientationEncoding === 'oct88r8'
        ? new Uint8Array([128, 128, 0, 128, 128, 0])
        : encodeNumericValues(new Float32Array([0, 0, 0, 0, 0, 0]), 3, 2, orientationEncoding)
    ),
    ...(options.includeSphericalHarmonics
      ? [
          makeRADChunkPayload(
            'sh1',
            'f32',
            encodeF32(
              new Float32Array(Array.from({length: 18}, (_, index) => (index + 1) / 10)),
              9,
              2
            )
          )
        ]
      : []),
    ...(includeLoDTree
      ? [
          makeRADChunkPayload('child_count', 'u16', new Uint8Array([0, 0, 2, 0])),
          makeRADChunkPayload('child_start', 'u32', new Uint8Array([0, 0, 0, 0, 42, 0, 0, 0]))
        ]
      : [])
  ].filter(payload => !options.omitProperties?.includes(payload.property));
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
    maxSh: options.includeSphericalHarmonics ? 1 : 0,
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
  options: {
    compression?: string;
    min?: number;
    max?: number;
  } = {}
): RADChunkPayload {
  const encodedBytes =
    options.compression === 'gz'
      ? new Uint8Array(new DeflateCompression().compressSync(bytes.buffer.slice(0)))
      : bytes;
  return {property, encoding, bytes: encodedBytes, ...options};
}

/** Encodes numeric fixture values using one of Spark's planar encodings. */
function encodeNumericValues(
  values: Float32Array,
  dimensions: number,
  count: number,
  encoding: 'f32' | 'f16' | 'f32_lebytes' | 'f16_lebytes'
): Uint8Array {
  switch (encoding) {
    case 'f32':
      return encodeF32(values, dimensions, count);
    case 'f16':
      return encodeF16(values, dimensions, count);
    case 'f32_lebytes':
      return encodeF32LeBytes(values, dimensions, count);
    case 'f16_lebytes':
      return encodeF16LeBytes(values, dimensions, count);
  }
}

/** Encodes fixture scale values using Spark's scale encodings. */
function encodeScaleValues(
  encoding: 'ln_0r8' | 'ln_f16' | 's8' | 's8_delta',
  scaleMax: number
): Uint8Array {
  if (encoding === 'ln_0r8') {
    return encodeScaleR8(new Float32Array([0.02, 0.03, 0.04, 0.05, 0.06, 0.07]), 3, 2, -12, 9);
  }
  const values = new Float32Array([0.5, 0.75, 1, 1, 1.25, 1.5]);
  switch (encoding) {
    case 'ln_f16':
      return encodeF16(
        Float32Array.from(values, value => Math.log(value)),
        3,
        2
      );
    case 's8':
      return encodeS8(values, 3, 2, scaleMax);
    case 's8_delta':
      return encodeS8Delta(values, 3, 2, scaleMax);
  }
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

/** Encodes row-major Float32 values into Spark planar Float16 bytes. */
function encodeF16(values: Float32Array, dimensions: number, count: number): Uint8Array {
  const bytes = new Uint8Array(values.length * 2);
  const dataView = new DataView(bytes.buffer);
  for (let dimension = 0; dimension < dimensions; dimension++) {
    for (let rowIndex = 0; rowIndex < count; rowIndex++) {
      dataView.setUint16(
        (dimension * count + rowIndex) * 2,
        float32ToFloat16(values[rowIndex * dimensions + dimension]),
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

/** Encodes row-major Float32 values into Spark byte-plane Float16 bytes. */
function encodeF16LeBytes(values: Float32Array, dimensions: number, count: number): Uint8Array {
  const bytes = new Uint8Array(values.length * 2);
  const scratch = new Uint8Array(2);
  const scratchView = new DataView(scratch.buffer);
  const stride = dimensions * count;
  for (let byteIndex = 0; byteIndex < 2; byteIndex++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      for (let rowIndex = 0; rowIndex < count; rowIndex++) {
        scratchView.setUint16(0, float32ToFloat16(values[rowIndex * dimensions + dimension]), true);
        bytes[byteIndex * stride + dimension * count + rowIndex] = scratch[byteIndex];
      }
    }
  }
  return bytes;
}

/** Encodes signed values into Spark planar S8 bytes. */
function encodeS8(
  values: Float32Array,
  dimensions: number,
  count: number,
  max: number
): Uint8Array {
  const bytes = new Uint8Array(values.length);
  for (let dimension = 0; dimension < dimensions; dimension++) {
    for (let rowIndex = 0; rowIndex < count; rowIndex++) {
      bytes[dimension * count + rowIndex] =
        Math.round((values[rowIndex * dimensions + dimension] / max) * 127) & 0xff;
    }
  }
  return bytes;
}

/** Encodes signed values into Spark delta-compressed S8 bytes. */
function encodeS8Delta(
  values: Float32Array,
  dimensions: number,
  count: number,
  max: number
): Uint8Array {
  const bytes = new Uint8Array(values.length);
  for (let dimension = 0; dimension < dimensions; dimension++) {
    let last = 0;
    for (let rowIndex = 0; rowIndex < count; rowIndex++) {
      const value = Math.round((values[rowIndex * dimensions + dimension] / max) * 127) & 0xff;
      bytes[dimension * count + rowIndex] = (value - last) & 0xff;
      last = value;
    }
  }
  return bytes;
}

/** Converts a finite Float32 value to its IEEE 754 binary16 representation. */
function float32ToFloat16(value: number): number {
  const float32Array = new Float32Array([value]);
  const uint32Array = new Uint32Array(float32Array.buffer);
  const bits = uint32Array[0];
  const sign = (bits >>> 16) & 0x8000;
  const exponent = ((bits >>> 23) & 0xff) - 112;
  const mantissa = bits & 0x7fffff;
  if (exponent <= 0) {
    return sign | (mantissa >> 13);
  }
  if (exponent >= 31) {
    return sign | 0x7c00;
  }
  return sign | (exponent << 10) | (mantissa >> 13);
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
