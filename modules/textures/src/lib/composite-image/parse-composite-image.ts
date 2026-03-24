// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext} from '@loaders.gl/loader-utils';
import {parseFromContext, path, resolvePath} from '@loaders.gl/loader-utils';
import type {Texture, TextureFormat, TextureLevel} from '@loaders.gl/schema';
import {ImageLoader, getImageSize, isImage, type ImageType} from '@loaders.gl/images';
import {asyncDeepMap} from '../texture-api/async-deep-map';
import type {TextureLoaderOptions} from '../texture-api/texture-api-types';
import {
  IMAGE_TEXTURE_CUBE_FACES,
  type ImageCubeTexture,
  type ImageTextureCubeDirectionAlias,
  type ImageTextureCubeFace
} from './image-texture-cube';

export type ImageTextureTemplateSource = {
  mipLevels: number | 'auto';
  template: string;
};

export type ImageTextureSource = string | string[] | ImageTextureTemplateSource;

export type ImageTextureManifest = {
  shape: 'image-texture';
  image?: string;
  mipLevels?: number | 'auto';
  template?: string;
  mipmaps?: string[];
};

export type ImageTextureArrayManifest = {
  shape: 'image-texture-array';
  layers: ImageTextureSource[];
};

export type ImageTextureCubeFaces = Partial<
  Record<ImageTextureCubeFace | ImageTextureCubeDirectionAlias, ImageTextureSource>
>;

export type ImageTextureCubeManifest = {
  shape: 'image-texture-cube';
  faces: ImageTextureCubeFaces;
};

export type ImageTextureCubeArrayLayer = {
  faces: ImageTextureCubeFaces;
};

export type ImageTextureCubeArrayManifest = {
  shape: 'image-texture-cube-array';
  layers: ImageTextureCubeArrayLayer[];
};

export type CompositeImageManifest =
  | ImageTextureManifest
  | ImageTextureArrayManifest
  | ImageTextureCubeManifest
  | ImageTextureCubeArrayManifest;

export type CompositeImageUrlTree =
  | ImageTextureSource
  | ImageTextureSource[]
  | ImageCubeTexture
  | ImageCubeTexture[];

export async function parseCompositeImageManifest(
  text: string,
  expectedShape: CompositeImageManifest['shape'],
  options: TextureLoaderOptions = {},
  context?: LoaderContext
): Promise<any> {
  const manifest = parseCompositeImageManifestJSON(text);
  if (manifest.shape !== expectedShape) {
    throw new Error(`Expected ${expectedShape} manifest, got ${manifest.shape}`);
  }
  return await loadCompositeImageManifest(manifest, options, context);
}

export function testCompositeImageManifestShape(
  text: string,
  shape: CompositeImageManifest['shape']
): boolean {
  try {
    return parseCompositeImageManifestJSON(text).shape === shape;
  } catch {
    return false;
  }
}

export async function loadCompositeImageManifest(
  manifest: CompositeImageManifest,
  options: TextureLoaderOptions = {},
  context?: LoaderContext
): Promise<Texture> {
  const normalizedOptions = normalizeCompositeImageManifestOptions(options);
  const urlTree = await getCompositeImageUrlTree(manifest, normalizedOptions, context);
  const imageData = await loadCompositeImageUrlTree(urlTree, normalizedOptions, context);
  return convertCompositeImageToTexture(manifest.shape, imageData);
}

export async function loadCompositeImageUrlTree(
  urlTree: CompositeImageUrlTree,
  options: TextureLoaderOptions = {},
  context?: LoaderContext
): Promise<any> {
  const normalizedOptions = normalizeCompositeImageOptions(options);
  return await asyncDeepMap(
    urlTree,
    async (url: string) => await loadCompositeImageMember(url, normalizedOptions, context)
  );
}

