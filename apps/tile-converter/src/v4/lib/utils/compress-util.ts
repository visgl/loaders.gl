import {createGzip} from 'zlib';
import {createReadStream, createWriteStream} from 'fs';
import {pipeline} from 'stream';

/**
 * Compress file to gzip file
 *
 * @param pathFile - the path to the file
 * @return the path to the gzip file
 */
export function compressFileWithGzip(pathFile: string): Promise<string> {
  const compressedPathFile = `${pathFile}.gz`;
  const gzip = createGzip();
  const input = createReadStream(pathFile);
  const output = createWriteStream(compressedPathFile);

  return new Promise((resolve, reject) => {
    pipeline(input, gzip, output, error => {
      if (error) {
        console.log(`${compressedPathFile}: compression error!`); // eslint-disable-line no-undef,no-console
        reject(error);
        return;
      }

      console.log(`${compressedPathFile} compressed and saved.`); // eslint-disable-line no-undef,no-console
      resolve(compressedPathFile);
    });
  });
}
