import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {path} from '@loaders.gl/loader-utils';
import {getFileByUrl, loadArchive} from '../../../src/i3s-server/controllers/slpk-controller';

const URL_PREFIX = '';
const SLPK_URL = './modules/i3s/test/data/DA12_subset.slpk';
const TEST_CASES = [
  {input: '', output: 4780},
  {input: 'nodepages/0', output: 16153},
  {input: 'nodes/root', output: 11550},
  {input: 'nodes/1', output: 1175},
  {input: 'nodes/1/geometries/0', output: 25620},
  {input: 'nodes/1/geometries/1', output: 1767},
  {input: 'nodes/1/shared', output: 333}
];

test('tile-converter(i3s-server)#getFileByUrl return null if file is not loaded', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  const result = await getFileByUrl('layers/0');
  t.equals(result, null);

  t.end();
});

test.only('tile-converter(i3s-server)#getFileByUrl return files content', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  const FULL_LAYER_PATH = path.join(process.cwd(), SLPK_URL); // eslint-disable-line no-undef
  await loadArchive(FULL_LAYER_PATH);

  for (const testCase of TEST_CASES) {
    const result = await getFileByUrl(`${URL_PREFIX}${testCase.input}`);
    t.equals(result?.byteLength, testCase.output);
  }

  t.end();
});
