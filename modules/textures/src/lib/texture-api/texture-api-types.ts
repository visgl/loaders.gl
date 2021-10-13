// loaders.gl, MIT license

export type {ImageType} from '@loaders.gl/images';

export type UrlOptions = {
  baseUrl?: string;
  index?: number;
  face?: number;
  lod?: number;
  direction?: string;
};
export type GetUrl = (options: UrlOptions) => string;
