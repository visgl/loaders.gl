import {PlatformImageLoader} from './image-loaders';

/*
 * Loads images asynchronously
 * image.crossOrigin can be set via opts.crossOrigin, default to 'anonymous'
 * returns a promise tracking the load
 */
export function loadImage(url, options) {
  return PlatformImageLoader.load(url, options);
}
