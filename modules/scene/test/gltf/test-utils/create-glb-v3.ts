// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** A chunk to place before the JSON chunk in a draft GLB v3 fixture. */
export type GLBV3PrefixChunk = {
  /** Four-byte GLB chunk type. */
  type: number;
  /** Unpadded chunk payload. */
  data: Uint8Array;
};

/**
 * Create a GLB v3 fixture using the draft Khronos binary layout.
 * @param json - glTF JSON payload.
 * @param binaryChunks - BIN chunk payloads placed after the JSON chunk.
 * @param prefixChunks - Custom chunks placed before the JSON chunk.
 * @returns Encoded GLB v3 fixture.
 */
export function createGLBV3(
  json: Record<string, unknown>,
  binaryChunks: Uint8Array[] = [],
  prefixChunks: GLBV3PrefixChunk[] = []
): ArrayBuffer {
  const textEncoder = new TextEncoder();
  const jsonBytes = textEncoder.encode(JSON.stringify(json));
  const chunks = [
    ...prefixChunks,
    {type: 0x4e4f534a, data: jsonBytes},
    ...binaryChunks.map(data => ({type: 0x004e4942, data}))
  ];
  const fileByteLength = chunks.reduce(
    (byteLength, chunk) => byteLength + 16 + padToFourBytes(chunk.data.byteLength),
    16
  );
  const arrayBuffer = new ArrayBuffer(fileByteLength);
  const dataView = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);

  dataView.setUint32(0, 0x46546c67, true);
  dataView.setUint32(4, 3, true);
  dataView.setBigUint64(8, BigInt(fileByteLength), true);

  let byteOffset = 16;
  for (const chunk of chunks) {
    const chunkByteLength = padToFourBytes(chunk.data.byteLength);
    dataView.setUint32(byteOffset, chunk.type, true);
    dataView.setUint32(byteOffset + 4, 0, true);
    dataView.setBigUint64(byteOffset + 8, BigInt(chunkByteLength), true);
    const paddingByte = chunk.type === 0x4e4f534a ? 0x20 : 0;
    bytes.fill(paddingByte, byteOffset + 16, byteOffset + 16 + chunkByteLength);
    bytes.set(chunk.data, byteOffset + 16);
    byteOffset += 16 + chunkByteLength;
  }

  return arrayBuffer;
}

/** Round a byte length up to the four-byte alignment required by GLB chunks. */
function padToFourBytes(byteLength: number): number {
  return Math.ceil(byteLength / 4) * 4;
}
