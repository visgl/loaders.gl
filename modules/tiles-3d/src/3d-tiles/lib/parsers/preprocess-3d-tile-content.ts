// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/CesiumGS/cesium/blob/main/LICENSE.md

import {TILE3D_TYPE} from '../constants';

/** Binary 3D Tiles content types supported by {@link preprocess3DTileContent}. */
export type Tiles3DBinaryContentType = 'b3dm' | 'i3dm' | 'cmpt' | 'pnts' | 'glb';

/** JSON 3D Tiles content types supported by {@link preprocess3DTileContent}. */
export type Tiles3DJsonContentType = 'externalTileset' | 'gltf';

/** Content categories returned by {@link preprocess3DTileContent}. */
export type Tiles3DContentType = Tiles3DBinaryContentType | Tiles3DJsonContentType;

/** Structure-first classification of a binary 3D Tiles resource. */
export type Preprocessed3DTileContent =
  | {
      /** Detected binary format. `glTF` magic is normalized to the unambiguous `glb` label. */
      contentType: Tiles3DBinaryContentType;
      /** Original binary payload. */
      binaryPayload: ArrayBuffer;
    }
  | {
      /** External tileset JSON detected from `asset` and `root` objects. */
      contentType: 'externalTileset';
      /** Parsed JSON payload, reused by the downstream parser. */
      jsonPayload: Record<string, any>;
    }
  | {
      /** JSON glTF detected from an `asset` object without a tileset root. */
      contentType: 'gltf';
      /** Parsed JSON payload, reused by the downstream parser. */
      jsonPayload: Record<string, any>;
    };

const BINARY_CONTENT_TYPES: ReadonlySet<string> = new Set([
  TILE3D_TYPE.BATCHED_3D_MODEL,
  TILE3D_TYPE.INSTANCED_3D_MODEL,
  TILE3D_TYPE.COMPOSITE,
  TILE3D_TYPE.POINT_CLOUD,
  TILE3D_TYPE.GLTF
]);

/**
 * Detects a supported 3D Tiles payload from its bytes rather than its URL or MIME type.
 *
 * Binary formats use their four-byte magic. The historical binary glTF magic is `glTF`; the
 * returned type is normalized to `glb` so it cannot be confused with JSON glTF. Payloads without
 * supported binary magic are decoded once as JSON and classified by required top-level structure.
 * This allows signed, extensionless, and misleadingly named resources to load consistently.
 *
 * @param arrayBuffer - Complete resource payload beginning at byte zero.
 * @returns Detected content type and either the original binary bytes or parsed JSON.
 * @throws If the payload is truncated, malformed, or not a supported 3D Tiles content structure.
 */
export function preprocess3DTileContent(arrayBuffer: ArrayBuffer): Preprocessed3DTileContent {
  if (arrayBuffer.byteLength >= 4) {
    const magic = getMagic(arrayBuffer);
    if (BINARY_CONTENT_TYPES.has(magic)) {
      return {
        contentType: magic === TILE3D_TYPE.GLTF ? 'glb' : (magic as Tiles3DBinaryContentType),
        binaryPayload: arrayBuffer
      };
    }
  }

  const jsonPayload = parseJsonContent(arrayBuffer);
  if (isRecord(jsonPayload.root) && isRecord(jsonPayload.asset)) {
    return {contentType: 'externalTileset', jsonPayload};
  }
  if (isRecord(jsonPayload.asset)) {
    return {contentType: 'gltf', jsonPayload};
  }

  throw new Error(
    'Invalid 3D Tiles content: JSON must describe a tileset with root and asset objects or a glTF asset'
  );
}

/**
 * Reads the first four payload bytes as an ASCII magic string.
 *
 * @param arrayBuffer - Payload containing at least four bytes.
 * @returns Four-character magic string.
 */
function getMagic(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer, 0, 4);
  return String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
}

/**
 * Decodes and parses a JSON candidate with a stable 3D Tiles diagnostic.
 *
 * @param arrayBuffer - Payload not recognized as a supported binary format.
 * @returns Parsed JSON object.
 * @throws If the bytes are not valid JSON or the JSON root is not an object.
 */
function parseJsonContent(arrayBuffer: ArrayBuffer): Record<string, any> {
  try {
    const text = new TextDecoder('utf-8', {fatal: true}).decode(arrayBuffer).replace(/^\uFEFF/, '');
    const jsonPayload = JSON.parse(text);
    if (isRecord(jsonPayload)) {
      return jsonPayload;
    }
  } catch {
    // A single public diagnostic keeps malformed text and binary failures deterministic.
  }

  throw new Error('Invalid 3D Tiles content: expected supported binary magic or JSON object');
}

/**
 * Tests whether a value is a non-null, non-array object.
 *
 * @param value - Candidate JSON value.
 * @returns `true` when the value can provide named JSON properties.
 */
function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
