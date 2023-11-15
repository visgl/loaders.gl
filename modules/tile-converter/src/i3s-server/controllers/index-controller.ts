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
  const FULL_LAYER_PATH = path.join(process.cwd(), I3S_LAYER_PATH);
  for (const ext of extensions) {
    const fileName = `${FULL_LAYER_PATH}${url}/index.${ext}`;
    try {
      await promises.access(fileName);
      return fileName;
    } catch {
      continue; // eslint-disable-line no-continue
    }
  }
  return null;
}
