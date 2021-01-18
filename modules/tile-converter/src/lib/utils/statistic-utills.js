import {join} from 'path';
import process from 'process';
import {promises as fs} from 'fs';

export function timeConverter(time) {
  const nanoSecondsInMillisecond = 1e6;
  let timeInSeconds = time[0];
  const hours = Math.floor(timeInSeconds / 3600);
  timeInSeconds = timeInSeconds - hours * 3600;
  const minutes = Math.floor(timeInSeconds / 60);
  timeInSeconds = timeInSeconds - minutes * 60;
  const seconds = Math.floor(timeInSeconds);
  const milliseconds = time[1] / nanoSecondsInMillisecond;
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
    result += `${milliseconds}ms`;
  }

  return result;
}

export async function calculateFilesSize(params) {
  const {slpk, outputPath, tilesetName} = params;

  if (slpk) {
    const slpkPath = join(process.cwd(), outputPath, `${tilesetName}.slpk`);
    const stat = await fs.stat(slpkPath);
    return stat.size;
  }
  const directoryPath = join(process.cwd(), outputPath, tilesetName);
  const totalSize = await getTotalFilesSize(directoryPath);
  return totalSize;
}

async function getTotalFilesSize(dirPath) {
  let totalFileSize = 0;

  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const fileStat = await fs.stat(join(dirPath, file));
    if (fileStat.isDirectory()) {
      totalFileSize += await getTotalFilesSize(join(dirPath, file));
    } else {
      totalFileSize += fileStat.size;
    }
  }
  return totalFileSize;
}
