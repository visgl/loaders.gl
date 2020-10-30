import {join} from 'path';
import process from 'process';
import {promises as fs} from 'fs';

export function timeConverter(time) {
  const timeInSecons = time[0];
  const hours = Math.floor(timeInSecons / 60 / 60);
  const minutes = Math.floor(timeInSecons / 60) % 60;
  const seconds = Math.floor(timeInSecons - minutes * 60);
  const milliseconds = time[1];
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
