import test from 'tape-promise/tape';
import {fetchFile, parse} from '@loaders.gl/core';
import {PotreeHierarchyChunkLoader} from '@loaders.gl/potree';

const POTREE_HIERARCHY_CHUNK_URL = '@loaders.gl/potree/test/data/lion_takanawa/data/r/r.hrc';

test('PotreeHierarchyChunkLoader#parse', async (t) => {
  const response = await fetchFile(POTREE_HIERARCHY_CHUNK_URL);
  const rootNode = await parse(response, PotreeHierarchyChunkLoader);
  t.equal(countTreeNodes(rootNode), 167);
  t.equal(rootNode.name, '', 'rootNode.name');
  t.equal(rootNode.pointCount, 3751, 'rootNode.pointCount');
  t.equal(rootNode.header.childCount, 6, 'rootNode.childCount');
  t.equal(rootNode.children.length, 6, 'rootNode.children');
  t.equal(rootNode.childrenByIndex.length, 8, 'rootNode.childrenByIndex');
  t.end();
});

function countTreeNodes(node) {
  let count = 1;
  for (const child of node.children) {
    count += countTreeNodes(child);
  }
  return count;
}
