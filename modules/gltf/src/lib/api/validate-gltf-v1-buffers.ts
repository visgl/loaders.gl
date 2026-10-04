// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFWithBuffers} from '../types/gltf-types';

/** Check all declared and borrowed buffer spans before conversion; infer only URI-backed lengths. */
export function validateGLTFV1Buffers(
  gltf: GLTFWithBuffers,
  uriBufferIndices: ReadonlySet<number>,
  reportUnsupported: (feature: string) => void,
  reportNote: (message: string) => void
): void {
  const lengths = new Map<number, number>();
  const inferredLengths = new Map<number, number>();
  for (const [bufferIndex, definition] of (gltf.json.buffers || []).entries()) {
    const label = `buffer ${bufferIndex}`;
    const loaded = gltf.buffers[bufferIndex];
    const validPayload = Boolean(
      loaded &&
        loaded.arrayBuffer instanceof ArrayBuffer &&
        Number.isSafeInteger(loaded.byteOffset) &&
        loaded.byteOffset >= 0 &&
        Number.isSafeInteger(loaded.byteLength) &&
        loaded.byteLength >= 0 &&
        Number.isSafeInteger(loaded.byteOffset + loaded.byteLength) &&
        loaded.byteOffset + loaded.byteLength <= loaded.arrayBuffer.byteLength
    );
    if (loaded && !validPayload) reportUnsupported(`${label} invalid borrowed payload span`);
    let byteLength = definition.byteLength;
    if (
      byteLength === undefined &&
      uriBufferIndices.has(bufferIndex) &&
      !definition.extensions &&
      validPayload &&
      loaded.byteLength > 0
    ) {
      byteLength = loaded.byteLength;
      inferredLengths.set(bufferIndex, byteLength);
    }
    if (!Number.isSafeInteger(byteLength) || byteLength < 1) {
      reportUnsupported(
        `${label} requires a positive byteLength; missing lengths require unambiguous loaded URI data`
      );
      continue;
    }
    lengths.set(bufferIndex, byteLength);
    // Resources may exceed their declared logical length, including GLB padding.
    if (validPayload && loaded.byteLength < byteLength)
      reportUnsupported(`${label} declared byteLength exceeds its loaded payload`);
  }
  for (const [viewIndex, view] of (gltf.json.bufferViews || []).entries()) {
    const byteOffset = view.byteOffset === undefined ? 0 : view.byteOffset;
    const bufferLength = lengths.get(view.buffer);
    if (
      !Number.isSafeInteger(view.buffer) ||
      view.buffer < 0 ||
      bufferLength === undefined ||
      !Number.isSafeInteger(byteOffset) ||
      byteOffset < 0 ||
      !Number.isSafeInteger(view.byteLength) ||
      view.byteLength < 1 ||
      !Number.isSafeInteger(byteOffset + view.byteLength) ||
      byteOffset + view.byteLength > bufferLength
    )
      reportUnsupported(
        `bufferView ${viewIndex} requires a valid buffer reference and contained positive byte span`
      );
  }
  for (const [bufferIndex, byteLength] of inferredLengths) {
    gltf.json.buffers![bufferIndex].byteLength = byteLength;
    reportNote(`Inferred buffer ${bufferIndex} byteLength from its loaded URI payload.`);
  }
}
