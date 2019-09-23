import test from 'tape-promise/tape';
// import {fetchFile, parse} from '@loaders.gl/core';
import {EPTHierarchyLoader} from '@loaders.gl/potree';

// const POTREE_HIERARCHY_CHUNK_URL = '@loaders.gl/potree/test/data/lion_takanawa/data/r/r.hrc';

test('EPTHierarchyLoader#parse', async t => {
  t.ok(EPTHierarchyLoader);
  // const response = await fetchFile(POTREE_HIERARCHY_CHUNK_URL);
  // const rootNode = await parse(response, EPTHierarchyLoader);
  // t.ok(rootNode);
  t.end();
});
