// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';

import type {CSWCapabilities, CSWRecords} from '@loaders.gl/wms';
import {CSWCatalogSource, CSWSourceLoader} from '@loaders.gl/wms';
import {CSWCapabilitiesLoaderWithParser} from '../../src/csw-capabilities-loader-with-parser';
import {CSWDomainLoaderWithParser} from '../../src/csw-domain-loader-with-parser';
import {CSWRecordsLoaderWithParser} from '../../src/csw-records-loader-with-parser';

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

  test('accepts successful responses without an error content type', () => {
    const source = new TestCSWCatalogSource('https://example.test/csw', {});
    const response = new Response(null, {status: 200});

    expect(() => source.checkResponse(response, new ArrayBuffer(0))).not.toThrow();
  });

  test('builds typed operation URLs with defaults and vendor parameters', () => {
    const source = new TestCSWCatalogSource('https://example.test/csw', {});
    const capabilities = new URL(source.getCapabilitiesURL({version: '2.0.0'}, {token: 'abc'}));
    const records = new URL(
      source.getRecordsURL({typenames: 'csw:Record'}, {elementSetName: ['brief', 'summary']})
    );
    const domain = new URL(source.getDomainURL(undefined, {propertyName: 'type'}));

    expect(capabilities.searchParams.get('SERVICE')).toBe('CSW');
    expect(capabilities.searchParams.get('VERSION')).toBe('2.0.0');
    expect(capabilities.searchParams.get('TOKEN')).toBe('abc');
    expect(records.searchParams.get('ELEMENTSETNAME')).toBe('brief,summary');
    expect(domain.searchParams.get('REQUEST')).toBe('GetDomain');
    expect(source.parseOGCUrl('https://example.test/wms?SERVICE=WMS')).toEqual({
      url: 'https://example.test/wms',
      params: 'SERVICE=WMS'
    });
    expect(source.parseOGCUrl('https://example.test/wms')).toEqual({
      url: 'https://example.test/wms',
      params: ''
    });
  });

  test('fetches and parses all CSW operation responses', async () => {
    const source = new CSWCatalogSource('https://example.test/csw', {});
    source.fetch = vi.fn().mockImplementation(async () => new Response('<xml/>'));
    const capabilities = {version: '3.0.0'} as unknown as CSWCapabilities;
    const records = {records: []} as unknown as CSWRecords;
    const domain = {values: ['one']} as any;
    vi.spyOn(CSWCapabilitiesLoaderWithParser, 'parse').mockResolvedValueOnce(capabilities);
    vi.spyOn(CSWRecordsLoaderWithParser, 'parse').mockResolvedValueOnce(records);
    vi.spyOn(CSWDomainLoaderWithParser, 'parse').mockResolvedValueOnce(domain);

    await expect(source.getCapabilities()).resolves.toBe(capabilities);
    await expect(source.getRecords()).resolves.toBe(records);
    await expect(source.getDomain()).resolves.toBe(domain);
    expect(source.fetch).toHaveBeenCalledTimes(3);
  });

  test('extracts known and optional unknown service references', async () => {
    const source = new CSWCatalogSource('https://example.test/csw', {});
    vi.spyOn(source, 'getRecords').mockResolvedValue({
      records: [
        {
          title: 'Catalog item',
          references: [
            {scheme: 'OGC:WMS', value: 'https://example.test/wms?SERVICE=WMS'},
            {scheme: 'OGC:WMTS', value: 'https://example.test/wmts'},
            {scheme: 'OGC:WFS', value: 'https://example.test/wfs'},
            {scheme: 'custom', value: 'https://example.test/custom'}
          ]
        }
      ]
    } as any);

    await expect(source.getServiceDirectory()).resolves.toHaveLength(3);
    const allServices = await source.getServiceDirectory({includeUnknown: true});
    expect(allServices.map(service => service.type)).toEqual([
      'ogc-wms-service',
      'ogc-wmts-service',
      'ogc-wfs-service',
      'unknown'
    ]);
  });

  test('rejects HTTP and OGC error responses', () => {
    const source = new TestCSWCatalogSource('https://example.test/csw', {});
    const bytes = new TextEncoder().encode(
      '<ServiceExceptionReport><ServiceException>failure</ServiceException></ServiceExceptionReport>'
    ).buffer;

    expect(() => source.checkResponse(new Response(null, {status: 500}), bytes)).toThrow();
    expect(() =>
      source.checkResponse(
        new Response(null, {headers: {'content-type': 'application/vnd.ogc.se_xml'}}),
        bytes
      )
    ).toThrow();
    expect(source.parseError(bytes)).toBeInstanceOf(Error);
  });
});

/** Test facade exposing the protected response validator. */
class TestCSWCatalogSource extends CSWCatalogSource {
  /** Invokes the protected response validator for focused behavior coverage. */
  checkResponse(response: Response, arrayBuffer: ArrayBuffer): void {
    this._checkResponse(response, arrayBuffer);
  }

  /** Invokes the protected XML error parser for focused behavior coverage. */
  parseError(arrayBuffer: ArrayBuffer): Error {
    return this._parseError(arrayBuffer);
  }

  /** Invokes the protected OGC URL splitter for focused behavior coverage. */
  parseOGCUrl(url: string): {url: string; params: string} {
    return this._parseOGCUrl(url);
  }
}

async function collect<T>(values: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const value of values) {
    result.push(value);
  }
  return result;
}
