/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {fetchFile, _selectLoader as selectLoader} from '@loaders.gl/core';
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
    selectLoader(null, '.', null, {nothrow: true}),
    null,
    'selectedLoader({nothrow: true}) returns null instead of throwing'
  );

  t.is(
    selectLoader([ImageLoader, Tiles3DLoader, DracoLoader, LASLoader], 'data.laz', null),
    LASLoader,
    'find loader by url extension'
  );

  t.is(
    selectLoader(
      [ImageLoader, Tiles3DLoader, DracoLoader, LASLoader],
      // eslint-disable-next-line
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=',
      null
    ),
    ImageLoader,
    'find loader by data url'
  );
  t.throws(
    () => selectLoader([ImageLoader, Tiles3DLoader, DracoLoader, LASLoader], 'data.obj', null),
    'find no loaders by url extension'
  );
});

test('selectLoader#data', async t => {
  let response = await fetchFile(DRACO_URL);
  const dracoData = await response.arrayBuffer();

  response = await fetchFile(TILE_3D_URL);
  const tileData = await response.arrayBuffer();

  t.is(
    selectLoader([Tiles3DLoader, DracoLoader, LASLoader], null, dracoData),
    DracoLoader,
    'find loader by examining binary data'
  );
  t.throws(
    () => selectLoader([Tiles3DLoader, DracoLoader, LASLoader], null, new ArrayBuffer(10)),
    'find no loaders by examining binary data'
  );
  t.throws(
    () => selectLoader([LASLoader], null, dracoData),
    'find no loaders by examining binary data'
  );
  t.is(
    selectLoader([Tiles3DLoader], null, tileData),
    Tiles3DLoader,
    'find loader by checking magic string'
  );

  t.is(
    selectLoader([KMLLoader], null, KML_SAMPLE),
    KMLLoader,
    'find loader by examining text data'
  );
  t.throws(
    () => selectLoader([KMLLoader], null, 'hello'),
    'find no loaders by examining text data'
  );

  // Create an ArrayBuffer with a byteOffset to the payload
  const byteOffset = 10;
  const offsetBuffer = new ArrayBuffer(tileData.byteLength + byteOffset);
  const offsetArray = new Uint8Array(offsetBuffer, byteOffset);
  offsetArray.set(new Uint8Array(tileData));
  t.is(
    selectLoader([Tiles3DLoader], null, offsetArray),
    Tiles3DLoader,
    'find loader by checking magic string in embedded tile data (with offset)'
  );

  t.end();
});
