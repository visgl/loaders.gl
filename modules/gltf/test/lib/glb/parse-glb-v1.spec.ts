// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parseGLBSync} from '../../../src/lib/parsers/parse-glb';
import type {GLB} from '../../../src/lib/types/glb-types';
import {createGLBV1} from '../../test-utils/create-glb-v1';

test.each([
  {byteOffset: 0, bodyLength: 4},
  {byteOffset: 12, bodyLength: 4},
  {byteOffset: 12, bodyLength: 3},
  {byteOffset: 0, bodyLength: 0}
])('GLB 1 bounds the binary body ($byteOffset, $bodyLength)', ({byteOffset, bodyLength}) => {
  const body = new Uint8Array([1, 2, 3, 4]).subarray(0, bodyLength);
  const fixture = createGLBV1({asset: {version: '1.0'}}, body);
  const container = new Uint8Array(byteOffset + fixture.byteLength + 8);
  container.fill(0xff);
  container.set(new Uint8Array(fixture), byteOffset);
  const glb = {} as GLB;

  expect(parseGLBSync(glb, container.buffer, byteOffset)).toBe(byteOffset + fixture.byteLength);
  expect(glb.json).toEqual({asset: {version: '1.0'}});
  expect(glb.header.hasBinChunk).toBe(bodyLength > 0);
  expect(glb.binChunks).toHaveLength(bodyLength > 0 ? 1 : 0);
  if (bodyLength > 0) {
    const chunk = glb.binChunks[0];
    expect(chunk.byteLength).toBe(bodyLength);
    expect(
      Array.from(new Uint8Array(chunk.arrayBuffer, chunk.byteOffset, chunk.byteLength))
    ).toEqual(Array.from(body));
  }
});

test('GLB 1 rejects a file length beyond the available bytes', () => {
  const fixture = createGLBV1({asset: {version: '1.0'}});
  new DataView(fixture).setUint32(8, fixture.byteLength + 4, true);
  expect(() => parseGLBSync({} as GLB, fixture)).toThrow();
});

test('GLB 1 rejects JSON extending beyond the declared file, even with trailing bytes', () => {
  const fixture = createGLBV1({asset: {version: '1.0'}}, new Uint8Array(4));
  new DataView(fixture).setUint32(8, 24, true);
  expect(() => parseGLBSync({} as GLB, fixture)).toThrow(
    /JSON content extends beyond the declared file length/
  );
});
