/* global process */

import {load} from '@loaders.gl/core';
import {ZipLoader} from '@loaders.gl/zip';
import {writeFile} from '../lib/utils/file-utils';
import {join} from 'path';

const PGM_LINK =
  'https://netactuate.dl.sourceforge.net/project/geographiclib/geoids-distrib/egm2008-5.zip';

export class DepsInstaller {
  async install(path = '') {
    const fileMap = await load(PGM_LINK, ZipLoader);

    let depsPath = process.cwd();
    if (path) {
      depsPath = join(depsPath, path);
    }

    await writeFile(depsPath, new Uint8Array(fileMap['geoids/egm2008-5.pgm']), 'egm2008-5.pgm');
  }
}
