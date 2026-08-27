// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';

import {customizeColors} from '../../../src/lib/utils/customize-colors';

const fields = [
  {name: 'OBJECTID', type: 'esriFieldTypeOID'},
  {name: 'HEIGHT', type: 'esriFieldTypeDouble'},
  {name: 'LABEL', type: 'esriFieldTypeString'}
] as any;
const attributeStorageInfo = [
  {name: 'OBJECTID', objectIds: {}},
  {name: 'HEIGHT', attributeValues: {valueType: 'Float64'}}
] as any;
const attributeUrls = ['https://example.com/object-ids', 'https://example.com/heights'];
const colors = {
  value: new Uint8Array([200, 100, 50, 255, 150, 50, 50, 255, 10, 20, 30, 255]),
  size: 4
} as any;
const colorOptions = {
  attributeName: 'HEIGHT',
  minValue: 0,
  maxValue: 100,
  minColor: [0, 0, 0, 255],
  maxColor: [100, 50, 25, 255],
  mode: 'replace'
} as any;

afterEach(() => {
  vi.unstubAllGlobals();
});

test('customizeColors replaces and multiplies colors from numeric I3S attributes', async () => {
  const requestedUrls: string[] = [];
  vi.stubGlobal('fetch', createAttributeFetch(requestedUrls));

  const replaced = await customizeColors(
    colors,
    new Uint32Array([10, 20, 999]),
    attributeUrls,
    fields,
    attributeStorageInfo,
    colorOptions,
    'secret'
  );
  expect(Array.from(replaced.value)).toEqual([25, 13, 6, 255, 75, 38, 19, 255, 10, 20, 30, 255]);
  expect(requestedUrls).toEqual([
    'https://example.com/heights?token=secret',
    'https://example.com/object-ids?token=secret'
  ]);

  const multiplied = await customizeColors(
    colors,
    [10, 20],
    attributeUrls,
    fields,
    attributeStorageInfo,
    {...colorOptions, mode: 'multiply'}
  );
  expect(Array.from(multiplied.value)).toEqual([19, 5, 1, 255, 44, 7, 3, 255, 10, 20, 30, 255]);
  expect(multiplied.value).not.toBe(colors.value);
});

test('customizeColors returns the original colors when required metadata is absent', async () => {
  vi.stubGlobal('fetch', createAttributeFetch([]));

  await expect(
    customizeColors(colors, [10], attributeUrls, fields, attributeStorageInfo, null)
  ).resolves.toBe(colors);
  await expect(
    customizeColors(colors, [10], attributeUrls, fields, attributeStorageInfo, {
      ...colorOptions,
      attributeName: 'missing'
    })
  ).resolves.toBe(colors);
  await expect(
    customizeColors(colors, [10], attributeUrls, fields, attributeStorageInfo, {
      ...colorOptions,
      attributeName: 'LABEL'
    })
  ).resolves.toBe(colors);
  await expect(
    customizeColors(
      colors,
      [10],
      attributeUrls,
      fields,
      attributeStorageInfo.slice(0, 1),
      colorOptions
    )
  ).resolves.toBe(colors);
  await expect(
    customizeColors(
      colors,
      [10],
      attributeUrls,
      fields.filter(field => field.type !== 'esriFieldTypeOID'),
      attributeStorageInfo,
      colorOptions
    )
  ).resolves.toBe(colors);
  await expect(
    customizeColors(
      colors,
      [10],
      [attributeUrls[1]],
      fields,
      attributeStorageInfo.slice(1),
      colorOptions
    )
  ).resolves.toBe(colors);
});

test('customizeColors reports failed attribute responses', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(null, {status: 503, statusText: 'Unavailable'}))
  );

  await expect(
    customizeColors(colors, [10], attributeUrls, fields, attributeStorageInfo, colorOptions)
  ).rejects.toThrow('Failed to load I3S attribute HEIGHT: 503 Unavailable');
});

/** Creates a fetch substitute serving compact numeric I3S attribute buffers. */
function createAttributeFetch(requestedUrls: string[]) {
  return vi.fn(async (url: string) => {
    requestedUrls.push(url);
    if (url.includes('object-ids')) {
      const buffer = new ArrayBuffer(12);
      new Uint32Array(buffer, 4).set([10, 20]);
      return new Response(buffer);
    }
    const buffer = new ArrayBuffer(24);
    new Float64Array(buffer, 8).set([25, 75]);
    return new Response(buffer);
  });
}
