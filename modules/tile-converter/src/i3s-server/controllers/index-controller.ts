import path from 'path';
import fs from 'fs';

const {promises} = fs;

const I3S_LAYER_PATH = process.env.I3sLayerPath || '';

/**
 * Get local file name by input HTTP URL
 * @param url - I3S HTTP service url
 * @returns - local file name
 */
export async function getFileNameByUrl(url: string): Promise<string | null> {
  const extensions = ['json', 'bin', 'jpg', 'jpeg', 'png', 'bin.dds', 'ktx2'];
  let filePath = process.cwd();
  if (I3S_LAYER_PATH.startsWith('/')) {
    filePath = '';
  }
  const FULL_LAYER_PATH = path.join(filePath, I3S_LAYER_PATH, url);
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
