import type {AttributeStorageInfo} from '@loaders.gl/i3s';
import process from 'process';
import {isBrowser} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {Geoid} from '@math.gl/geoid';

import {BROWSER_ERROR_MESSAGE} from '../constants';
import {FileHandleProvider} from './helpers/file-handle-provider';
import {parseZipLocalFileHeader} from '@loaders.gl/i3s';
import {promises as fsPromises, existsSync} from 'fs';
import {path} from '@loaders.gl/loader-utils';
import {processOnWorker} from '@loaders.gl/worker-utils';
import {CompressionWorker} from '@loaders.gl/compression';

const indexNames = [
  '3dSceneLayer.json.gz',
  '3dNodeIndexDocument.json.gz',
  'sharedResource.json.gz'
];

type File = {
  name: string | null;
  data: ArrayBuffer;
};

/**
 * Converter from slpk to i3s
 */
export default class SLPKConverter {
  options: any;
  tilesetPath: string;
  vertexCounter: number;
  conversionStartTime: [number, number];
  geoidHeightModel: Geoid | null;
  sourceTileset: Tileset3D | null;
  attributeStorageInfo: AttributeStorageInfo | null;
  workerSource: {[key: string]: string} = {};

  constructor() {
    this.options = {};
    this.tilesetPath = '';
    this.vertexCounter = 0;
    this.conversionStartTime = [0, 0];
    this.geoidHeightModel = null;
    this.sourceTileset = null;
    this.attributeStorageInfo = null;
    this.workerSource = {};
  }

  /**
   * Convert slpk to i3s
   * @param options
   * @param options.inputUrl the url to read SLPK file
   * @param options.outputPath the output filename
   */
  public async convert(options: {inputUrl: string; outputPath: string}): Promise<string> {
    if (isBrowser) {
      console.log(BROWSER_ERROR_MESSAGE);
      return BROWSER_ERROR_MESSAGE;
    }
    const {inputUrl} = options;
    this.conversionStartTime = process.hrtime();

    const provider = await FileHandleProvider.from(inputUrl);

    let localHeader = await parseZipLocalFileHeader(0, provider);
    while (localHeader) {
      await this.writeFile(
        await this.unGzip({
          name: this.correctIndexNames(localHeader.fileName),
          data: await provider.slice(
            localHeader.fileDataOffset,
            localHeader.fileDataOffset + localHeader.compressedSize
          )
        }),
        options.outputPath
      );
      localHeader = await parseZipLocalFileHeader(
        localHeader?.fileDataOffset + localHeader?.compressedSize,
        provider
      );
    }

    return "success";
  }

  private correctIndexNames(fileName: string): string | null {
    if (indexNames.includes(path.filename(path.join('/', fileName)))) {
      return path.join(path.dirname(fileName), 'index.json.gz');
    }
    let parts = /^(.*\/[^\/\.]*)(\..+)$/.exec(fileName);
    if (!parts) {
      return null;
    }
    return `${parts?.at(1)}/index${parts?.at(2)}`; //TODO add index insert
  }

  private async unGzip(file: File): Promise<File> {
    if (/\.gz$/.test(file.name ?? '')) {
      const decompressedData = await processOnWorker(CompressionWorker, file.data, {
        compression: 'gzip',
        operation: 'decompress',
        _workerType: 'test',
        gzip: {}
      });
      return {data: decompressedData, name: (file.name ?? '').slice(0, -3)};
    }
    return Promise.resolve(file);
  }

  private async writeFile(options: File, outputPath: string): Promise<void> {
    if (!options.name) {
      return;
    }
    const finalPath = path.join(outputPath, options.name);
    const dirName = path.dirname(finalPath);
    if (!existsSync(dirName)) {
      await fsPromises.mkdir(dirName, {recursive: true});
    }
    await fsPromises.writeFile(finalPath, Buffer.from(options.data));
  }
}
