import {load} from '@loaders.gl/core';
import {ZipLoader} from '@loaders.gl/zip';
import {writeFile} from '../lib/utils/file-utils';
import {join} from 'path';

const PGM_LINK = 'https://github.com/visgl/deck.gl-data/raw/master/egm/egm2008-5.zip';

export class DepsInstaller {
  async install(path = '') {
    console.log('Installing "EGM2008-5" model...'); // eslint-disable-line no-console
    const fileMap = await load(PGM_LINK, ZipLoader, {fetch: {followRedirect: true}});

    let depsPath = process.cwd();
    if (path) {
      depsPath = join(depsPath, path);
    }

    await writeFile(depsPath, new Uint8Array(fileMap['geoids/egm2008-5.pgm']), 'egm2008-5.pgm');

    console.log('All dependencies were installed succesfully.'); // eslint-disable-line no-console
  }
}
