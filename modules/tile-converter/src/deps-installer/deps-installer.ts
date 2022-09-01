import {load, fetchFile} from '@loaders.gl/core';
import {ZipLoader} from '@loaders.gl/zip';
import {writeFile} from '../lib/utils/file-utils';
import {join} from 'path';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'beta';

const PGM_LINK = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/egm/egm2008-5.zip';

/**
 * Install external dependencies for converter:
 * * PGM file (implemented);
 * * Draco library (not implemented);
 * * 7z archiver (not implemented);
 */
export class DepsInstaller {
  /**
   * Run instalation
   * @param path destination folder
   */
  async install(path: string = ''): Promise<void> {
    console.log('Installing "EGM2008-5" model...'); // eslint-disable-line no-console
    const fileMap = await load(PGM_LINK, ZipLoader, {});

    let depsPath = process.cwd();
    if (path) {
      depsPath = join(depsPath, path);
    }

    await writeFile(depsPath, new Uint8Array(fileMap['geoids/egm2008-5.pgm']), 'egm2008-5.pgm');

    console.log('Installing "I3S Content Loader worker"'); // eslint-disable-line no-console
    await this.installWorker('i3s', 'i3s-content-nodejs-worker.js');

    console.log('Installing "Draco Loader worker"'); // eslint-disable-line no-console
    await this.installWorker('draco', 'draco-nodejs-worker.js');

    console.log('Installing "Basis Loader worker"'); // eslint-disable-line no-console
    await this.installWorker('textures', 'basis-nodejs-worker.js');

    console.log('All dependencies were installed succesfully.'); // eslint-disable-line no-console
  }

  private async installWorker(module: string, name: string) {
    const fileResponse = await fetchFile(
      `https://unpkg.com/@loaders.gl/${module}@${VERSION}/dist/${name}`
    );
    const fileData = await fileResponse.arrayBuffer();
    if (!fileData) {
      return;
    }
    const path = join(process.cwd(), 'modules', module, 'dist');
    await writeFile(path, fileData, name);
  }
}
