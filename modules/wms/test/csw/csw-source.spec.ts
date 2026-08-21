// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';

import type {CSWCapabilities, CSWRecords} from '@loaders.gl/wms';
import {CSWCatalogSource, CSWSourceLoader} from '@loaders.gl/wms';

describe('CSWCatalogSource', () => {
  test('implements the shared catalog contract', async () => {
    const source = new CSWCatalogSource('https://example.test/csw', {});
    const capabilities = {version: '3.0.0'} as unknown as CSWCapabilities;
    const records = {
      records: [{title: 'A'}, {title: 'B'}]
    } as unknown as CSWRecords;
    vi.spyOn(source, 'getCapabilities').mockResolvedValue(capabilities);
    vi.spyOn(source, 'getRecords').mockResolvedValue(records);

    expect(source.capabilities).toMatchObject({search: true, pagination: false});
    await expect(source.getMetadata()).resolves.toBe(capabilities);
    expect(await collect(source.search())).toEqual(records.records);
    expect(CSWSourceLoader.testURL('https://example.test/csw')).toBe(true);
    expect(CSWSourceLoader.testURL('https://example.test/wfs')).toBe(false);
  });
});

async function collect<T>(values: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const value of values) {
    result.push(value);
  }
  return result;
}
