// loaders.gl, MIT license
import {ImageLoader} from '@loaders.gl/images';
import type {GetUrl, UrlOptions} from './texture-api-types';
import {getImageUrls} from './load-image';
import {deepLoad} from './deep-load';

// Returned map will be have keys corresponding to GL cubemap constants
const GL_TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
const GL_TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
const GL_TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
const GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851a;

const CUBE_FACES = [
  {face: GL_TEXTURE_CUBE_MAP_POSITIVE_X, direction: 'right', axis: 'x', sign: 'positive'},
  {face: GL_TEXTURE_CUBE_MAP_NEGATIVE_X, direction: 'left', axis: 'x', sign: 'negative'},
  {face: GL_TEXTURE_CUBE_MAP_POSITIVE_Y, direction: 'top', axis: 'y', sign: 'positive'},
  {face: GL_TEXTURE_CUBE_MAP_NEGATIVE_Y, direction: 'bottom', axis: 'y', sign: 'negative'},
  {face: GL_TEXTURE_CUBE_MAP_POSITIVE_Z, direction: 'front', axis: 'z', sign: 'positive'},
  {face: GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, direction: 'back', axis: 'z', sign: 'negative'}
];

export type ImageCubeTexture = {
  GL_TEXTURE_CUBE_MAP_POSITIVE_X: any;
  GL_TEXTURE_CUBE_MAP_NEGATIVE_X: any;
  GL_TEXTURE_CUBE_MAP_POSITIVE_Y: any;
  GL_TEXTURE_CUBE_MAP_NEGATIVE_Y: any;
  GL_TEXTURE_CUBE_MAP_POSITIVE_Z: any;
  GL_TEXTURE_CUBE_MAP_NEGATIVE_Z: any;
};

// Returns an object with six key-value pairs containing the urls (or url mip arrays)
// for each cube face
export async function getImageCubeUrls(getUrl: GetUrl, options: UrlOptions) {
  // Calculate URLs
  const urls: Record<number, string | string[]> = {};
  const promises: Promise<any>[] = [];

  let index = 0;
  for (let i = 0; i < CUBE_FACES.length; ++i) {
    const face = CUBE_FACES[index];
    const promise = getImageUrls(getUrl, options, {...face, index: index++}).then((url) => {
      urls[face.face] = url;
    });
    promises.push(promise);
  }

  await Promise.all(promises);

  return urls;
}

// Returns an object with six key-value pairs containing the images (or image mip arrays)
// for each cube face
export async function loadImageTextureCube(
  getUrl: GetUrl,
  options = {}
): Promise<ImageCubeTexture> {
  const urls = await getImageCubeUrls(getUrl, options);
  return (await deepLoad(urls, ImageLoader.parse, options)) as ImageCubeTexture;
}
