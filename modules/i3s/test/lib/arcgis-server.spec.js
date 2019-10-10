// eslint-disable-next-line
const ARCGIS_URL = `${__dirname}/../data/SanFrancisco_Bldgs/SceneServer/layers/0`;
// '@loaders.gl/i3s/test/data/SanFrancisco_Bldgs/SceneServer/layers/0';
// 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0?p=fjson';

import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';

test('getArcgisAssetMetadata#Download layer data', async t => {
  const response = await fetchFile(ARCGIS_URL);
  const tileset = await response.json();
  t.equal(tileset.id, 0);
  t.end();
});
