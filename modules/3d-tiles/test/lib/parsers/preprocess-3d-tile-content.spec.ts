// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import test from 'tape-promise/tape';
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

test('preprocess3DTileContent detects supported binary magic', t => {
  for (const contentType of ['b3dm', 'i3dm', 'cmpt', 'pnts'] as const) {
    const arrayBuffer = encodeMagic(contentType, 8);
    const content = preprocess3DTileContent(arrayBuffer);
    t.equal(content.contentType, contentType);
    t.equal('binaryPayload' in content && content.binaryPayload, arrayBuffer, 'preserves payload');
  }

  const glbContent = preprocess3DTileContent(encodeMagic('glTF', 8));
  t.equal(glbContent.contentType, 'glb', 'normalizes binary glTF magic');
  t.end();
});

test('preprocess3DTileContent classifies tileset and glTF JSON by structure', t => {
  const tileset = preprocess3DTileContent(
    encodeJson({asset: {version: '1.1'}, root: {geometricError: 0}})
  );
  t.equal(tileset.contentType, 'externalTileset');
  t.equal('jsonPayload' in tileset && tileset.jsonPayload.asset.version, '1.1');

  const gltf = preprocess3DTileContent(encodeJson({asset: {version: '2.0'}, meshes: []}));
  t.equal(gltf.contentType, 'gltf');
  t.equal('jsonPayload' in gltf && gltf.jsonPayload.asset.version, '2.0');
  t.end();
});

test('preprocess3DTileContent rejects truncated, malformed, and unsupported payloads', t => {
  t.throws(
    () => preprocess3DTileContent(new Uint8Array([1, 2, 3]).buffer),
    /expected supported binary magic or JSON object/
  );
  t.throws(
    () => preprocess3DTileContent(new TextEncoder().encode('{broken').buffer),
    /expected supported binary magic or JSON object/
  );
  t.throws(
    () => preprocess3DTileContent(encodeJson({hello: 'world'})),
    /JSON must describe a tileset.*or a glTF asset/
  );
  t.end();
});
