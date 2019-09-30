import parseImage from '../parsers/parse-image';
import {getImageUrls} from './load-image';
import {deepLoad} from './deep-load';

export async function loadImageArray(count, getUrl, options = {}) {
  const imageUrls = await getImageArrayUrls(count, getUrl, options);
  return await deepLoad(imageUrls, parseImage, options);
}

export async function getImageArrayUrls(count, getUrl, options = {}) {
  const promises = [];
  for (let index = 0; index < count; index++) {
    const promise = getImageUrls(getUrl, options, {index});
    promises.push(promise);
  }
  return await Promise.all(promises);
}
