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

export async function calculateFilesSize(params: {outputPath: string; tilesetName: string}) {
  const {outputPath, tilesetName} = params;
  const fullOutputPath = getAbsoluteFilePath(outputPath);

  try {
    const slpkPath = join(fullOutputPath, `${tilesetName}.slpk`);
    const stat = await fs.stat(slpkPath);
    return stat.size;
  } catch (error) {
    console.log('Calculate file sizes error: ', error); // eslint-disable-line
    return null;
  }
}
