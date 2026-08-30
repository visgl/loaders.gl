// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile} from '@loaders.gl/core';
import {
  formatCOPCKey,
  getCOPCKeyBounds,
  loadCOPCHierarchyPage,
  loadCOPCNodeData,
  openCOPC,
  parseCOPCLAZMetadata,
  parseCOPCHeader,
  parseCOPCHierarchy,
  parseCOPCInfo,
  parseCOPCKey
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
    expect(copc.laz).toMatchObject({compressor: 3, coder: 0, point14ItemVersion: 3});
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

  test('parses LASzip item versions and rejects unsupported codec metadata', async () => {
    const fileBytes = new Uint8Array(await (await fetchFile(COPC_URL)).arrayBuffer());
    const readRange = async (begin: number, end: number): Promise<Uint8Array> =>
      fileBytes.slice(begin, end);
    const copc = await openCOPC(readRange);
    const laszipRecord = copc.vlrs.find(record => record.recordId === 22204);
    expect(laszipRecord).toBeTruthy();
    const payload = fileBytes.slice(
      laszipRecord!.contentOffset,
      laszipRecord!.contentOffset + laszipRecord!.contentLength
    );

    const versionFour = payload.slice();
    const versionFourView = new DataView(versionFour.buffer);
    versionFourView.setUint16(38, 4, true);
    versionFourView.setUint16(44, 4, true);
    expect(parseCOPCLAZMetadata(versionFour, copc.header)).toMatchObject({
      point14ItemVersion: 4,
      rgb14ItemVersion: 4
    });

    const unsupportedVersion = payload.slice();
    new DataView(unsupportedVersion.buffer).setUint16(38, 5, true);
    expect(() => parseCOPCLAZMetadata(unsupportedVersion, copc.header)).toThrow(
      /unsupported COPC LASzip item/i
    );
  });

  test('accepts the maximum representable COPC key depth', () => {
    const hierarchy = new Uint8Array(32);
    const dataView = new DataView(hierarchy.buffer);
    dataView.setInt32(0, 31, true);
    dataView.setInt32(4, 0x7fffffff, true);
    dataView.setInt32(8, 0x7fffffff, true);
    dataView.setInt32(12, 0x7fffffff, true);

    expect(parseCOPCHierarchy(hierarchy).nodes['31-2147483647-2147483647-2147483647']).toBeTruthy();
    expect(parseCOPCKey('31-2147483647-2147483647-2147483647')).toEqual([
      31, 0x7fffffff, 0x7fffffff, 0x7fffffff
    ]);
  });

  test('covers COPC header validation boundaries', async () => {
    const validHeader = new Uint8Array(
      await (await fetchFile(COPC_URL)).arrayBuffer(),
      0,
      375
    ).slice();
    const mutations: Array<[string, (bytes: Uint8Array, view: DataView) => void, RegExp]> = [
      ['short header', bytes => bytes.fill(0), /requires 375 bytes/],
      ['LAS version', (_bytes, view) => view.setUint8(25, 3), /requires LAS 1\.4/],
      ['header length', (_bytes, view) => view.setUint16(94, 374, true), /header length/],
      ['compression flag', (_bytes, view) => view.setUint8(104, 7), /LAZ compression/],
      ['point format', (_bytes, view) => view.setUint8(104, 0x80 | 5), /PDRF 6, 7, or 8/],
      ['point offset', (_bytes, view) => view.setUint32(96, 1, true), /precedes the VLR area/],
      ['record length', (_bytes, view) => view.setUint16(105, 1, true), /bytes per point/],
      [
        'unsafe count',
        (_bytes, view) => view.setBigUint64(247, BigInt(Number.MAX_SAFE_INTEGER) + 1n, true),
        /point count exceeds/
      ]
    ];

    for (const [name, mutate, message] of mutations) {
      const bytes = name === 'short header' ? new Uint8Array(374) : validHeader.slice();
      mutate(bytes, new DataView(bytes.buffer));
      expect(() => parseCOPCHeader(bytes), name).toThrow(message);
    }
  });

  test('covers COPC info, hierarchy, key, and range validation boundaries', async () => {
    const makeInfo = () => {
      const bytes = new Uint8Array(160);
      const view = new DataView(bytes.buffer);
      view.setFloat64(0, 10, true);
      view.setFloat64(8, 20, true);
      view.setFloat64(16, 30, true);
      view.setFloat64(24, 8, true);
      view.setFloat64(32, 2, true);
      view.setBigUint64(40, 100n, true);
      view.setBigUint64(48, 32n, true);
      view.setFloat64(56, 1, true);
      view.setFloat64(64, 2, true);
      return bytes;
    };
    expect(parseCOPCInfo(makeInfo())).toMatchObject({
      cube: [2, 12, 22, 18, 28, 38],
      spacing: 2,
      rootHierarchyPage: {pageOffset: 100, pageLength: 32}
    });
    expect(() => parseCOPCInfo(new Uint8Array(159))).toThrow(/must contain 160/);
    for (const mutate of [
      (view: DataView) => view.setFloat64(24, 0, true),
      (view: DataView) => view.setFloat64(32, Number.NaN, true),
      (view: DataView) => view.setBigUint64(48, 31n, true),
      (view: DataView) => view.setUint8(72, 1)
    ]) {
      const bytes = makeInfo();
      mutate(new DataView(bytes.buffer));
      expect(() => parseCOPCInfo(bytes)).toThrow();
    }

    const hierarchyPage = new Uint8Array(64);
    const hierarchyView = new DataView(hierarchyPage.buffer);
    hierarchyView.setBigUint64(16, 100n, true);
    hierarchyView.setInt32(24, 12, true);
    hierarchyView.setInt32(28, 4, true);
    hierarchyView.setInt32(32, 1, true);
    hierarchyView.setInt32(36, 1, true);
    hierarchyView.setBigUint64(48, 200n, true);
    hierarchyView.setInt32(56, 32, true);
    hierarchyView.setInt32(60, -1, true);
    expect(parseCOPCHierarchy(hierarchyPage)).toEqual({
      nodes: {'0-0-0-0': {pointCount: 4, pointDataOffset: 100, pointDataLength: 12}},
      pages: {'1-1-0-0': {pageOffset: 200, pageLength: 32}}
    });

    const invalidEntry = hierarchyPage.slice(0, 32);
    new DataView(invalidEntry.buffer).setInt32(24, -1, true);
    expect(() => parseCOPCHierarchy(invalidEntry)).toThrow(/Invalid COPC hierarchy entry/);
    expect(() => formatCOPCKey([32, 0, 0, 0])).toThrow(/Invalid COPC key/);
    expect(() => parseCOPCKey('2-4-0-0')).toThrow(/Invalid COPC key/);
    expect(getCOPCKeyBounds([0, 0, 0, 8, 8, 8], [2, 1, 2, 3])).toEqual([2, 4, 6, 4, 6, 8]);

    const readRange = async (begin: number, end: number) =>
      Uint8Array.from({length: Math.max(0, end - begin)}, (_, index) => index);
    await expect(loadCOPCHierarchyPage(readRange, {pageOffset: 0, pageLength: 31})).rejects.toThrow(
      /Invalid COPC hierarchy/
    );
    await expect(
      loadCOPCNodeData(readRange, {pointDataOffset: -1, pointDataLength: 1})
    ).rejects.toThrow(/Invalid COPC node byte range/);
    await expect(
      loadCOPCNodeData(async () => new Uint8Array(0), {pointDataOffset: 2, pointDataLength: 3})
    ).rejects.toThrow(/returned 0 bytes; expected 3/);
    const controller = new AbortController();
    controller.abort();
    await expect(
      loadCOPCNodeData(readRange, {pointDataOffset: 0, pointDataLength: 1}, controller.signal)
    ).rejects.toMatchObject({name: 'AbortError'});
  });

  test('covers LASzip item table variants and malformed metadata', async () => {
    const fileBytes = new Uint8Array(await (await fetchFile(COPC_URL)).arrayBuffer());
    const copc = await openCOPC(async (begin, end) => fileBytes.slice(begin, end));
    const record = copc.vlrs.find(candidate => candidate.recordId === 22204)!;
    const payload = fileBytes.slice(
      record.contentOffset,
      record.contentOffset + record.contentLength
    );

    expect(() => parseCOPCLAZMetadata(new Uint8Array(33), copc.header)).toThrow(/Malformed/);
    for (const [offset, value, message] of [
      [0, 2, /layered compressor 3/],
      [2, 1, /arithmetic coder 0/],
      [32, 9, /item table|items; expected/],
      [34, 99, /expected type/]
    ] as const) {
      const bytes = payload.slice();
      new DataView(bytes.buffer).setUint16(offset, value, true);
      expect(() => parseCOPCLAZMetadata(bytes, copc.header)).toThrow(message);
    }

    for (const [pointFormat, recordLength, expected] of [
      [6, 34, {point14ItemVersion: 3, byte14ItemVersion: 3}],
      [8, 42, {point14ItemVersion: 3, rgb14ItemVersion: 3, byte14ItemVersion: 3}]
    ] as const) {
      const header = {
        ...copc.header,
        pointDataRecordFormat: pointFormat,
        pointDataRecordLength: recordLength
      };
      const itemTypes =
        pointFormat === 6
          ? [
              [10, 30],
              [14, 4]
            ]
          : [
              [10, 30],
              [12, 8],
              [14, 4]
            ];
      const bytes = new Uint8Array(34 + itemTypes.length * 6);
      const view = new DataView(bytes.buffer);
      view.setUint16(0, 3, true);
      view.setUint16(2, 0, true);
      view.setUint32(12, 50_000, true);
      view.setUint16(32, itemTypes.length, true);
      itemTypes.forEach(([type, size], index) => {
        view.setUint16(34 + index * 6, type, true);
        view.setUint16(36 + index * 6, size, true);
        view.setUint16(38 + index * 6, 3, true);
      });
      expect(parseCOPCLAZMetadata(bytes, header as any)).toMatchObject(expected);
    }
  });
});
