import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {getFileNameByUrl} from '../../../src/i3s-server/controllers/index-controller';

const URL_PREFIX =
  '/modules/tile-converter/test/data/i3s-server/Frankfurt-md-2/SceneServer/layers/0';
const TEST_CASES = [
  {input: '', output: 'index.json'},
  {input: '/nodepages/0', output: 'nodepages/0/index.json'},
  {input: '/nodes/root', output: 'nodes/root/index.json'},
  {input: '/nodes/1', output: 'nodes/1/index.json'},
  {input: '/nodes/1/geometries/0', output: 'nodes/1/geometries/0/index.bin'},
  {input: '/nodes/1/geometries/1', output: 'nodes/1/geometries/1/index.bin'},
  {input: '/nodes/1/shared', output: 'nodes/1/shared/index.json'},
  {input: '/nodes/1/textures/0', output: 'nodes/1/textures/0/index.jpg'},
  {input: '/nodes/1/textures/1', output: 'nodes/1/textures/1/index.ktx2'}
];

test('tile-converter(i3s-server)#getFileNameByUrl', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  const cwd = process.cwd();

  for (const testCase of TEST_CASES) {
    const result = await getFileNameByUrl(`${URL_PREFIX}${testCase.input}`);
    t.equals(result, `${cwd}${URL_PREFIX}/${testCase.output}`);
  }

  t.end();
});
