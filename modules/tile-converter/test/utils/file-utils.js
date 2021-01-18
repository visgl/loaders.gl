import {promises as fs, constants} from 'fs';
import {isBrowser} from '@loaders.gl/core';

export async function cleanUpPath(testPath) {
  // Do not run under browser
  if (!isBrowser) {
    try {
      await fs.rmdir(testPath, {recursive: true});
    } catch (e) {
      // Do nothing
    }
    try {
      await fs.unlink(`${testPath}.slpk`);
    } catch (e) {
      // Do nothing
    }
  }
}

export async function isFileExists(filePath) {
  let result = true;
  try {
    await fs.access(filePath, constants.R_OK);
  } catch (e) {
    result = false;
  }
  return result;
}
