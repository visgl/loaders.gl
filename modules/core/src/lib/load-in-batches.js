import {fetchFile} from './fetch/fetch-file';
import {parseInBatches} from './parse-in-batches';

export async function loadInBatches(url, loaders, options) {
  const response = await fetchFile(url, options);
  return parseInBatches(response, loaders, options, url);
}
