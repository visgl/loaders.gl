// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  fetchFile,
  registerLoaders,
  selectLoader,
  selectLoaderSync,
  isBrowser
} from '@loaders.gl/core';
import {LegacyImageLoader} from '@loaders.gl/images';
import {DracoLoader} from '@loaders.gl/scene';
import {LASLoader} from '@loaders.gl/pointclouds/las';
import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';
import {KMLLoader} from '@loaders.gl/geospatial/kml/index';
import {JSONTableLoader} from '@loaders.gl/tables/json';
import {getRegisteredLoaders} from '../../../src/lib/api/register-loaders';
import {getLoaderContext} from '../../../src/lib/loader-utils/loader-context';

const KML_URL = '@loaders.gl/geospatial/kml/test/data/kml/KML_Samples.kml';
const DRACO_URL = '@loaders.gl/scene/draco/test/data/bunny.drc';
const TILE_3D_URL =
  '@loaders.gl/tiles-3d/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudRGB/pointCloudRGB.pnts';
const URL_WITH_QUERYSTRING =
  'https://wms.chartbundle.com/tms/1.0.0/sec/{z}/{x}/{y}.png?origin=nw.xy';
const DRACO_URL_QUERYSTRING = '@loaders.gl/scene/draco/test/data/bunny.drc?query.string';

