import path from 'path';
import fs from 'fs';

const {promises} = fs;

/**
 * Get local file name by input HTTP URL
 * @param url - I3S HTTP service url
 * @param i3sLayerPath - I3S layer path
 * @returns - local file name
 */
export async function getFileNameByUrl(url: string, i3sLayerPath = ''): Promise<string | null> {
  i3sLayerPath = i3sLayerPath || process.env.I3sLayerPath || '';
  const extensions = ['json', 'bin', 'jpg', 'jpeg', 'png', 'bin.dds', 'ktx2'];
  let filePath = process.cwd();
  // Checks if the first character is not a point to indicate absolute path
  const absolutePath = /^[^.]/.exec(i3sLayerPath);
  if (absolutePath) {
    filePath = '';
  }
  const FULL_LAYER_PATH = path.join(filePath, i3sLayerPath, url);
  for (const ext of extensions) {
    const fileName = `${FULL_LAYER_PATH}/index.${ext}`;
    try {
      await promises.access(fileName);
      return fileName;
    } catch {
      continue; // eslint-disable-line no-continue
    }
  }
  return null;
}
