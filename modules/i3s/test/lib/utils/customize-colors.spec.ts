// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {createQueryParameterCredential} from '@loaders.gl/loader-utils';
import {createFloat16Array, getFloat16Value, setFloat16Value} from '@loaders.gl/schema';

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

test('customizeColors preserves normalized float32 and float16 color storage', async () => {
  vi.stubGlobal('fetch', createAttributeFetch([]));

  const float32Colors = {
    value: new Float32Array([0.8, 0.4, 0.2, 1, 0.6, 0.2, 0.2, 1]),
    size: 4
  } as any;
  const replacedFloat32 = await customizeColors(
    float32Colors,
    [10, 20],
    attributeUrls,
    fields,
    attributeStorageInfo,
    colorOptions
  );
  expect(replacedFloat32.value).toBeInstanceOf(Float32Array);
  expect(replacedFloat32.value[0]).toBeCloseTo(25 / 255, 6);
  expect(replacedFloat32.value[1]).toBeCloseTo(13 / 255, 6);
  expect(replacedFloat32.value[2]).toBeCloseTo(6 / 255, 6);
  expect(replacedFloat32.value[3]).toBe(1);

  const multipliedFloat32 = await customizeColors(
    float32Colors,
    [10, 20],
    attributeUrls,
    fields,
    attributeStorageInfo,
    {...colorOptions, mode: 'multiply'}
  );
  expect(multipliedFloat32.value[0]).toBeCloseTo((0.8 * 25) / 255, 6);
  expect(multipliedFloat32.value[1]).toBeCloseTo((0.4 * 13) / 255, 6);
  expect(multipliedFloat32.value[2]).toBeCloseTo((0.2 * 6) / 255, 6);
  expect(multipliedFloat32.value[3]).toBe(1);

  const float16Colors = createFloat16Array(8);
  for (let index = 0; index < float16Colors.length; index++) {
    setFloat16Value(float16Colors, index, float32Colors.value[index]);
  }
  const replacedFloat16 = await customizeColors(
    {value: float16Colors, size: 4, componentType: 'float16'},
    [10, 20],
    attributeUrls,
    fields,
    attributeStorageInfo,
    colorOptions
  );
  expect(replacedFloat16.componentType).toBe('float16');
  expect(getFloat16Value(replacedFloat16.value, 0)).toBeCloseTo(25 / 255, 3);

  const multipliedFloat16 = await customizeColors(
    {value: float16Colors, size: 4, componentType: 'float16'},
    [10, 20],
    attributeUrls,
    fields,
    attributeStorageInfo,
    {...colorOptions, mode: 'multiply'}
  );
  expect(getFloat16Value(multipliedFloat16.value, 0)).toBeCloseTo((0.8 * 25) / 255, 3);
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

test('customizeColors applies core credentials to attribute requests', async () => {
  const requestedUrls: string[] = [];
  vi.stubGlobal('fetch', createAttributeFetch(requestedUrls));

  await customizeColors(
    colors,
    [10, 20],
    attributeUrls,
    fields,
    attributeStorageInfo,
    colorOptions,
    undefined,
    {
      core: {
        credentials: [
          createQueryParameterCredential({
            id: 'arcgis-token',
            origins: ['https://example.com'],
            parameterName: 'token',
            token: 'secret-token'
          })
        ]
      }
    }
  );

  expect(requestedUrls).toEqual([
    'https://example.com/heights?token=secret-token',
    'https://example.com/object-ids?token=secret-token'
  ]);
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
