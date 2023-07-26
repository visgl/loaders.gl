import {isBrowser} from '@loaders.gl/core';

import {BROWSER_ERROR_MESSAGE} from '../constants';
import {FileHandleProvider} from './helpers/file-handle-provider';
import {parseZipLocalFileHeader} from '@loaders.gl/i3s';
import {path} from '@loaders.gl/loader-utils';
import {GZipCompression} from '@loaders.gl/compression';
import {writeFile} from '../lib/utils/file-utils';

const indexNames = [
  '3dSceneLayer.json.gz',
  '3dNodeIndexDocument.json.gz',
  'sharedResource.json.gz'
];

/**
 * Description of the file in the SLPK
 */
type File = {
  name: string | null;
  data: ArrayBuffer;
};

/**
 * Converter from slpk to i3s
 */
export default class SLPKConverter {
  /**
   * Extract slpk to i3s
   * @param options
   * @param options.inputUrl the url to read SLPK file
   * @param options.outputPath the output filename
   */
  public async extract(options: {inputUrl: string; outputPath: string}): Promise<string> {
    if (isBrowser) {
      console.log(BROWSER_ERROR_MESSAGE);
      return BROWSER_ERROR_MESSAGE;
    }
    const {inputUrl} = options;

    const provider = await FileHandleProvider.from(inputUrl);

    let localHeader = await parseZipLocalFileHeader(0n, provider);
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
        localHeader.fileDataOffset + localHeader?.compressedSize,
        provider
      );
    }

    return 'success';
  }

  /**
   * Defines file name and path for i3s format
   * @param fileName initial file name and path
   */

  private correctIndexNames(fileName: string): string | null {
    if (indexNames.includes(path.filename(path.join('/', fileName)))) {
      return path.join(path.dirname(fileName), 'index.json.gz');
    }
    // finds path with name part and extention part
    let parts = /^(.*\/[^\/\.]*)(\..+)$/.exec(fileName);
    if (!parts) {
      return null;
    }
    return `${parts?.at(1)}/index${parts?.at(2)}`;
  }

  private async unGzip(file: File): Promise<File> {
    if (/\.gz$/.test(file.name ?? '')) {
      const compression = new GZipCompression();

      const decompressedData = await compression.decompress(file.data);

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
    const fileName = path.filename(finalPath);
    await writeFile(dirName, options.data, fileName);
  }
}
