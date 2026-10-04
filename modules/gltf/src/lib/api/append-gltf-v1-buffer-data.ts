// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encodeArrayBufferToBase64, padToNBytes} from '@loaders.gl/loader-utils';
import type {GLTFWithBuffers} from '../types/gltf-types';

/** A validated payload and its deferred metadata update. */
export type GLTFV1BufferAppend = {
  /** Loaded source buffer to copy and extend. */
  readonly bufferIndex: number;
  /** Converted payload, including any element/column padding. */
  readonly bytes: ArrayBuffer;
  /** Optional vertex element stride. */
  readonly byteStride?: number;
  /** Optional WebGL vertex/index target. */
  readonly target?: number;
  /** Update consumers after the new view exists. */
  readonly apply: (bufferViewIndex: number) => void;
};

/** Append validated data to aligned copies, preserving borrowed bytes and original views. */
export function appendGLTFV1BufferData(gltf: GLTFWithBuffers, plans: GLTFV1BufferAppend[]): void {
  if (!plans.length) return;
  const groups = new Map<number, GLTFV1BufferAppend[]>();
  for (const plan of plans) {
    const group = groups.get(plan.bufferIndex) || [];
    group.push(plan);
    groups.set(plan.bufferIndex, group);
  }
  gltf.buffers = [...gltf.buffers];
  gltf.json.bufferViews ||= [];
  for (const [bufferIndex, group] of groups) {
    const definition = gltf.json.buffers![bufferIndex];
    const source = gltf.buffers[bufferIndex];
    let byteOffset = padToNBytes(definition.byteLength, 4);
    const byteLength =
      byteOffset +
      group.reduce((length, plan) => length + padToNBytes(plan.bytes.byteLength, 4), 0);
    const arrayBuffer = new ArrayBuffer(byteLength);
    const bytes = new Uint8Array(arrayBuffer);
    bytes.set(new Uint8Array(source.arrayBuffer, source.byteOffset, definition.byteLength));
    for (const plan of group) {
      bytes.set(new Uint8Array(plan.bytes), byteOffset);
      const bufferViewIndex = gltf.json.bufferViews.length;
      gltf.json.bufferViews.push({
        buffer: bufferIndex,
        byteOffset,
        byteLength: plan.bytes.byteLength,
        ...(plan.byteStride === undefined ? {} : {byteStride: plan.byteStride}),
        ...(plan.target === undefined ? {} : {target: plan.target})
      });
      plan.apply(bufferViewIndex);
      byteOffset += padToNBytes(plan.bytes.byteLength, 4);
    }
    definition.byteLength = byteLength;
    if (definition.uri !== undefined)
      definition.uri = `data:application/octet-stream;base64,${encodeArrayBufferToBase64(arrayBuffer)}`;
    gltf.buffers[bufferIndex] = {arrayBuffer, byteOffset: 0, byteLength};
  }
}
