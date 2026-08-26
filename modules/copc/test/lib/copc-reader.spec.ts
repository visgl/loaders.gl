// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile} from '@loaders.gl/core';
import {
  loadCOPCHierarchyPage,
  loadCOPCNodeData,
  openCOPC,
  parseCOPCHeader,
  parseCOPCHierarchy
} from '@loaders.gl/copc';
import {describe, expect, test} from 'vitest';

const COPC_URL = new URL('../data/ellipsoid.copc.laz', import.meta.url).href;

describe('native COPC reader', () => {
  test('opens metadata, hierarchy, and node ranges without reading the whole file', async () => {
    const arrayBuffer = await (await fetchFile(COPC_URL)).arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    const requestedRanges: Array<[number, number]> = [];
    const readRange = async (begin: number, end: number): Promise<Uint8Array> => {
      requestedRanges.push([begin, end]);
      return fileBytes.slice(begin, end);
    };

    const copc = await openCOPC(readRange);
    const hierarchy = await loadCOPCHierarchyPage(readRange, copc.info.rootHierarchyPage);
    const rootNode = hierarchy.nodes['0-0-0-0'];

    expect(copc.header.majorVersion).toBe(1);
    expect(copc.header.minorVersion).toBe(4);
    expect(copc.header.pointDataRecordFormat).toBe(7);
    expect(copc.header.pointCount).toBeGreaterThan(0);
    expect(copc.info.spacing).toBeGreaterThan(0);
    expect(rootNode).toBeTruthy();
    expect(requestedRanges.every(([begin, end]) => end - begin < fileBytes.byteLength)).toBe(true);

    const compressed = await loadCOPCNodeData(readRange, rootNode!);
    expect(compressed.byteLength).toBe(rootNode?.pointDataLength);
    expect(requestedRanges.at(-1)).toEqual([
      rootNode?.pointDataOffset,
      rootNode!.pointDataOffset + rootNode!.pointDataLength
    ]);
  });

  test('preserves nonzero ArrayBufferView offsets while parsing the header', async () => {
    const source = new Uint8Array(await (await fetchFile(COPC_URL)).arrayBuffer(), 0, 375);
    const padded = new Uint8Array(source.byteLength + 11);
    padded.set(source, 7);

    const header = parseCOPCHeader(padded.subarray(7, 7 + source.byteLength));
    expect(header.pointDataRecordFormat).toBe(7);
    expect(header.scale.every(Number.isFinite)).toBe(true);
  });

  test('rejects invalid COPC headers and hierarchy entries', async () => {
    const validHeader = new Uint8Array(
      await (await fetchFile(COPC_URL)).arrayBuffer(),
      0,
      375
    ).slice();
    const invalidSignature = validHeader.slice();
    invalidSignature[0] = 0;
    expect(() => parseCOPCHeader(invalidSignature)).toThrow(/signature/);
    const missingWktFlag = validHeader.slice();
    const headerView = new DataView(
      missingWktFlag.buffer,
      missingWktFlag.byteOffset,
      missingWktFlag.byteLength
    );
    headerView.setUint16(6, headerView.getUint16(6, true) & ~0x10, true);
    expect(() => parseCOPCHeader(missingWktFlag)).toThrow(/WKT global encoding bit/);
    expect(() => parseCOPCHierarchy(new Uint8Array(31))).toThrow(/page length/);

    const hierarchy = new Uint8Array(32);
    const dataView = new DataView(hierarchy.buffer);
    dataView.setInt32(28, 1, true);
    expect(() => parseCOPCHierarchy(hierarchy)).toThrow(/points but no compressed data/);
    expect(() => parseCOPCHierarchy(new Uint8Array(64))).toThrow(/Duplicate/);
  });
});
