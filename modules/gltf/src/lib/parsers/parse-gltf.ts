/* eslint-disable camelcase, max-statements, no-restricted-globals */
import type {LoaderContext} from '@loaders.gl/loader-utils';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {GLB} from '../types/glb-types';
import type {ParseGLBOptions} from './parse-glb';

import type {ImageType, TextureLevel} from '@loaders.gl/schema';
import {parseJSON, sliceArrayBuffer, parseFromContext} from '@loaders.gl/loader-utils';
import {ImageLoader} from '@loaders.gl/images';
import {BasisLoader, selectSupportedBasisFormat} from '@loaders.gl/textures';

import {assert} from '../utils/assert';
import {isGLB, parseGLBSync} from './parse-glb';
import {resolveUrl} from '../gltf-utils/resolve-url';
import {getTypedArrayForBufferView} from '../gltf-utils/get-typed-array';
import {preprocessExtensions, decodeExtensions} from '../api/gltf-extensions';
import {normalizeGLTFV1} from '../api/normalize-gltf-v1';

/**  */
export type ParseGLTFOptions = ParseGLBOptions & {
  normalize?: boolean;
  loadImages?: boolean;
  loadBuffers?: boolean;
  decompressMeshes?: boolean;
  excludeExtensions?: string[];
  /** @deprecated not supported in v4. `postProcessGLTF()` must be called by the application */
  postProcess?: never;
};

/** Check if an array buffer appears to contain GLTF data */
export function isGLTF(arrayBuffer: ArrayBuffer, options?: ParseGLTFOptions): boolean {
  const byteOffset = 0;
  return isGLB(arrayBuffer, byteOffset, options);
}

export async function parseGLTF(
  gltf: GLTFWithBuffers,
  arrayBufferOrString,
  byteOffset = 0,
  options: GLTFLoaderOptions,
  context: LoaderContext
): Promise<GLTFWithBuffers> {
  parseGLTFContainerSync(gltf, arrayBufferOrString, byteOffset, options);

  normalizeGLTFV1(gltf, {normalize: options?.gltf?.normalize});

  preprocessExtensions(gltf, options, context);

  // Load linked buffers asynchronously and decodes base64 buffers in parallel
  if (options?.gltf?.loadBuffers && gltf.json.buffers) {
    await loadBuffers(gltf, options, context);
  }

  // loadImages and decodeExtensions should not be running in parallel, because
  // decodeExtensions uses data from images taken during the loadImages call.
  if (options?.gltf?.loadImages) {
    await loadImages(gltf, options, context);
  }

  await decodeExtensions(gltf, options, context);

  return gltf;
}

/**
 *
 * @param gltf
 * @param data - can be ArrayBuffer (GLB), ArrayBuffer (Binary JSON), String (JSON), or Object (parsed JSON)
 * @param byteOffset
 * @param options
 */
function parseGLTFContainerSync(gltf, data, byteOffset, options) {
  // Initialize gltf container
  if (options.uri) {
    gltf.baseUri = options.uri;
  }

  // If data is binary and starting with magic bytes, assume binary JSON text, convert to string
  if (data instanceof ArrayBuffer && !isGLB(data, byteOffset, options)) {
    const textDecoder = new TextDecoder();
    data = textDecoder.decode(data);
  }

  if (typeof data === 'string') {
    // If string, try to parse as JSON
    gltf.json = parseJSON(data);
  } else if (data instanceof ArrayBuffer) {
    // If still ArrayBuffer, parse as GLB container
    const glb: GLB = {} as GLB;
    byteOffset = parseGLBSync(glb, data, byteOffset, options.glb);

    assert(glb.type === 'glTF', `Invalid GLB magic string ${glb.type}`);

    gltf._glb = glb;
    gltf.json = glb.json;
  } else {
    assert(false, 'GLTF: must be ArrayBuffer or string');
  }

  // Populate buffers
  // Create an external buffers array to hold binary data
  const buffers = gltf.json.buffers || [];
  gltf.buffers = new Array(buffers.length).fill(null);

  // Populates JSON and some bin chunk info
  if (gltf._glb && gltf._glb.header.hasBinChunk) {
    const {binChunks} = gltf._glb;
    gltf.buffers[0] = {
      arrayBuffer: binChunks[0].arrayBuffer,
      byteOffset: binChunks[0].byteOffset,
      byteLength: binChunks[0].byteLength
    };

    // TODO - this modifies JSON and is a post processing thing
    // gltf.json.buffers[0].data = gltf.buffers[0].arrayBuffer;
    // gltf.json.buffers[0].byteOffset = gltf.buffers[0].byteOffset;
  }

  // Populate images
  const images = gltf.json.images || [];
  gltf.images = new Array(images.length).fill({});
}

