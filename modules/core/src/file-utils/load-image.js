import {getPathPrefix} from './path-prefix';
/* global Image */

/*
 * Loads images asynchronously (browser only)
 * image.crossOrigin can be set via options.crossOrigin, default to 'anonymous'
 * returns a promise tracking the load
 */
export function loadImage(url, options) {
  url = getPathPrefix() + url;

  return new Promise((resolve, reject) => {
    try {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image ${url}.`));
      image.crossOrigin = (options && options.crossOrigin) || 'anonymous';
      image.src = url;
    } catch (error) {
      reject(error);
    }
  });
}
