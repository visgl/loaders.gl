import {join} from 'path';
import {promises as fs} from 'fs';
import {getAbsoluteFilePath} from './file-utils';

/**
 * Converts time value to string.
 * @param time - high-resolution real time in a [seconds, nanoseconds] tuple Array, or a value on milliseconds.
 * @returns string representation of the time
 */
export function timeConverter(time: number | [number, number]): string {
  if (typeof time === 'number') {
    // time - real time in milli-seconds
    const milliSecondsInSecond = 1e3;
    const timeInSeconds = Math.floor(time / milliSecondsInSecond);
    const milliseconds = time - timeInSeconds * milliSecondsInSecond;
    return timeConverterFromSecondsAndMilliseconds(timeInSeconds, milliseconds);
  }
  // time - high-resolution real time in a [seconds, nanoseconds] tuple Array
  const nanoSecondsInMillisecond = 1e6;
  const timeInSeconds = time[0];
  const milliseconds = time[1] / nanoSecondsInMillisecond;
  return timeConverterFromSecondsAndMilliseconds(timeInSeconds, milliseconds);
}

function timeConverterFromSecondsAndMilliseconds(timeInSeconds: number, milliseconds: number) {
  const hours = Math.floor(timeInSeconds / 3600);
  timeInSeconds = timeInSeconds - hours * 3600;
  const minutes = Math.floor(timeInSeconds / 60);
  timeInSeconds = timeInSeconds - minutes * 60;
  const seconds = Math.floor(timeInSeconds);
  let result = '';

  if (hours) {
    result += `${hours}h `;
  }

  if (minutes) {
    result += `${minutes}m `;
  }

  if (seconds) {
    result += `${seconds}s`;
  }

  if (!result) {
    result += `${Math.floor(milliseconds)}ms`;
  }

  return result;
}

/**
 * Calculates overall datatset size
 * @param params - params object
 * @param params.slpk - if dataset is in slpk format
 * @param params.outputPath - path to the folder containing the dataset
 * @param params.tilesetName - tileset name
 * @returns dataset size in bytes
 */
export async function calculateDatasetSize(params: {
  slpk?: boolean;
  outputPath: string;
  tilesetName: string;
}): Promise<number | null> {
  const {slpk, outputPath, tilesetName} = params;
  const fullOutputPath = getAbsoluteFilePath(outputPath);

  try {
    if (slpk) {
      const slpkPath = join(fullOutputPath, `${tilesetName}.slpk`);
      const stat = await fs.stat(slpkPath);
      return stat.size;
    }

    const directoryPath = join(fullOutputPath, tilesetName);
    const totalSize = await getDirectorySize(directoryPath);
    return totalSize;
  } catch (error) {
    console.log('Calculate file sizes error: ', error); // eslint-disable-line
    return null;
  }
}

/**
 * Calculates directory size
 * @param dirPath - path to the directory
 * @returns directory size in bytes
 */
async function getDirectorySize(dirPath: string): Promise<number> {
  let totalFileSize = 0;

  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const fileStat = await fs.stat(join(dirPath, file));
    if (fileStat.isDirectory()) {
      totalFileSize += await getDirectorySize(join(dirPath, file));
    } else {
      totalFileSize += fileStat.size;
    }
  }
  return totalFileSize;
}
