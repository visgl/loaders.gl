/* global process, console */

import {load} from '@loaders.gl/core';
import {ZipLoader} from '@loaders.gl/zip';
import {path} from '@loaders.gl/loader-utils';
// import {writeFile} from '../lib/utils/file-utils';

const PGM_LINK = 'https://github.com/visgl/deck.gl-data/raw/master/egm/egm2008-5.zip';

export class DepsInstaller {
  async install(installPath = '') {
    console.log('Installing "EGM2008-5" model...'); // eslint-disable-line no-console
    const fileMap = await load(PGM_LINK, ZipLoader, {fetch: {followRedirect: true}});

    let depsPath = process.cwd();
    if (installPath) {
      depsPath = path.join(depsPath, installPath);
    }

    // @ts-ignore
    // eslint-disable-next-line
    await writeFile(depsPath, new Uint8Array(fileMap['geoids/egm2008-5.pgm']), 'egm2008-5.pgm');

    console.log('All dependencies were installed succesfully.'); // eslint-disable-line no-console
  }
}
