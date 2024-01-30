import {createGzip} from 'zlib';
import {createReadStream, createWriteStream} from 'fs';

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
    input.on('end', () => {
      console.log(`${compressedPathFile} compressed and saved.`); // eslint-disable-line no-undef,no-console
      resolve(compressedPathFile);
    });
    input.on('error', (error) => {
      console.log(`${compressedPathFile}: compression error!`); // eslint-disable-line no-undef,no-console
      reject(error);
    });
    input.pipe(gzip).pipe(output);
  });
}
