import {load, fetchFile} from '@loaders.gl/core';
import {ZipLoader} from '@loaders.gl/zip';
import {writeFile} from '../lib/utils/file-utils';
import {join} from 'path';
import {ChildProcessProxy} from '@loaders.gl/worker-utils';

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
   * @param workersPath destination folder for workers.
   *    This path is '' by default and is not used by tile-converter.
   *    It is used in tests to prevent rewriting actual workers during tests running
   */
  async install(path: string = '', workersPath: string = ''): Promise<void> {
    console.log('Installing "EGM2008-5" model...'); // eslint-disable-line no-console
    const fileMap = await load(PGM_LINK, ZipLoader, {});

    let depsPath = process.cwd();
    if (path) {
      depsPath = join(depsPath, path);
    }

    await writeFile(depsPath, new Uint8Array(fileMap['geoids/egm2008-5.pgm']), 'egm2008-5.pgm');

    console.log('Installing "I3S Content Loader worker"'); // eslint-disable-line no-console
    await this.installWorker('i3s', 'i3s-content-worker-node.js', workersPath);

    console.log('Installing "Draco Loader worker"'); // eslint-disable-line no-console
    await this.installWorker('draco', 'draco-worker-node.js', workersPath);

    console.log('Installing "Basis Loader worker"'); // eslint-disable-line no-console
    await this.installWorker('textures', 'basis-worker-node.js', workersPath);

    console.log('Installing "join-images" npm package');
    const childProcess = new ChildProcessProxy();
    await childProcess.start({
      command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      // `npm install sharp join-images` works unstable. It fails because installed `sharp` version
      // may be different from the version required by `join-images`. Pointing to specific versions
      // resolve this issue
      arguments: ['install', 'sharp@0.30.4', 'join-images@1.1.3'],
      wait: 0,
      ignoreStderr: true
    });

    console.log('All dependencies were installed succesfully.'); // eslint-disable-line no-console
  }

  private async installWorker(module: string, name: string, extraPath: string) {
    const fileResponse = await fetchFile(
      `https://unpkg.com/@loaders.gl/${module}@${VERSION}/dist/${name}`
    );
    const fileData = await fileResponse.arrayBuffer();
    if (!fileData) {
      return;
    }
    const path = join(process.cwd(), extraPath, 'modules', module, 'dist');
    await writeFile(path, fileData, name);
  }
}