test('selectLoaderSync#urls', async () => {
  // @ts-ignore
  expect(() => selectLoaderSync(null), 'selectedLoader throws if no loader found').toThrow();
  expect(
    // @ts-ignore
    selectLoaderSync('.', null, {nothrow: true}),
    'selectedLoader({nothrow: true}) returns null instead of throwing'
  ).toBe(null);
  expect(
    selectLoaderSync('data.laz', [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader by url extension'
  ).toBe(LASLoader);
  expect(
    selectLoaderSync(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=',
      [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader]
    ),
    'find loader by data url mime type'
  ).toBe(LegacyImageLoader);
  expect(
    selectLoaderSync(URL_WITH_QUERYSTRING, [
      LegacyImageLoader,
      Tiles3DLoader,
      DracoLoader,
      LASLoader
    ]),
    'find loader from URL with query params'
  ).toBe(LegacyImageLoader);

  const response = await fetchFile(DRACO_URL_QUERYSTRING);
  expect(response.url.endsWith(DRACO_URL_QUERYSTRING.slice(-20)), 'URL ends with ').toBeTruthy();
  expect(
    selectLoaderSync(response, [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader from response with query params'
  ).toBe(DracoLoader);
  expect(
    () => selectLoaderSync('data.obj', [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find no loaders by url extension'
  ).toThrow();
  expect(
    selectLoaderSync('data.obj', [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader], {
      fallbackMimeType: 'image/png'
    }),
    'options.fallbackMimeType can resolve loader using provided mimeType'
  ).toBe(LegacyImageLoader);
  expect(
    selectLoaderSync('data.obj', [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader], {
      fallbackMimeType: 'application/x.image'
    }),
    'options.fallbackMimeType can resolve loader using provided `application/x.<loaderId>` mimeType'
  ).toBe(LegacyImageLoader);
  expect(
    selectLoaderSync('data.las', [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader], {
      mimeType: 'image/png'
    }),
    'options.mimeType can override loader using provided mimeType'
  ).toBe(LegacyImageLoader);
  expect(
    selectLoaderSync('data.las', [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader], {
      mimeType: 'application/x.image'
    }),
    'options.mimeType can override loader using provided `application/x.<loaderId>` mimeType'
  ).toBe(LegacyImageLoader);
});

test('selectLoader#urls', async () => {
  // @ts-ignore
  await expect(
    selectLoader(null),
    'selectedLoader rejects if no loader found'
  ).rejects.toBeDefined();
  expect(
    // @ts-ignore
    await selectLoader('.', null, {nothrow: true}),
    'selectedLoader({nothrow: true}) returns null instead of throwing'
  ).toBe(null);
  expect(
    await selectLoader('data.laz', [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader by url extension'
  ).toBe(LASLoader);
  expect(
    await selectLoader(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=',
      [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader]
    ),
    'find loader by data url mime type'
  ).toBe(LegacyImageLoader);
  expect(
    await selectLoader(URL_WITH_QUERYSTRING, [
      LegacyImageLoader,
      Tiles3DLoader,
      DracoLoader,
      LASLoader
    ]),
    'find loader from URL with query params'
  ).toBe(LegacyImageLoader);

  const response = await fetchFile(DRACO_URL_QUERYSTRING);
  expect(response.url.endsWith(DRACO_URL_QUERYSTRING.slice(-20)), 'URL ends with ').toBeTruthy();
  expect(
    await selectLoader(response, [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader from response with query params'
  ).toBe(DracoLoader);
  await expect(
    selectLoader('data.obj', [LegacyImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find no loaders by url extension'
  ).rejects.toBeDefined();
});

test('selectLoader#data', async () => {
  const dracoResponse = await fetchFile(DRACO_URL);
  const dracoData = await dracoResponse.arrayBuffer();
  const tileResponse = await fetchFile(TILE_3D_URL);
  const tileData = await tileResponse.arrayBuffer();

  expect(
    await selectLoader(dracoResponse, [Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader by examining Response object'
  ).toBe(DracoLoader);
  expect(
    await selectLoader(dracoData, [Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader by examining binary data'
  ).toBe(DracoLoader);
  await expect(
    selectLoader(new ArrayBuffer(10), [Tiles3DLoader, DracoLoader, LASLoader]),
    'find no loaders by examining binary data'
  ).rejects.toBeDefined();
  await expect(
    selectLoader(dracoData, [LASLoader]),
    'find no loaders by examining binary data'
  ).rejects.toBeDefined();
  expect(
    await selectLoader(tileData, [Tiles3DLoader]),
    'find loader by checking magic string'
  ).toBe(Tiles3DLoader);

  const response = await fetchFile(KML_URL);
  const KML_SAMPLE = await response.text();
  expect(await selectLoader(KML_SAMPLE, [KMLLoader]), 'find loader by examining text data').toBe(
    KMLLoader
  );
  await expect(
    selectLoader('hello', [KMLLoader]),
    'find no loaders by examining text data'
  ).rejects.toBeDefined();

  const byteOffset = 10;
  const offsetBuffer = new ArrayBuffer(tileData.byteLength + byteOffset);
  const offsetArray = new Uint8Array(offsetBuffer, byteOffset);
  offsetArray.set(new Uint8Array(tileData));
  expect(
    await selectLoader(offsetArray, [Tiles3DLoader]),
    'find loader by checking magic string in embedded tile data (with offset)'
  ).toBe(Tiles3DLoader);
});

test.runIf(isBrowser)('selectLoader#via (unregistered) MIME type', async () => {
  const blob = new Blob([''], {type: 'application/x.draco'});
  const loader = await selectLoader(blob, [Tiles3DLoader, DracoLoader, LASLoader]);

  expect(loader, 'find loader by unregistered MIME type').toBe(DracoLoader);
});

test.runIf(isBrowser)('selectLoader#Blob data sniffing', async () => {
  const blob = new Blob(['DRACO']);
  let loader = await selectLoader(blob, [Tiles3DLoader, DracoLoader, LASLoader]);
  expect(loader, 'selectLoader find loader by Blob content sniffing').toBe(DracoLoader);

  loader = selectLoaderSync(blob, [Tiles3DLoader, DracoLoader, LASLoader], {nothrow: true});
  expect(loader, 'selectLoaderSync does not find loader by Blob content sniffing').toBe(null);
});

test.each([
  false,
  true
])('selectLoader#unmatched text Response preserves its body (nothrow=%s)', async nothrow => {
  const text = 'unrecognized loader data';
  const response = new Response(text, {headers: {'content-type': 'text/plain'}});
  const selection = selectLoader(response, [KMLLoader], {
    core: {ignoreRegisteredLoaders: true, nothrow}
  });

  if (nothrow) {
    expect(await selection).toBe(null);
  } else {
    await expect(selection).rejects.toThrow(/No valid loader found/);
  }

  expect(response.bodyUsed).toBe(false);
  expect(await response.text()).toBe(text);
});

test('selectLoader#explicit loaders take priority over registered loaders', async () => {
  const body = '[{"loaderPriorityTest":true}]';
  const registeredLoader = {
    ...JSONTableLoader,
    id: 'loader-priority-test',
    mimeTypes: ['text/plain'],
    testText: (text: string) => text === body
  };
  const response = () => new Response(body, {headers: {'Content-Type': 'text/plain'}});
  const registry = getRegisteredLoaders();
  registerLoaders(registeredLoader);

  try {
    const jsonContext = getLoaderContext({url: 'https://example.test/data.json'}, {}, null);
    expect(await selectLoader(response(), [JSONTableLoader], {}, jsonContext)).toBe(
      JSONTableLoader
    );
    const explicitTextLoader = {...registeredLoader, id: 'explicit-text', extensions: []};
    expect(selectLoaderSync(response(), [explicitTextLoader], {}, jsonContext)).toBe(
      explicitTextLoader
    );
    expect(await selectLoader(response(), [DracoLoader])).toBe(registeredLoader);
    expect(selectLoaderSync(body, [DracoLoader])).toBe(registeredLoader);
  } finally {
    registry.splice(registry.indexOf(registeredLoader), 1);
  }
});
