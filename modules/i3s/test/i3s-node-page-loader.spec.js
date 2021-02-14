import test from 'tape-promise/tape';
import {parse, fetchFile} from '@loaders.gl/core';
import {I3SNodePageLoader} from '@loaders.gl/i3s/i3s-node-page-loader';

const NODEPAGE_URL =
  '@loaders.gl/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodepages/0';

test('I3SNodePageLoader#Load node page', async t => {
  const response = await fetchFile(NODEPAGE_URL);
  const nodePage = await parse(response, I3SNodePageLoader);
  t.ok(nodePage);
  t.ok(nodePage.nodes);
  t.equal(nodePage.nodes.length, 16);
  t.equal(nodePage.nodes[2].lodThreshold, 870638.071285568);
  t.end();
});
