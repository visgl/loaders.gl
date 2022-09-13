/* eslint-disable camelcase, max-statements, no-restricted-globals */
import type {LoaderContext} from '@loaders.gl/loader-utils';
import {BasisLoader, selectSupportedBasisFormat} from '@loaders.gl/textures';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import type {GLB} from '../types/glb-types';
import type {GLTFWithBuffers} from '../types/gltf-types';

import {ImageLoader} from '@loaders.gl/images';
import {parseJSON, sliceArrayBuffer} from '@loaders.gl/loader-utils';
import {assert} from '../utils/assert';
import {resolveUrl} from '../gltf-utils/resolve-url';
import {getTypedArrayForBufferView} from '../gltf-utils/get-typed-array';
import {preprocessExtensions, decodeExtensions} from '../api/gltf-extensions';
import {normalizeGLTFV1} from '../api/normalize-gltf-v1';
import {postProcessGLTF} from '../api/post-process-gltf';
import parseGLBSync, {isGLB} from './parse-glb';

export type GLTFParseOptions = {
  normalize?: boolean;
  loadImages?: boolean;
  loadBuffers?: boolean;
  decompressMeshes?: boolean;
  postProcess?: boolean;
  excludeExtensions?: string[];
};

// export type GLTFOptions = {
//   gltf?: GLTFParseOptions;
// };

export function isGLTF(arrayBuffer, options?): boolean {
  const byteOffset = 0;
  return isGLB(arrayBuffer, byteOffset, options);
}

export async function parseGLTF(
  gltf: GLTFWithBuffers,
  arrayBufferOrString,
  byteOffset = 0,
  options: GLTFLoaderOptions,
  context: LoaderContext
) {
  parseGLTFContainerSync(gltf, arrayBufferOrString, byteOffset, options);

  normalizeGLTFV1(gltf, {normalize: options?.gltf?.normalize});

  preprocessExtensions(gltf, options, context);

  const promises: Promise<any>[] = [];

  // Load linked buffers asynchronously and decodes base64 buffers in parallel
  if (options?.gltf?.loadBuffers && gltf.json.buffers) {
    await loadBuffers(gltf, options, context);
  }

  if (options?.gltf?.loadImages) {
    const promise = loadImages(gltf, options, context);
    promises.push(promise);
  }

  const promise = decodeExtensions(gltf, options, context);
  promises.push(promise);

  // Parallelize image loading and buffer loading/extension decoding
  await Promise.all(promises);

  // Post processing resolves indices to objects, buffers
  return options?.gltf?.postProcess ? postProcessGLTF(gltf, options) : gltf;
}

// `data` - can be ArrayBuffer (GLB), ArrayBuffer (Binary JSON), String (JSON), or Object (parsed JSON)
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
  const {fetch, parse} = context;

  let arrayBuffer;

  if (image.uri && !image.hasOwnProperty('bufferView')) {
    const uri = resolveUrl(image.uri, options);
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
  let parsedImage = await parse(
    arrayBuffer,
    [ImageLoader, BasisLoader],
    {mimeType: image.mimeType, basis: options.basis || {format: selectSupportedBasisFormat()}},
    context
  );

  if (parsedImage && parsedImage[0]) {
    parsedImage = {
      compressed: true,
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
  gltf.images[index] = parsedImage;
}