/** Asynchronously fetch and parse buffers, store in buffers array outside of json
 * TODO - traverse gltf and determine which buffers are actually needed
 */
async function loadBuffers(gltf: GLTFWithBuffers, options, context: LoaderContext) {
  // TODO
  const buffers = gltf.json.buffers || [];
  for (let i = 0; i < buffers.length; ++i) {
    const buffer = buffers[i];
    if (buffer.uri) {
      const {fetch} = context;
      assert(fetch);

      const uri = resolveUrl(buffer.uri, options);
      const response = await context?.fetch?.(uri);
      const arrayBuffer = await response?.arrayBuffer?.();

      gltf.buffers[i] = {
        arrayBuffer,
        byteOffset: 0,
        byteLength: arrayBuffer.byteLength
      };

      delete buffer.uri;
    } else if (gltf.buffers[i] === null) {
      gltf.buffers[i] = {
        arrayBuffer: new ArrayBuffer(buffer.byteLength),
        byteOffset: 0,
        byteLength: buffer.byteLength
      };
    }
  }
}

/**
 * Loads all images
 * TODO - traverse gltf and determine which images are actually needed
 * @param gltf
 * @param options
 * @param context
 * @returns
 */
async function loadImages(gltf: GLTFWithBuffers, options, context: LoaderContext) {
  const imageIndices = getReferencesImageIndices(gltf);

  const images = gltf.json.images || [];

  const promises: Promise<any>[] = [];
  for (const imageIndex of imageIndices) {
    promises.push(loadImage(gltf, images[imageIndex], imageIndex, options, context));
  }

  return await Promise.all(promises);
}

/** Make sure we only load images that are actually referenced by textures */
function getReferencesImageIndices(gltf: GLTFWithBuffers): number[] {
  const imageIndices = new Set<number>();

  const textures = gltf.json.textures || [];
  for (const texture of textures) {
    if (texture.source !== undefined) {
      imageIndices.add(texture.source);
    }
  }

  return Array.from(imageIndices).sort();
}

/** Asynchronously fetches and parses one image, store in images array outside of json */
async function loadImage(
  gltf: GLTFWithBuffers,
  image,
  index: number,
  options,
  context: LoaderContext
) {
  let arrayBuffer;

  if (image.uri && !image.hasOwnProperty('bufferView')) {
    const uri = resolveUrl(image.uri, options);

    const {fetch} = context;
    const response = await fetch(uri);

    arrayBuffer = await response.arrayBuffer();
    image.bufferView = {
      data: arrayBuffer
    };
  }

  if (Number.isFinite(image.bufferView)) {
    const array = getTypedArrayForBufferView(gltf.json, gltf.buffers, image.bufferView);
    arrayBuffer = sliceArrayBuffer(array.buffer, array.byteOffset, array.byteLength);
  }

  assert(arrayBuffer, 'glTF image has no data');

  // Call `parse`
  let parsedImage = (await parseFromContext(
    arrayBuffer,
    [ImageLoader, BasisLoader],
    {
      ...options,
      mimeType: image.mimeType,
      basis: options.basis || {format: selectSupportedBasisFormat()}
    },
    context
  )) as ImageType | TextureLevel[][];

  if (parsedImage && parsedImage[0]) {
    parsedImage = {
      compressed: true,
      // @ts-expect-error
      mipmaps: false,
      width: parsedImage[0].width,
      height: parsedImage[0].height,
      data: parsedImage[0]
    };
  }
  // TODO making sure ImageLoader is overridable by using array of loaders
  // const parsedImage = await parse(arrayBuffer, [ImageLoader]);

  // Store the loaded image
  gltf.images = gltf.images || [];
  // @ts-expect-error TODO - sort out image typing asap
  gltf.images[index] = parsedImage;
}
