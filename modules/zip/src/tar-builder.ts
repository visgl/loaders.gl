// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import Tar from './lib/tar/tar';

const TAR_BUILDER_OPTIONS = {
  recordsPerBlock: 20
};

type TarBuilderOptions = {
  recordsPerBlock?: number;
};

/**
 * Build a tar file by adding files
 */
export class TarBuilder {
  static get properties() {
    return {
      id: 'tar',
      name: 'TAR',
      extensions: ['tar'],
      mimeTypes: ['application/x-tar'],
      builder: TarBuilder,
      options: TAR_BUILDER_OPTIONS
    };
  }

  options: TarBuilderOptions;
  tape: Tar;
  count: number = 0;

  constructor(options?: Partial<TarBuilderOptions>) {
    this.options = {...TAR_BUILDER_OPTIONS, ...options};
    this.tape = new Tar(this.options.recordsPerBlock);
  }
  /** Adds a file to the archive. */
  addFile(filename: string, buffer: ArrayBuffer) {
    this.tape.append(filename, new Uint8Array(buffer));
    this.count++;
  }

  async build(): Promise<ArrayBuffer> {
    return new Response(this.tape.save()).arrayBuffer();
  }
}
