// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Create a small GLB 1 fixture with padded JSON and an optional binary body. */
export function createGLBV1(
  json: Record<string, unknown>,
  body: Uint8Array = new Uint8Array()
): ArrayBuffer {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const paddedJsonLength = Math.ceil(jsonBytes.byteLength / 4) * 4;
  const binary = new Uint8Array(20 + paddedJsonLength + body.byteLength);
  const header = new DataView(binary.buffer);
  [0x46546c67, 1, binary.byteLength, paddedJsonLength, 0].forEach((value, index) => {
    header.setUint32(index * 4, value, true);
  });
  binary.fill(0x20, 20, 20 + paddedJsonLength);
  binary.set(jsonBytes, 20);
  binary.set(body, 20 + paddedJsonLength);
  return binary.buffer;
}
