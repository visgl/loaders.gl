import test from 'tape-promise/tape';
import {fetchFile, selectLoader, selectLoaderSync, isBrowser} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {KMLLoader} from '@loaders.gl/kml';

const KML_URL = '@loaders.gl/kml/test/data/KML_Samples.kml';

const DRACO_URL = '@loaders.gl/draco/test/data/bunny.drc';
const TILE_3D_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudRGB/pointCloudRGB.pnts';
const URL_WITH_QUERYSTRING =
  'https://wms.chartbundle.com/tms/1.0.0/sec/{z}/{x}/{y}.png?origin=nw.xy';
const DRACO_URL_QUERYSTRING = '@loaders.gl/draco/test/data/bunny.drc?query.string';

test('selectLoaderSync#urls', async (t) => {
  // @ts-ignore
  t.throws(() => selectLoaderSync(null), 'selectedLoader throws if no loader found');

  t.equal(
    // @ts-ignore
    selectLoaderSync('.', null, {nothrow: true}),
    null,
    'selectedLoader({nothrow: true}) returns null instead of throwing'
  );

  t.is(
    selectLoaderSync('data.laz', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    LASLoader,
    'find loader by url extension'
  );

  t.is(
    selectLoaderSync(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=',
      [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]
    ),
    ImageLoader,
    'find loader by data url mime type'
  );

  t.is(
    selectLoaderSync(URL_WITH_QUERYSTRING, [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    ImageLoader,
    'find loader from URL with query params'
  );

  const response = await fetchFile(DRACO_URL_QUERYSTRING);
  t.ok(response.url.endsWith(DRACO_URL_QUERYSTRING.slice(-20)), 'URL ends with ');
  t.is(
    selectLoaderSync(response, [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    DracoLoader,
    'find loader from response with query params'
  );

  t.throws(
    () => selectLoaderSync('data.obj', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find no loaders by url extension'
  );
});

test('selectLoader#urls', async (t) => {
  // @ts-ignore
  await t.rejects(selectLoader(null), 'selectedLoader rejects if no loader found');

  t.equal(
    // @ts-ignore
    await selectLoader('.', null, {nothrow: true}),
    null,
    'selectedLoader({nothrow: true}) returns null instead of throwing'
  );

  t.is(
    await selectLoader('data.laz', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    LASLoader,
    'find loader by url extension'
  );

  t.is(
    await selectLoader(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=',
      [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]
    ),
    ImageLoader,
    'find loader by data url mime type'
  );

  t.is(
    await selectLoader(URL_WITH_QUERYSTRING, [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    ImageLoader,
    'find loader from URL with query params'
  );

  const response = await fetchFile(DRACO_URL_QUERYSTRING);
  t.ok(response.url.endsWith(DRACO_URL_QUERYSTRING.slice(-20)), 'URL ends with ');
  t.is(
    await selectLoader(response, [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    DracoLoader,
    'find loader from response with query params'
  );

  t.rejects(
    selectLoader('data.obj', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find no loaders by url extension'
  );
});

test('selectLoader#data', async (t) => {
  const dracoResponse = await fetchFile(DRACO_URL);
  const dracoData = await dracoResponse.arrayBuffer();

  const tileResponse = await fetchFile(TILE_3D_URL);
  const tileData = await tileResponse.arrayBuffer();

  t.is(
    await selectLoader(dracoResponse, [Tiles3DLoader, DracoLoader, LASLoader]),
    DracoLoader,
    'find loader by examining Response object'
  );

  t.is(
    await selectLoader(dracoData, [Tiles3DLoader, DracoLoader, LASLoader]),
    DracoLoader,
    'find loader by examining binary data'
  );
  t.rejects(
    selectLoader(new ArrayBuffer(10), [Tiles3DLoader, DracoLoader, LASLoader]),
    'find no loaders by examining binary data'
  );
  t.rejects(selectLoader(dracoData, [LASLoader]), 'find no loaders by examining binary data');
  t.is(
    await selectLoader(tileData, [Tiles3DLoader]),
    Tiles3DLoader,
    'find loader by checking magic string'
  );

  const response = await fetchFile(KML_URL);
  const KML_SAMPLE = await response.text();

  t.is(
    await selectLoader(KML_SAMPLE, [KMLLoader]),
    KMLLoader,
    'find loader by examining text data'
  );
  t.rejects(selectLoader('hello', [KMLLoader]), 'find no loaders by examining text data');

  // Create an ArrayBuffer with a byteOffset to the payload
  const byteOffset = 10;
  const offsetBuffer = new ArrayBuffer(tileData.byteLength + byteOffset);
  const offsetArray = new Uint8Array(offsetBuffer, byteOffset);
  offsetArray.set(new Uint8Array(tileData));
  t.is(
    await selectLoader(offsetArray, [Tiles3DLoader]),
    Tiles3DLoader,
    'find loader by checking magic string in embedded tile data (with offset)'
  );

  t.end();
});

test('selectLoader#via (unregistered) MIME type', async (t) => {
  if (isBrowser) {
    const blob = new Blob([''], {type: 'application/x.draco'});
    const loader = await selectLoader(blob, [Tiles3DLoader, DracoLoader, LASLoader]);
    t.is(loader, DracoLoader, 'find loader by unregistered MIME type');
  }
  t.end();
});

test('selectLoader#Blob data sniffing', async (t) => {
  if (isBrowser) {
    const blob = new Blob(['DRACO']);
    let loader = await selectLoader(blob, [Tiles3DLoader, DracoLoader, LASLoader]);
    t.is(loader, DracoLoader, 'selectLoader find loader by Blob content sniffing');
    loader = selectLoaderSync(blob, [Tiles3DLoader, DracoLoader, LASLoader], {nothrow: true});
    t.is(loader, null, 'selectLoaderSync does not find loader by Blob content sniffing');
  }
  t.end();
});
