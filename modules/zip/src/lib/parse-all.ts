import JSZip from 'jszip';
import {FileMap} from '../types';

/**
 * Load all files of zip archive with JSZip library
 * @param data - ZIP array buffer
 * @param options - loader options
 * @returns file map with extracted files
 * @todo - Could return a map of promises, perhaps as an option...
 */
export async function extractAllFromZip(data: ArrayBuffer, options = {}): Promise<FileMap> {
  const promises: Promise<any>[] = [];
  const fileMap: Record<string, ArrayBuffer> = {};

  try {
    const jsZip = new JSZip();

    const zip = await jsZip.loadAsync(data, options);

    // start to load each file in this zip
    zip.forEach((relativePath, zipEntry) => {
      const subFilename = zipEntry.name;

      const promise = loadZipEntry(jsZip, subFilename, options).then((arrayBufferOrError) => {
        fileMap[relativePath] = arrayBufferOrError;
      });

      // Ensure Promise.all doesn't ignore rejected promises.
      promises.push(promise);
    });

    await Promise.all(promises);
    return fileMap;
  } catch (error) {
    // @ts-ignore
    options.log.error(`Unable to read zip archive: ${error}`);
    throw error;
  }
}

async function loadZipEntry(jsZip: any, subFilename: string, options: any = {}) {
  // jszip supports both arraybuffer and text, the main loaders.gl types
  // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
  try {
    const arrayBuffer = await jsZip.file(subFilename).async(options.dataType || 'arraybuffer');
    return arrayBuffer;
  } catch (error) {
    options.log.error(`Unable to read ${subFilename} from zip archive: ${error}`);
    // Store error in place of data in map
    return error;
  }
}
