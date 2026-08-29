// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';

/**
 * Returns the transferable backing buffers owned by a GeoArrow vector.
 *
 * Arrow child arrays frequently share one backing store, especially after slicing or
 * interleaving coordinates. The result is therefore deduplicated by `ArrayBuffer` identity.
 * SharedArrayBuffer-backed views are deliberately omitted because they cannot be transferred.
 *
 * @param column GeoArrow Arrow vector.
 * @returns Unique transferable ArrayBuffers used by the vector.
 */
export function getGeoArrowTransferList(column: arrow.Vector): ArrayBuffer[] {
  const buffers = new Set<ArrayBuffer>();
  const visitedData = new Set<object>();

  for (const data of column.data) {
    collectArrowDataBuffers(data, buffers, visitedData);
  }
  return [...buffers];
}

function collectArrowDataBuffers(
  data: object | undefined,
  buffers: Set<ArrayBuffer>,
  visitedData: Set<object>
): void {
  if (!data || visitedData.has(data)) return;
  visitedData.add(data);

  const arrowData = data as {
    values?: unknown;
    valueOffsets?: unknown;
    nullBitmap?: unknown;
    typeIds?: unknown;
    variadicBuffers?: unknown[];
    children?: object[];
  };
  collectBuffer(arrowData.values, buffers);
  collectBuffer(arrowData.valueOffsets, buffers);
  collectBuffer(arrowData.nullBitmap, buffers);
  collectBuffer(arrowData.typeIds, buffers);
  for (const variadicBuffer of arrowData.variadicBuffers || []) {
    collectBuffer(variadicBuffer, buffers);
  }
  for (const child of arrowData.children || []) {
    collectArrowDataBuffers(child, buffers, visitedData);
  }
}

function collectBuffer(value: unknown, buffers: Set<ArrayBuffer>): void {
  if (value instanceof ArrayBuffer) {
    buffers.add(value);
    return;
  }
  if (ArrayBuffer.isView(value) && value.buffer instanceof ArrayBuffer) {
    buffers.add(value.buffer);
  }
}
