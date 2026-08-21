// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {preprocess3DTileContent} from '../../../src/lib/parsers/preprocess-3d-tile-content';

/** Encodes a JSON object as an independent ArrayBuffer. */
function encodeJson(json: Record<string, any>): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(json));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** Encodes four-character binary magic and optional trailing bytes. */
function encodeMagic(magic: string, trailingByteLength = 0): ArrayBuffer {
  const bytes = new Uint8Array(4 + trailingByteLength);
  for (let index = 0; index < 4; index++) {
    bytes[index] = magic.charCodeAt(index);
  }
  return bytes.buffer;
}

test('preprocess3DTileContent detects supported binary magic', () => {
  for (const contentType of ['b3dm', 'i3dm', 'cmpt', 'pnts'] as const) {
    const arrayBuffer = encodeMagic(contentType, 8);
    const content = preprocess3DTileContent(arrayBuffer);
    expect(content.contentType).toBe(contentType);
    expect('binaryPayload' in content && content.binaryPayload).toBe(arrayBuffer);
  }

  const glbContent = preprocess3DTileContent(encodeMagic('glTF', 8));
  expect(glbContent.contentType).toBe('glb');
});

test('preprocess3DTileContent classifies tileset and glTF JSON by structure', () => {
  const tileset = preprocess3DTileContent(
    encodeJson({asset: {version: '1.1'}, root: {geometricError: 0}})
  );
  expect(tileset.contentType).toBe('externalTileset');
  expect('jsonPayload' in tileset && tileset.jsonPayload.asset.version).toBe('1.1');

  const gltf = preprocess3DTileContent(encodeJson({asset: {version: '2.0'}, meshes: []}));
  expect(gltf.contentType).toBe('gltf');
  expect('jsonPayload' in gltf && gltf.jsonPayload.asset.version).toBe('2.0');
});

test('preprocess3DTileContent rejects truncated, malformed, and unsupported payloads', () => {
  expect(() => preprocess3DTileContent(new Uint8Array([1, 2, 3]).buffer)).toThrow(
    /expected supported binary magic or JSON object/
  );
  expect(() => preprocess3DTileContent(new TextEncoder().encode('{broken').buffer)).toThrow(
    /expected supported binary magic or JSON object/
  );
  expect(() => preprocess3DTileContent(encodeJson({hello: 'world'}))).toThrow(
    /JSON must describe a tileset.*or a glTF asset/
  );
});
