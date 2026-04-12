import {expect, test} from 'vitest';
import {fetchFile, selectLoader, selectLoaderSync, isBrowser} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {KMLLoader} from '@loaders.gl/kml';

const KML_URL = '@loaders.gl/kml/test/data/kml/KML_Samples.kml';
const DRACO_URL = '@loaders.gl/draco/test/data/bunny.drc';
const TILE_3D_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudRGB/pointCloudRGB.pnts';
const URL_WITH_QUERYSTRING =
  'https://wms.chartbundle.com/tms/1.0.0/sec/{z}/{x}/{y}.png?origin=nw.xy';
const DRACO_URL_QUERYSTRING = '@loaders.gl/draco/test/data/bunny.drc?query.string';

test('selectLoaderSync#urls', async () => {
  // @ts-ignore
  expect(() => selectLoaderSync(null), 'selectedLoader throws if no loader found').toThrow();
  expect(
    // @ts-ignore
    selectLoaderSync('.', null, {nothrow: true}),
    'selectedLoader({nothrow: true}) returns null instead of throwing'
  ).toBe(null);
  expect(
    selectLoaderSync('data.laz', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader by url extension'
  ).toBe(LASLoader);
  expect(
    selectLoaderSync(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=',
      [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]
    ),
    'find loader by data url mime type'
  ).toBe(ImageLoader);
  expect(
    selectLoaderSync(URL_WITH_QUERYSTRING, [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader from URL with query params'
  ).toBe(ImageLoader);

  const response = await fetchFile(DRACO_URL_QUERYSTRING);
  expect(response.url.endsWith(DRACO_URL_QUERYSTRING.slice(-20)), 'URL ends with ').toBeTruthy();
  expect(
    selectLoaderSync(response, [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader from response with query params'
  ).toBe(DracoLoader);
  expect(
    () => selectLoaderSync('data.obj', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find no loaders by url extension'
  ).toThrow();
  expect(
    selectLoaderSync('data.obj', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader], {
      fallbackMimeType: 'image/png'
    }),
    'options.fallbackMimeType can resolve loader using provided mimeType'
  ).toBe(ImageLoader);
  expect(
    selectLoaderSync('data.obj', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader], {
      fallbackMimeType: 'application/x.image'
    }),
    'options.fallbackMimeType can resolve loader using provided `application/x.<loaderId>` mimeType'
  ).toBe(ImageLoader);
  expect(
    selectLoaderSync('data.las', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader], {
      mimeType: 'image/png'
    }),
    'options.mimeType can override loader using provided mimeType'
  ).toBe(ImageLoader);
  expect(
    selectLoaderSync('data.las', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader], {
      mimeType: 'application/x.image'
    }),
    'options.mimeType can override loader using provided `application/x.<loaderId>` mimeType'
  ).toBe(ImageLoader);
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
    await selectLoader('data.laz', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader by url extension'
  ).toBe(LASLoader);
  expect(
    await selectLoader(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=',
      [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]
    ),
    'find loader by data url mime type'
  ).toBe(ImageLoader);
  expect(
    await selectLoader(URL_WITH_QUERYSTRING, [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader from URL with query params'
  ).toBe(ImageLoader);

  const response = await fetchFile(DRACO_URL_QUERYSTRING);
  expect(response.url.endsWith(DRACO_URL_QUERYSTRING.slice(-20)), 'URL ends with ').toBeTruthy();
  expect(
    await selectLoader(response, [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find loader from response with query params'
  ).toBe(DracoLoader);
  await expect(
    selectLoader('data.obj', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
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
