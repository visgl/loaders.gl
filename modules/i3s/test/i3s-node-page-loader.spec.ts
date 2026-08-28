import {expect, test} from 'vitest';
import {parse, fetchFile} from '@loaders.gl/core';
import {I3SNodePageLoader} from '@loaders.gl/i3s';
const NODEPAGE_URL =
  '@loaders.gl/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodepages/0';
test('I3SNodePageLoader#Load node page', async () => {
  const response = await fetchFile(NODEPAGE_URL);
  const nodePage = await parse(response, I3SNodePageLoader);
  expect(nodePage).toBeTruthy();
  expect(nodePage.nodes).toBeTruthy();
  expect(nodePage.nodes.length).toBe(16);
  expect(nodePage.nodes[2].lodThreshold).toBe(870638.071285568);
});
