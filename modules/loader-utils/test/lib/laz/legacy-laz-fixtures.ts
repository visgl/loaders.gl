// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile} from '@loaders.gl/core';
import type {LAZChunkMetadata} from '@loaders.gl/loader-utils';

/** Independent LASzip fixture and its matching uncompressed point records. */
export type LegacyLAZFixture = {
  /** Complete compressed LAS file. */
  compressedFile: Uint8Array<ArrayBuffer>;
  /** Expected lossless uncompressed records. */
  rawPointData: Uint8Array<ArrayBuffer>;
  /** Point-data start in the compressed file. */
  pointsOffset: number;
  /** Per-item codec versions declared by LASzip. */
  metadata: LAZChunkMetadata;
};

/** Load a small checked-in LASzip fixture without accessing external services. */
export async function loadLegacyLAZFixture(
  pointDataRecordFormat: number,
  suffix = ''
): Promise<LegacyLAZFixture> {
  const fixtureRoot = `@loaders.gl/loader-utils/test/data/laz/legacy-v1-pdrf${pointDataRecordFormat}`;
  const [compressedBuffer, uncompressedBuffer] = await Promise.all([
    fetchFile(`${fixtureRoot}${suffix}.laz`).then(response => response.arrayBuffer()),
    fetchFile(`${fixtureRoot}.las`).then(response => response.arrayBuffer())
  ]);
  const compressedFile = new Uint8Array(compressedBuffer);
  const compressedView = new DataView(compressedBuffer);
  const uncompressedView = new DataView(uncompressedBuffer);
  const versionOffset = compressedView.getUint16(94, true) + 54 + 34;
  const itemCount = compressedView.getUint16(versionOffset - 2, true);
  const versions = new Map<number, number>();
  for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
    const itemOffset = versionOffset + itemIndex * 6;
    versions.set(
      compressedView.getUint16(itemOffset, true),
      compressedView.getUint16(itemOffset + 4, true)
    );
  }
  return {
    compressedFile,
    rawPointData: new Uint8Array(uncompressedBuffer, uncompressedView.getUint32(96, true)),
    pointsOffset: compressedView.getUint32(96, true),
    metadata: {
      pointDataRecordFormat,
      pointDataRecordLength: compressedView.getUint16(105, true),
      pointCount: compressedView.getUint32(107, true),
      point10ItemVersion: versions.get(6) as 1 | 2,
      gpsTime11ItemVersion: versions.get(7) as 1 | 2 | undefined,
      rgb12ItemVersion: versions.get(8) as 1 | 2 | undefined,
      byteItemVersion: versions.get(0) as 1 | 2 | undefined
    }
  };
}
