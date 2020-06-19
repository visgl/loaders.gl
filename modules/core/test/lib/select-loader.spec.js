/* eslint-disable max-len */
/* global Blob */
import test from 'tape-promise/tape';
import {fetchFile, selectLoader, isBrowser} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {KMLLoader} from '@loaders.gl/kml';

import KML_SAMPLE from '@loaders.gl/kml/test/data/KML_Samples.kml';

const DRACO_URL = '@loaders.gl/draco/test/data/bunny.drc';
const TILE_3D_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudRGB/pointCloudRGB.pnts';

test('selectLoader#urls', async t => {
  t.throws(() => selectLoader(null), 'selectedLoader throws if no loader found');

  t.equal(
    selectLoader('.', null, {nothrow: true}),
    null,
    'selectedLoader({nothrow: true}) returns null instead of throwing'
  );

  t.is(
    selectLoader('data.laz', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    LASLoader,
    'find loader by url extension'
  );

  t.is(
    selectLoader(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=',
      [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]
    ),
    ImageLoader,
    'find loader by data url mime type'
  );

  t.is(
    selectLoader('https://wms.chartbundle.com/tms/1.0.0/sec/{z}/{x}/{y}.png?origin=nw', [
      ImageLoader,
      Tiles3DLoader,
      DracoLoader,
      LASLoader
    ]),
    ImageLoader,
    'find loader from URL with query params'
  );

  t.throws(
    () => selectLoader('data.obj', [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader]),
    'find no loaders by url extension'
  );
});

test('selectLoader#data', async t => {
  const dracoResponse = await fetchFile(DRACO_URL);
  const dracoData = await dracoResponse.arrayBuffer();

  const tileResponse = await fetchFile(TILE_3D_URL);
  const tileData = await tileResponse.arrayBuffer();

  t.is(
    selectLoader(dracoResponse, [Tiles3DLoader, DracoLoader, LASLoader]),
    DracoLoader,
    'find loader by examining Response object'
  );

  t.is(
    selectLoader(dracoData, [Tiles3DLoader, DracoLoader, LASLoader]),
    DracoLoader,
    'find loader by examining binary data'
  );
  t.throws(
    () => selectLoader(new ArrayBuffer(10), [Tiles3DLoader, DracoLoader, LASLoader]),
    'find no loaders by examining binary data'
  );
  t.throws(() => selectLoader(dracoData, [LASLoader]), 'find no loaders by examining binary data');
  t.is(
    selectLoader(tileData, [Tiles3DLoader]),
    Tiles3DLoader,
    'find loader by checking magic string'
  );

  t.is(selectLoader(KML_SAMPLE, [KMLLoader]), KMLLoader, 'find loader by examining text data');
  t.throws(() => selectLoader('hello', [KMLLoader]), 'find no loaders by examining text data');

  // Create an ArrayBuffer with a byteOffset to the payload
  const byteOffset = 10;
  const offsetBuffer = new ArrayBuffer(tileData.byteLength + byteOffset);
  const offsetArray = new Uint8Array(offsetBuffer, byteOffset);
  offsetArray.set(new Uint8Array(tileData));
  t.is(
    selectLoader(offsetArray, [Tiles3DLoader]),
    Tiles3DLoader,
    'find loader by checking magic string in embedded tile data (with offset)'
  );

  t.end();
});

test('selectLoader#unregistered MIME type', async t => {
  if (isBrowser) {
    const blob = new Blob([''], {type: 'application/x.draco'});
    const loader = selectLoader(blob, [Tiles3DLoader, DracoLoader, LASLoader]);
    t.is(loader, DracoLoader, 'find loader by unregistered MIME type');
  }
  t.end();
});
