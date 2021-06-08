import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';

import {DepsInstaller} from '../../src/deps-installer/deps-installer';
import {cleanUpPath, isFileExists} from '../utils/file-utils';

test('tile-converter Install dependencies', async (t) => {
  if (!isBrowser) {
    const depsInstaller = new DepsInstaller();
    await depsInstaller.install('tmp');

    t.ok(await isFileExists('tmp/egm2008-5.pgm'));
  }
  await cleanUpPath('tmp');
  t.end();
});
