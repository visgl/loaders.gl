// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {load, fetchFile} from '@loaders.gl/core';
import {ZipLoader} from '@loaders.gl/zip';
import {writeFile} from '../lib/utils/file-utils';
import {join, dirname} from 'path';
import {ChildProcessProxy} from '@loaders.gl/worker-utils';
import {DRACO_EXTERNAL_LIBRARIES, DRACO_EXTERNAL_LIBRARY_URLS} from '@loaders.gl/draco';
import {BASIS_EXTERNAL_LIBRARIES} from '@loaders.gl/textures';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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
  // eslint-disable-next-line max-statements
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
    await this.installFromUrl(
      DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.DECODER],
      'draco',
      DRACO_EXTERNAL_LIBRARIES.DECODER
    );
    await this.installFromUrl(
      DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.DECODER_WASM],
      'draco',
      DRACO_EXTERNAL_LIBRARIES.DECODER_WASM
    );

    console.log('Installing "Draco encoder" library'); // eslint-disable-line no-console
    await this.installFromUrl(
      DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.ENCODER],
      'draco',
      DRACO_EXTERNAL_LIBRARIES.ENCODER
    );

    console.log('Installing "Basis transcoder" library'); // eslint-disable-line no-console
    await this.installFromNpm('textures', BASIS_EXTERNAL_LIBRARIES.TRANSCODER, 'libs');
    await this.installFromNpm('textures', BASIS_EXTERNAL_LIBRARIES.TRANSCODER_WASM, 'libs');

    console.log('Installing "Basis encoder" library'); // eslint-disable-line no-console
    await this.installFromNpm('textures', BASIS_EXTERNAL_LIBRARIES.ENCODER, 'libs');
    await this.installFromNpm('textures', BASIS_EXTERNAL_LIBRARIES.ENCODER_WASM, 'libs');

    // eslint-disable-next-line no-console
    console.log('Installing "join-images" npm package');
    const childProcess = new ChildProcessProxy();
    const nodeDir = dirname(process.execPath);
    await childProcess.start({
      command: `${nodeDir}/${process.platform === 'win32' ? 'npm.cmd' : 'npm'}`,
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

    if (fileResponse.status < 200 || fileResponse.status >= 300) {
      throw new Error(`Failed to load resource ${name}`);
    }

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
