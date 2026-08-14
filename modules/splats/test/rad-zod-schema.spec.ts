// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  parseRADChunkHeader,
  parseRADHeader,
  tryParseRADHeader
} from '@loaders.gl/splats/rad-loader';
import {RADChunkMetadataJSONSchema, RADMetadataJSONSchema} from '@loaders.gl/splats/rad-zod-schema';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {isRAD} from '../src/lib/parse-rad';

describe('RAD metadata schemas', () => {
  it('validates RAD and RADC metadata while preserving extensions', () => {
    const metadata = RADMetadataJSONSchema.parse({
      version: 1,
      type: 'gsplat',
      count: 2,
      maxSh: 3,
      chunks: [{offset: 0, bytes: 128, vendorChunk: true}],
      splatEncoding: {rgbMin: 0, rgbMax: 1, lodOpacity: true},
      vendor: {generator: 'Spark'}
    });
    const chunkMetadata = RADChunkMetadataJSONSchema.parse({
      version: 1,
      base: 0,
      count: 2,
      payloadBytes: 128,
      properties: [
        {offset: 0, bytes: 24, property: 'center', encoding: 'f32_lebytes', vendor: true}
      ],
      vendor: {chunk: 0}
    });

    expect(metadata.vendor).toEqual({generator: 'Spark'});
    expect(metadata.chunks[0].vendorChunk).toBe(true);
    expect(chunkMetadata.vendor).toEqual({chunk: 0});
    expect(chunkMetadata.properties[0].vendor).toBe(true);
  });

  it('rejects unsupported and unsafe metadata at the parser boundary', () => {
    expect(() =>
      parseRADHeader(makeRADHeader({version: 2, type: 'gsplat', count: 0, chunks: []}))
    ).toThrow();
    expect(
      RADMetadataJSONSchema.safeParse({
        version: 1,
        type: 'gsplat',
        count: Number.MAX_SAFE_INTEGER + 1,
        chunks: []
      }).success
    ).toBe(false);
  });

  it('recognizes RAD buffers and reports incomplete or malformed headers', () => {
    const header = makeRADHeader({version: 1, type: 'gsplat', count: 0, chunks: []});

    expect(isRAD(new Uint8Array(header))).toBe(true);
    expect(isRAD(new Uint8Array(3))).toBe(false);
    expect(tryParseRADHeader(header.slice(0, 7))).toBeNull();
    expect(tryParseRADHeader(header.slice(0, 8))).toBeNull();
    expect(() => parseRADHeader(header.slice(0, 7))).toThrow(/complete RAD metadata header/);
    expect(() => tryParseRADHeader(new ArrayBuffer(8))).toThrow(/RAD0 magic header/);
    expect(() => parseRADHeader(makeRADHeaderFromJSON('{'))).toThrow(
      /failed to parse RAD metadata JSON/
    );
  });

  it('validates the RADC binary envelope around schema-validated metadata', () => {
    const metadata = {version: 1, base: 0, count: 0, payloadBytes: 0, properties: []};
    const parsedMetadata = parseRADChunkHeader(makeRADCHeader(metadata));

    expect(parsedMetadata.payloadBytes).toBe(0);
    expect(parsedMetadata.chunkByteLength).toBe(parsedMetadata.payloadByteOffset);
    expect(() => parseRADChunkHeader(new ArrayBuffer(7))).toThrow(/8-byte metadata header/);
    expect(() => parseRADChunkHeader(makeIncompleteRADCHeader())).toThrow(
      /complete metadata header/
    );
    expect(() =>
      parseRADChunkHeader(makeRADCHeader({...metadata, payloadBytes: 1}, {binaryPayloadBytes: 0n}))
    ).toThrow(/payload byte length does not match/);
    expect(() =>
      parseRADChunkHeader(
        makeRADCHeader(metadata, {binaryPayloadBytes: BigInt(Number.MAX_SAFE_INTEGER) + 1n})
      )
    ).toThrow(/exceeds Number.MAX_SAFE_INTEGER/);
  });

  it('exports RAD and RADC JSON Schemas', () => {
    const radJsonSchema = z.toJSONSchema(RADMetadataJSONSchema, {target: 'draft-7'});
    const radcJsonSchema = z.toJSONSchema(RADChunkMetadataJSONSchema, {target: 'draft-7'});

    expect(radJsonSchema.required).toEqual(
      expect.arrayContaining(['version', 'type', 'count', 'chunks'])
    );
    expect(radcJsonSchema.required).toEqual(
      expect.arrayContaining(['version', 'base', 'count', 'payloadBytes', 'properties'])
    );
  });
});

/** Builds a minimal binary RAD header around the supplied JSON metadata. */
function makeRADHeader(metadata: unknown): ArrayBuffer {
  return makeRADHeaderFromJSON(JSON.stringify(metadata));
}

/** Builds a minimal binary RAD header around the supplied raw JSON text. */
function makeRADHeaderFromJSON(json: string): ArrayBuffer {
  const jsonBytes = new TextEncoder().encode(json);
  const data = new ArrayBuffer(8 + jsonBytes.byteLength);
  const dataView = new DataView(data);
  dataView.setUint32(0, 0x30444152, true);
  dataView.setUint32(4, jsonBytes.byteLength, true);
  new Uint8Array(data, 8).set(jsonBytes);
  return data;
}

/** Options for building a minimal binary RADC header. */
type RADCHeaderOptions = {
  /** Payload byte length stored in the binary envelope. */
  binaryPayloadBytes?: bigint;
};

/** Builds a complete binary RADC header around the supplied JSON metadata. */
function makeRADCHeader(
  metadata: {payloadBytes: number},
  options: RADCHeaderOptions = {}
): ArrayBuffer {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const alignedJsonByteLength = (jsonBytes.byteLength + 7) & ~7;
  const payloadByteLengthOffset = 8 + alignedJsonByteLength;
  const data = new ArrayBuffer(payloadByteLengthOffset + 8);
  const dataView = new DataView(data);
  dataView.setUint32(0, 0x43444152, true);
  dataView.setUint32(4, jsonBytes.byteLength, true);
  new Uint8Array(data, 8).set(jsonBytes);
  dataView.setBigUint64(
    payloadByteLengthOffset,
    options.binaryPayloadBytes ?? BigInt(metadata.payloadBytes),
    true
  );
  return data;
}

/** Builds a RADC prefix whose declared metadata is not yet fully available. */
function makeIncompleteRADCHeader(): ArrayBuffer {
  const data = new ArrayBuffer(8);
  const dataView = new DataView(data);
  dataView.setUint32(0, 0x43444152, true);
  dataView.setUint32(4, 1, true);
  return data;
}
