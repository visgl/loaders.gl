import test from 'tape-promise/tape';

// @ts-expect-error it required `@loaders.gl/i3s/src/lib/helpers/i3s-nodepages-tiles` but it fails because tries to get the dependency from
// `@loaders.gl/i3s/src/src/lib/helpers/i3s-nodepages-tiles`
import I3SNodePagesTiles from '@loaders.gl/i3s/lib/helpers/i3s-nodepages-tiles';
import {
  TILESET_STUB,
  getI3sTileHeader,
  TEST_LAYER_URL
} from '@loaders.gl/i3s/test/test-utils/load-utils';
import {loadI3SContent} from '../../../src/3d-tiles-converter/helpers/load-i3s';

test('tile-converter(i3s)#loadNestedTileset', async (t) => {
  const i3sTilesetData = TILESET_STUB();
  const i3SNodePagesTiles = new I3SNodePagesTiles(i3sTilesetData, TEST_LAYER_URL, {});
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  const i3sTilesetHeader = await getI3sTileHeader({}, false, i3sTilesetData);
  const content = await loadI3SContent(i3sTilesetHeader, node1, {}, null);
  t.ok(content);
  t.equal(content?.vertexCount, 25638);
});