export async function loadCompositeImageMember(
  url: string,
  options: TextureLoaderOptions = {},
  context?: LoaderContext
): Promise<any> {
  const resolvedUrl = resolveCompositeImageUrl(url, options, context);
  const fetch = getCompositeImageFetch(options, context);
  const response = await fetch(resolvedUrl);
  const subloaderOptions = getCompositeImageSubloaderOptions(options);
  if (context) {
    const childContext = getCompositeImageMemberContext(resolvedUrl, response, context);
    return await parseFromContext(
      response as any,
      [ImageLoader],
      subloaderOptions as any,
      childContext
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return await ImageLoader.parse(arrayBuffer, subloaderOptions as any);
}

export async function getCompositeImageUrlTree(
  manifest: CompositeImageManifest,
  options: TextureLoaderOptions = {},
  context?: LoaderContext
): Promise<CompositeImageUrlTree> {
  switch (manifest.shape) {
    case 'image-texture':
      return await getImageTextureSource(manifest, options, context);

    case 'image-texture-array':
      if (!Array.isArray(manifest.layers) || manifest.layers.length === 0) {
        throw new Error('image-texture-array manifest must define one or more layers');
      }
      return await Promise.all(
        manifest.layers.map(
          async (layer, index) =>
            await getNormalizedImageTextureSource(layer, options, context, {index})
        )
      );

    case 'image-texture-cube':
      return await getImageTextureCubeUrls(manifest, options, context);

    case 'image-texture-cube-array':
      if (!Array.isArray(manifest.layers) || manifest.layers.length === 0) {
        throw new Error('image-texture-cube-array manifest must define one or more layers');
      }
      return await Promise.all(
        manifest.layers.map(
          async (layer, index) => await getImageTextureCubeUrls(layer, options, context, {index})
        )
      );

    default:
      throw new Error('Unsupported composite image manifest');
  }
}

export function normalizeCompositeImageOptions(
  options: TextureLoaderOptions = {}
): TextureLoaderOptions {
  if (options.core?.baseUrl) {
    return options;
  }

  const fallbackBaseUrl = options.baseUrl;
  if (!fallbackBaseUrl) {
    return options;
  }

  return {
    ...options,
    core: {
      ...options.core,
      baseUrl: fallbackBaseUrl
    }
  };
}

export function resolveCompositeImageUrl(
  url: string,
  options: TextureLoaderOptions = {},
  context?: LoaderContext
): string {
  const resolvedUrl = resolvePath(url);
  if (isAbsoluteCompositeImageUrl(url)) {
    return resolvedUrl;
  }

  const baseUrl = getCompositeImageBaseUrl(options, context);
  if (!baseUrl) {
    if (resolvedUrl !== url || url.startsWith('@')) {
      return resolvedUrl;
    }
    throw new Error(`Unable to resolve relative image URL ${url} without a base URL`);
  }

  return resolvePath(joinCompositeImageUrl(baseUrl, url));
}

function parseCompositeImageManifestJSON(text: string): CompositeImageManifest {
  const manifest = JSON.parse(text) as CompositeImageManifest;
  if (!manifest?.shape) {
    throw new Error('Composite image manifest must contain a shape field');
  }
  return manifest;
}

async function getImageTextureSource(
  manifest: ImageTextureManifest,
  options: TextureLoaderOptions,
  context?: LoaderContext
): Promise<ImageTextureSource> {
  if ((manifest.image || manifest.mipmaps) && manifest.template) {
    throw new Error('image-texture manifest must define image, mipmaps, or template source');
  }
  if (manifest.image && manifest.mipmaps) {
    throw new Error('image-texture manifest must define image, mipmaps, or template source');
  }
  if (manifest.image) {
    return manifest.image;
  }
  if (manifest.mipmaps?.length) {
    return manifest.mipmaps;
  }
  if (manifest.template) {
    return await expandImageTextureSource(
      {mipLevels: manifest.mipLevels ?? 'auto', template: manifest.template},
      options,
      context,
      {}
    );
  }
  throw new Error('image-texture manifest must define image, mipmaps, or template source');
}

async function getImageTextureCubeUrls(
  manifest: Pick<ImageTextureCubeManifest, 'faces'>,
  options: TextureLoaderOptions,
  context?: LoaderContext,
  templateOptions: TemplateOptions = {}
): Promise<ImageCubeTexture> {
  const urls: ImageCubeTexture = {};

  for (const {face, name, direction, axis, sign} of IMAGE_TEXTURE_CUBE_FACES) {
    const source = manifest.faces?.[name] || manifest.faces?.[direction];
    if (!source) {
      throw new Error(`image-texture-cube manifest is missing ${name} face`);
    }
    urls[face] = await getNormalizedImageTextureSource(source, options, context, {
      ...templateOptions,
      face: name,
      direction,
      axis,
      sign
    });
  }

  return urls;
}

async function getNormalizedImageTextureSource(
  source: ImageTextureSource,
  options: TextureLoaderOptions,
  context: LoaderContext | undefined,
  templateOptions: TemplateOptions
): Promise<ImageTextureSource> {
  if (typeof source === 'string') {
    return source;
  }
  if (Array.isArray(source) && source.length > 0) {
    return source;
  }
  if (isImageTextureTemplateSource(source)) {
    return await expandImageTextureSource(source, options, context, templateOptions);
  }
  throw new Error('Composite image source entries must be strings or non-empty mip arrays');
}

async function expandImageTextureSource(
  source: ImageTextureTemplateSource,
  options: TextureLoaderOptions,
  context: LoaderContext | undefined,
  templateOptions: TemplateOptions
): Promise<string[]> {
  const mipLevels =
    source.mipLevels === 'auto'
      ? await getAutoMipLevels(source.template, options, context, templateOptions)
      : source.mipLevels;

  if (!Number.isFinite(mipLevels) || mipLevels <= 0) {
    throw new Error(`Invalid mipLevels value ${source.mipLevels}`);
  }

  const urls: string[] = [];
  for (let lod = 0; lod < mipLevels; lod++) {
    urls.push(expandTemplate(source.template, {...templateOptions, lod}));
  }
  return urls;
}

async function getAutoMipLevels(
  template: string,
  options: TextureLoaderOptions,
  context: LoaderContext | undefined,
  templateOptions: TemplateOptions
): Promise<number> {
  if (!template.includes('{lod}')) {
    throw new Error('Template sources with mipLevels: auto must include a {lod} placeholder');
  }

  const level0Url = expandTemplate(template, {...templateOptions, lod: 0});
  const image = await loadCompositeImageMember(
    level0Url,
    normalizeCompositeImageOptions(options),
    context
  );
  const {width, height} = getImageSize(image);
  return 1 + Math.floor(Math.log2(Math.max(width, height)));
}

type TemplateOptions = {
  lod?: number;
  index?: number;
  face?: string;
  direction?: string;
  axis?: string;
  sign?: string;
};

function expandTemplate(template: string, templateOptions: TemplateOptions): string {
  let expanded = '';

  for (let index = 0; index < template.length; index++) {
    const character = template[index];

    if (character === '\\') {
      const nextCharacter = template[index + 1];
      if (nextCharacter === '{' || nextCharacter === '}' || nextCharacter === '\\') {
        expanded += nextCharacter;
        index++;
        continue;
      }
      throw new Error(`Invalid escape sequence \\${nextCharacter || ''} in template ${template}`);
    }

    if (character === '}') {
      throw new Error(`Unexpected } in template ${template}`);
    }

    if (character !== '{') {
      expanded += character;
      continue;
    }

    const closingBraceIndex = findClosingBraceIndex(template, index + 1);
    if (closingBraceIndex < 0) {
      throw new Error(`Unterminated placeholder in template ${template}`);
    }

    const placeholder = template.slice(index + 1, closingBraceIndex);
    if (!/^[a-z][a-zA-Z0-9]*$/.test(placeholder)) {
      throw new Error(`Invalid placeholder {${placeholder}} in template ${template}`);
    }

    const value = getTemplateValue(placeholder, templateOptions);
    if (value === undefined) {
      throw new Error(
        `Template ${template} uses unsupported placeholder {${placeholder}} for this source`
      );
    }

    expanded += String(value);
    index = closingBraceIndex;
  }

  return expanded;
}

function findClosingBraceIndex(template: string, startIndex: number): number {
  for (let index = startIndex; index < template.length; index++) {
    const character = template[index];
    if (character === '\\') {
      index++;
      continue;
    }
    if (character === '{') {
      throw new Error(`Nested placeholders are not supported in template ${template}`);
    }
    if (character === '}') {
      return index;
    }
  }
  return -1;
}

function getTemplateValue(
  placeholder: string,
  templateOptions: TemplateOptions
): string | number | undefined {
  switch (placeholder) {
    case 'lod':
      return templateOptions.lod;
    case 'index':
      return templateOptions.index;
    case 'face':
      return templateOptions.face;
    case 'direction':
      return templateOptions.direction;
    case 'axis':
      return templateOptions.axis;
    case 'sign':
      return templateOptions.sign;
    default:
      return undefined;
  }
}

function isImageTextureTemplateSource(
  source: ImageTextureSource
): source is ImageTextureTemplateSource {
  return typeof source === 'object' && source !== null && !Array.isArray(source);
}

function getCompositeImageBaseUrl(
  options: TextureLoaderOptions,
  context?: LoaderContext
): string | null {
  if (context?.baseUrl) {
    return context.baseUrl;
  }

  if (options.baseUrl) {
    return stripTrailingSlash(options.baseUrl);
  }

  if (options.core?.baseUrl) {
    return getSourceUrlDirectory(options.core.baseUrl);
  }

  return null;
}

function stripTrailingSlash(baseUrl: string): string {
  if (baseUrl.endsWith('/')) {
    return baseUrl.slice(0, -1);
  }

  return baseUrl;
}

function getSourceUrlDirectory(baseUrl: string): string {
  return stripTrailingSlash(path.dirname(baseUrl));
}

function joinCompositeImageUrl(baseUrl: string, url: string): string {
  if (isRequestLikeUrl(baseUrl)) {
    return new URL(url, `${stripTrailingSlash(baseUrl)}/`).toString();
  }

  const normalizedBaseUrl = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  const normalizedUrl = path.resolve(normalizedBaseUrl, url);
  return baseUrl.startsWith('/') ? normalizedUrl : normalizedUrl.slice(1);
}

function isRequestLikeUrl(url: string): boolean {
  return (
    url.startsWith('http:') ||
    url.startsWith('https:') ||
    url.startsWith('file:') ||
    url.startsWith('blob:')
  );
}

function getCompositeImageFetch(
  options: TextureLoaderOptions,
  context?: LoaderContext
): typeof fetch {
  const fetchOption = options.fetch ?? options.core?.fetch;

  if (context?.fetch) {
    return context.fetch as typeof fetch;
  }

  if (typeof fetchOption === 'function') {
    return fetchOption as typeof fetch;
  }

  if (fetchOption && typeof fetchOption === 'object') {
    return (url) => fetch(url, fetchOption);
  }

  return fetch;
}

function getCompositeImageSubloaderOptions(options: TextureLoaderOptions): TextureLoaderOptions {
  const core = options.core;
  const rest = {...options};
  delete rest.baseUrl;
  if (!core?.baseUrl) {
    return rest;
  }

  const restCore = {...core};
  delete restCore.baseUrl;
  return {
    ...rest,
    core: restCore
  };
}

function normalizeCompositeImageManifestOptions(
  options: TextureLoaderOptions
): TextureLoaderOptions {
  if (options.image?.type || typeof ImageBitmap === 'undefined') {
    return options;
  }

  return {
    ...options,
    image: {
      ...options.image,
      type: 'imagebitmap'
    }
  };
}

function getCompositeImageMemberContext(
  resolvedUrl: string,
  response: Response,
  context: LoaderContext
): LoaderContext {
  const url = response.url || resolvedUrl;
  const [urlWithoutQueryString, queryString = ''] = url.split('?');

  return {
    ...context,
    url,
    response,
    filename: path.filename(urlWithoutQueryString),
    baseUrl: path.dirname(urlWithoutQueryString),
    queryString
  };
}

function convertCompositeImageToTexture(
  shape: CompositeImageManifest['shape'],
  imageData: any
): Texture {
  switch (shape) {
    case 'image-texture': {
      const data = normalizeCompositeImageMember(imageData);
      return {
        shape: 'texture',
        type: '2d',
        format: getCompositeTextureFormat(data),
        data
      };
    }

    case 'image-texture-array': {
      const data = imageData.map((layer) => normalizeCompositeImageMember(layer));
      return {
        shape: 'texture',
        type: '2d-array',
        format: getCompositeTextureFormat(data[0]),
        data
      };
    }

    case 'image-texture-cube': {
      const data = IMAGE_TEXTURE_CUBE_FACES.map(({face}) =>
        normalizeCompositeImageMember(imageData[face])
      );
      return {
        shape: 'texture',
        type: 'cube',
        format: getCompositeTextureFormat(data[0]),
        data
      };
    }

    case 'image-texture-cube-array': {
      const data = imageData.map((layer) =>
        IMAGE_TEXTURE_CUBE_FACES.map(({face}) => normalizeCompositeImageMember(layer[face]))
      );
      return {
        shape: 'texture',
        type: 'cube-array',
        format: getCompositeTextureFormat(data[0][0]),
        data
      };
    }

    default:
      throw new Error(`Unsupported composite image shape ${shape}`);
  }
}

function normalizeCompositeImageMember(imageData: any): TextureLevel[] {
  if (Array.isArray(imageData)) {
    if (imageData.length === 0) {
      throw new Error('Composite image members must not be empty');
    }

    if (imageData.every(isTextureLevel)) {
      return imageData;
    }

    if (imageData.every(isImage)) {
      return imageData.map((image) => getTextureLevelFromImage(image));
    }

    if (imageData.every((entry) => Array.isArray(entry) && entry.every(isTextureLevel))) {
      if (imageData.length !== 1) {
        throw new Error('Composite image members must resolve to a single image or mip chain');
      }
      return imageData[0];
    }
  }

  if (isTexture(imageData)) {
    if (imageData.type !== '2d') {
      throw new Error(`Composite image members must resolve to 2d textures, got ${imageData.type}`);
    }
    return imageData.data;
  }

  if (isTextureLevel(imageData)) {
    return [imageData];
  }

  if (isImage(imageData)) {
    return [getTextureLevelFromImage(imageData)];
  }

  throw new Error('Composite image members must resolve to an image, mip chain, or texture');
}

function getTextureLevelFromImage(image: ImageType): TextureLevel {
  const {width, height} = getImageSize(image);
  return {
    shape: 'texture-level',
    compressed: false,
    width,
    height,
    imageBitmap:
      typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap ? image : undefined,
    data: new Uint8Array(0),
    textureFormat: 'rgba8unorm'
  };
}

function getCompositeTextureFormat(textureLevels: TextureLevel[]): TextureFormat {
  return textureLevels[0]?.textureFormat || 'rgba8unorm';
}

function isTextureLevel(textureLevel: unknown): textureLevel is TextureLevel {
  return Boolean(
    textureLevel &&
    typeof textureLevel === 'object' &&
    'shape' in textureLevel &&
    textureLevel.shape === 'texture-level'
  );
}

function isTexture(texture: unknown): texture is Texture {
  return Boolean(
    texture && typeof texture === 'object' && 'shape' in texture && texture.shape === 'texture'
  );
}

function isAbsoluteCompositeImageUrl(url: string): boolean {
  return (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('file:') ||
    url.startsWith('http:') ||
    url.startsWith('https:') ||
    url.startsWith('/')
  );
}
