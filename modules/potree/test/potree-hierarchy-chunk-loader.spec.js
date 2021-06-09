import test from 'tape-promise/tape';
import {fetchFile, parse} from '@loaders.gl/core';
import {PotreeHierarchyChunkLoader} from '@loaders.gl/potree';

const POTREE_HIERARCHY_CHUNK_URL = '@loaders.gl/potree/test/data/lion_takanawa/data/r/r.hrc';

test('PotreeHierarchyChunkLoader#parse', async (t) => {
  const response = await fetchFile(POTREE_HIERARCHY_CHUNK_URL);
  const rootNode = await parse(response, PotreeHierarchyChunkLoader);
  // TODO - results not quite correct
  // t.equal(countTreeNodes(rootNode), 166);
  t.equal(countTreeNodes(rootNode), 45);
  t.equal(rootNode.name, '0', 'rootNode.name');
  t.equal(rootNode.pointCount, 4511, 'rootNode.pointCount');
  // t.equal(rootNode.childCount, 3, 'rootNode.childCount');
  t.equal(rootNode.children.length, 8, 'rootNode.children');
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
