import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';

import {DepsInstaller} from '../../src/deps-installer/deps-installer';
import {cleanUpPath, isFileExists} from '../utils/file-utils';

// The test cannot be run due to failing `npm install sharp join-images` in the test environment
test.skip('tile-converter Install dependencies', async (t) => {
  if (!isBrowser) {
    const depsInstaller = new DepsInstaller();
    await depsInstaller.install('tmp', 'tmp-workers');

    t.ok(await isFileExists('tmp/egm2008-5.pgm'));
    t.ok(await isFileExists('tmp-workers/modules/i3s/dist/i3s-content-nodejs-worker.js'));
    t.ok(await isFileExists('tmp-workers/modules/draco/dist/draco-nodejs-worker.js'));
    t.ok(await isFileExists('tmp-workers/modules/textures/dist/basis-nodejs-worker.js'));
  }
  await cleanUpPath('tmp');
  await cleanUpPath('tmp-workers');
  t.end();
});
