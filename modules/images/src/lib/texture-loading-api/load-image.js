import assert from '../utils/assert';
import parseImage from '../parsers/parse-image';
import {getImageSize} from '../parsed-image-api/parsed-image-api';
import {generateUrl} from './generate-url';
import {deepLoad, shallowLoad} from './deep-load';

export async function loadImage(getUrl, options = {}) {
  const imageUrls = await getImageUrls(getUrl, options);
  return await deepLoad(imageUrls, parseImage, options);
}

export async function getImageUrls(getUrl, options, urlOptions = {}) {
  const mipLevels = (options && options.image && options.image.mipLevels) || 0;
  return mipLevels !== 0
    ? await getMipmappedImageUrls(getUrl, mipLevels, options, urlOptions)
    : generateUrl(getUrl, options, urlOptions);
}

async function getMipmappedImageUrls(getUrl, mipLevels, options, urlOptions) {
  const urls = [];

  // If no mip levels supplied, we need to load the level 0 image and calculate based on size
  if (mipLevels === 'auto') {
    const url = generateUrl(getUrl, options, {...urlOptions, lod: 0});
    const image = await shallowLoad(url, parseImage, options);

    const {width, height} = getImageSize(image);
    mipLevels = getMipLevels({width, height});

    // TODO - push image and make `deepLoad` pass through non-url values, avoid loading twice?
    urls.push(url);
  }

  // We now know how many mipLevels we need, remaining image urls can now be constructed
  assert(mipLevels > 0);

  for (let mipLevel = urls.length; mipLevel < mipLevels; ++mipLevel) {
    const url = generateUrl(getUrl, options, {...urlOptions, lod: mipLevel});
    urls.push(url);
  }

  return urls;
}

// Calculates number of mipmaps based on texture size (log2)
export function getMipLevels({width, height}) {
  return 1 + Math.floor(Math.log2(Math.max(width, height)));
}

/*
export async function loadImage(getUrl, options) {
  options = options || {};
  const imageOptions = options.image || {};

  return `mipLevels` in imageOptions && imageOptions.mipLevels !== 0
    ? await loadMipmappedImage(getUrl, imageOptions.mipLevels, options)
    : await loadSingleImage(getUrl, options);
}

// Load array of images representing mipmap levels for a texture
async function loadMipmappedImage(getUrl, mipLevels, options) {
  assert(typeof getUrl === 'function');

  // Remaining images can be loaded in parallel
  const promises = [];

  // If no mip levels supplied, we need to load the level 0 image and calculate based on size
  if (mipLevels === 'auto') {
    const url = generateUrl(getUrl, options, {lod: 0});
    const image = await loadSingleImage(url, options);

    const {width, height} = getImageSize(image);
    mipLevels = getMipLevels({width, height});

    promises.push(image);
  }

  assert(mipLevels > 0);

  for (let mipLevel = promises.length; mipLevel < mipLevels; ++mipLevel) {
    const url = generateUrl(getUrl, options, {lod: mipLevel});
    const promise = loadSingleImage(url, options);
    promises.push(promise);
  }

  return await Promise.all(promises);
}
*/
