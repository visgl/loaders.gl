// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFWithBuffers} from '../types/gltf-types';
import {
  hasOpaqueGLTFV1Consumers,
  validateGLTFV1AccessorSource,
  type GLTFV1AccessorSource
} from './repack-gltf-v1-accessors';

/** Validate buffer spans and plan only loaded, bounded buffer and dense accessor-view lengths. */
export function validateGLTFV1Buffers(
  gltf: GLTFWithBuffers,
  uriBufferIndices: ReadonlySet<number>,
  reportUnsupported: (feature: string) => void,
  reportNote: (message: string) => void
): void {
  const lengths = new Map<number, number>();
  const inferredLengths = new Map<number, number>();
  const inferredViewLengths = new Map<number, number>();
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
  const hasOpaqueConsumers = hasOpaqueGLTFV1Consumers(gltf.json);
  for (const [viewIndex, view] of (gltf.json.bufferViews || []).entries()) {
    const byteOffset = view.byteOffset === undefined ? 0 : view.byteOffset;
    const bufferLength = lengths.get(view.buffer);
    const byteLength =
      view.byteLength === undefined && !hasOpaqueConsumers && bufferLength !== undefined
        ? inferAccessorViewLength(gltf, viewIndex, lengths)
        : view.byteLength;
    if (view.byteLength === undefined && byteLength !== undefined)
      inferredViewLengths.set(viewIndex, byteLength);
    if (
      !Number.isSafeInteger(view.buffer) ||
      view.buffer < 0 ||
      bufferLength === undefined ||
      !Number.isSafeInteger(byteOffset) ||
      byteOffset < 0 ||
      !Number.isSafeInteger(byteLength) ||
      (byteLength ?? 0) < 1 ||
      !Number.isSafeInteger(byteOffset + (byteLength ?? 0)) ||
      byteOffset + (byteLength ?? 0) > bufferLength
    )
      reportUnsupported(
        `bufferView ${viewIndex} requires a valid buffer reference and contained positive byte span`
      );
  }
  for (const [viewIndex, byteLength] of inferredViewLengths) {
    gltf.json.bufferViews![viewIndex].byteLength = byteLength;
    reportNote(`Inferred bufferView ${viewIndex} byteLength from its dense accessor spans.`);
  }
  for (const [bufferIndex, byteLength] of inferredLengths) {
    gltf.json.buffers![bufferIndex].byteLength = byteLength;
    reportNote(`Inferred buffer ${bufferIndex} byteLength from its loaded URI payload.`);
  }
}

/** Infer the smallest known accessor envelope without trimming or changing the source buffer. */
function inferAccessorViewLength(
  gltf: GLTFWithBuffers,
  viewIndex: number,
  lengths: ReadonlyMap<number, number>
): number | undefined {
  const view = gltf.json.bufferViews![viewIndex];
  if (
    (view.byteOffset !== undefined &&
      (!Number.isSafeInteger(view.byteOffset) || view.byteOffset < 0)) ||
    (view.byteStride !== undefined &&
      (!Number.isSafeInteger(view.byteStride) || view.byteStride < 0)) ||
    gltf.json.images?.some(image => image.bufferView === viewIndex) ||
    gltf.json.accessors?.some(accessor => Boolean(accessor.sparse))
  )
    return undefined;
  const remainingLength = lengths.get(view.buffer)! - (view.byteOffset ?? 0);
  const candidate = {
    ...gltf,
    json: {
      ...gltf.json,
      buffers: gltf.json.buffers!.map((buffer, index) => ({
        ...buffer,
        byteLength: lengths.get(index)!
      })),
      bufferViews: gltf.json.bufferViews!.map((bufferView, index) =>
        index === viewIndex ? {...bufferView, byteLength: remainingLength} : bufferView
      )
    }
  };
  let byteLength = 0;
  for (const [accessorIndex, accessor] of (gltf.json.accessors || []).entries()) {
    if (accessor.bufferView !== viewIndex) continue;
    const legacyAccessor = accessor as GLTFV1AccessorSource['accessor'];
    for (const value of [legacyAccessor.byteOffset, legacyAccessor.byteStride]) {
      if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) return undefined;
    }
    const source = validateGLTFV1AccessorSource(candidate, accessorIndex);
    if (typeof source === 'string') return undefined;
    const accessorLength =
      (accessor.byteOffset ?? 0) +
      (accessor.count - 1) * source.byteStride +
      source.rows * source.columns * source.componentSize;
    byteLength = Math.max(byteLength, accessorLength);
  }
  return byteLength > 0 ? byteLength : undefined;
}
