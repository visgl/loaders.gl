import {load, fetchFile} from '@loaders.gl/core';
import {ZipLoader} from '@loaders.gl/zip';
import {writeFile} from '../lib/utils/file-utils';
import {join} from 'path';
import {ChildProcessProxy} from '@loaders.gl/worker-utils';
import {
  DRACO_ENCODER_NAME,
  DRACO_ENCODER_URL,
  DRACO_WASM_DECODER_NAME,
  DRACO_WASM_DECODER_URL,
  DRACO_WASM_WRAPPER_NAME,
  DRACO_WASM_WRAPPER_URL
} from '@loaders.gl/draco';

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
  async install(path: string = ''): Promise<void> {
    console.log('Installing "EGM2008-5" model...'); // eslint-disable-line no-console
    const fileMap = await load(PGM_LINK, ZipLoader, {});

    let depsPath = process.cwd();
    if (path) {
      depsPath = join(depsPath, path);
    }

    await writeFile(depsPath, new Uint8Array(fileMap['geoids/egm2008-5.pgm']), 'egm2008-5.pgm');

    console.log('Installing "I3S Content Loader" worker'); // eslint-disable-line no-console
    await this.installFromNpm('i3s', 'i3s-content-worker-node.js');

    console.log('Installing "Draco Loader" worker'); // eslint-disable-line no-console
    await this.installFromNpm('draco', 'draco-worker-node.js');

    console.log('Installing "Draco Writer" worker'); // eslint-disable-line no-console
    await this.installFromNpm('draco', 'draco-writer-worker-node.js');

    console.log('Installing "Basis Loader" worker'); // eslint-disable-line no-console
    await this.installFromNpm('textures', 'basis-worker-node.js');

    console.log('Installing "KTX2 Basis Writer" worker'); // eslint-disable-line no-console
    await this.installFromNpm('textures', 'ktx2-basis-writer-worker-node.js');

    console.log('Installing "Draco decoder" library'); // eslint-disable-line no-console
    await this.installFromUrl(DRACO_WASM_WRAPPER_URL, 'draco', DRACO_WASM_WRAPPER_NAME);
    await this.installFromUrl(DRACO_WASM_DECODER_URL, 'draco', DRACO_WASM_DECODER_NAME);

    console.log('Installing "Draco encoder" library'); // eslint-disable-line no-console
    await this.installFromUrl(DRACO_ENCODER_URL, 'draco', DRACO_ENCODER_NAME);

    console.log('Installing "Basis transcoder" library'); // eslint-disable-line no-console
    await this.installFromNpm('textures', 'basis_transcoder.js', 'libs');
    await this.installFromNpm('textures', 'basis_transcoder.wasm', 'libs');

    console.log('Installing "Basis encoder" library'); // eslint-disable-line no-console
    await this.installFromNpm('textures', 'basis_encoder.js', 'libs');
    await this.installFromNpm('textures', 'basis_encoder.wasm', 'libs');

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

  private async installFromNpm(module: string, name: string, extraPath: string = '') {
    const fileResponse = await fetchFile(
      `https://unpkg.com/@loaders.gl/${module}@${VERSION}/dist/${extraPath}/${name}`
    );
    const fileData = await fileResponse.arrayBuffer();
    if (!fileData) {
      return;
    }
    const path = join(process.cwd(), 'modules', module, 'dist', extraPath);
    await writeFile(path, fileData, name);
  }

  private async installFromUrl(url: string, module: string, name: string) {
    const fileResponse = await fetchFile(url);
    const fileData = await fileResponse.arrayBuffer();
    if (!fileData) {
      return;
    }
    const path = join(process.cwd(), 'modules', module, 'dist', 'libs');
    await writeFile(path, fileData, name);
  }
}
