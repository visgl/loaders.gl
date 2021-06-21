import Tar from './lib/tar/tar';

type TAR_BUILDER_OPTIONS = {
  recordsPerBlock: number;
};
const TAR_BUILDER_OPTIONS = {
  recordsPerBlock: 20
};

/**
 * Build a tar file by adding files
 */

export default class TARBuilder {
  static get properties() {
    return {
      id: 'tar',
      name: 'TAR',
      extensions: ['tar'],
      mimeTypes: ['application/x-tar'],
      builder: TARBuilder,
      options: TAR_BUILDER_OPTIONS
    };
  }

  options: TAR_BUILDER_OPTIONS;
  tape: Tar;
  count: number = 0;

  constructor(options?: Partial<TAR_BUILDER_OPTIONS>) {
    this.options = {...TAR_BUILDER_OPTIONS, ...options};
    this.tape = new Tar(this.options.recordsPerBlock);
  }

  addFile(filename: string, buffer: ArrayBuffer) {
    this.tape.append(filename, new Uint8Array(buffer));
    this.count++;
  }

  async build(): Promise<ArrayBuffer> {
    return new Response(this.tape.save()).arrayBuffer();
  }
}
