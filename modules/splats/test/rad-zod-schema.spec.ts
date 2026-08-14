// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseRADHeader} from '@loaders.gl/splats/rad-loader';
import {RADChunkMetadataJSONSchema, RADMetadataJSONSchema} from '@loaders.gl/splats/rad-zod-schema';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

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
  const jsonBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const data = new ArrayBuffer(8 + jsonBytes.byteLength);
  const dataView = new DataView(data);
  dataView.setUint32(0, 0x30444152, true);
  dataView.setUint32(4, jsonBytes.byteLength, true);
  new Uint8Array(data, 8).set(jsonBytes);
  return data;
}
