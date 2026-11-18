// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Create deterministic legacy RGB records with enough entropy for progressive input tests. */
export function createLegacyPDRF2PointData(pointCount: number): Uint8Array {
  const pointDataRecordLength = 26;
  const pointData = new Uint8Array(pointCount * pointDataRecordLength);
  const dataView = new DataView(pointData.buffer);
  let value = 0x12345678;

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const pointOffset = pointIndex * pointDataRecordLength;
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    dataView.setInt32(pointOffset, value | 0, true);
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    dataView.setInt32(pointOffset + 4, value | 0, true);
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    dataView.setInt32(pointOffset + 8, value | 0, true);
    dataView.setUint16(pointOffset + 12, value & 0xffff, true);
    dataView.setUint8(pointOffset + 14, 0x11);
    dataView.setUint8(pointOffset + 15, pointIndex & 0x1f);
    dataView.setInt8(pointOffset + 16, pointIndex & 0x7f);
    dataView.setUint8(pointOffset + 17, (value >>> 16) & 0xff);
    dataView.setUint16(pointOffset + 18, pointIndex & 0xffff, true);
    dataView.setUint16(pointOffset + 20, value & 0xffff, true);
    dataView.setUint16(pointOffset + 22, (value >>> 8) & 0xffff, true);
    dataView.setUint16(pointOffset + 24, (value >>> 16) & 0xffff, true);
  }
  return pointData;
}
