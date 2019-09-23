import test from 'tape-promise/tape';
// import {fetchFile, parse} from '@loaders.gl/core';
import {EPTLoader} from '@loaders.gl/potree';

// const POTREE_HIERARCHY_CHUNK_URL = '@loaders.gl/potree/test/data/lion_takanawa/data/r/r.hrc';

test('EPTLoader#parse', async t => {
  t.ok(EPTLoader);
  // const response = await fetchFile(POTREE_HIERARCHY_CHUNK_URL);
  // const rootNode = await parse(response, EPTHierarchyLoader);
  // t.ok(rootNode);
  t.end();
});
