import {load} from '@loaders.gl/core';
import {JSONLoader} from '@loaders.gl/loader-utils';
import {promises as fs} from 'fs';
import {isAbsolute, join} from 'path';
import {compressFileWithGzip} from './compress-util';

/**
 * Write a file with data and name fileName to path
 *
 * @param path - output path
 * @param data - file content
 * @param fileName - name of output file (default: index.json)
 */
export async function writeFile(
  path: string,
  data: string | Uint8Array | ArrayBuffer | Promise<ArrayBuffer>,
  fileName: string = 'index.json'
): Promise<string> {
  let toWriteData: string | Uint8Array;
  if (data instanceof Promise) {
    toWriteData = new Uint8Array(await data);
  } else if (data instanceof ArrayBuffer) {
    toWriteData = new Uint8Array(data as ArrayBuffer);
  } else {
    toWriteData = data;
  }
  await fs.mkdir(path, {recursive: true});
  const pathFile = join(path, fileName);
  try {
    await fs.writeFile(pathFile, toWriteData);
  } catch (err) {
    throw err;
  }
  console.log(`${pathFile} saved.`); // eslint-disable-line
  return pathFile;
}

/**
 * Write a file with data and name fileName to path - specific one for further packaging into slpk
 *
 * @param path - output path
 * @param data - file content
 * @param fileName - name of output file (default: index.json)
 * @param compress - if need to compress file with gzip (default: true)
 * @param compressList - if set - the file should be added to this list and compressed in the end of conversion
 */
export async function writeFileForSlpk(
  path: string,
  data: string | Uint8Array | ArrayBuffer | Promise<ArrayBuffer>,
  fileName: string = 'index.json',
  compress: boolean = true,
  compressList?: string[] | null
): Promise<string | null> {
  const pathFile = await writeFile(path, data, fileName);
  if (compress) {
    if (compressList) {
      if (!compressList.includes(pathFile)) {
        compressList.push(pathFile);
        return `${pathFile}.gz`;
      } else {
        return null;
      }
    } else {
      const pathGzFile = await compressFileWithGzip(pathFile);
      // After compression, we don't need an uncompressed file
      await removeFile(pathFile);
      return pathGzFile;
    }
  }
  return pathFile;
}

export async function openJson(path: string, fileName: string): Promise<{[key: string]: any}> {
  const pathFile = join(path, fileName);
  try {
    return await load(pathFile, JSONLoader);
  } catch (err) {
    throw err;
  }
}

/**
 * Remove dir with path
 *
 * @param path
 */
export function removeDir(path: string) {
  return fs.rmdir(path, {recursive: true});
}

/**
 * Remove file with path
 *
 * @param path
 */
export function removeFile(path: string) {
  return fs.unlink(path);
}

/**
 * Generates absolute file path
 * @param filePath
 */
export function getAbsoluteFilePath(filePath: string) {
  return isAbsolute(filePath) ? filePath : join(process.cwd(), filePath); // eslint-disable-line no-undef
}
