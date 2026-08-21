// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase, max-statements, no-restricted-globals */
import type {LoaderContext} from '@loaders.gl/loader-utils';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import type {GLTFExternalFile, GLTFWithBuffers} from '../types/gltf-types';
import type {GLB} from '../types/glb-types';
import type {ParseGLBOptions} from './parse-glb';

import type {ImageType, TextureLevel} from '@loaders.gl/schema';
import {parseJSON, sliceArrayBuffer, parseFromContext} from '@loaders.gl/loader-utils';
import {ImageBitmapLoader} from '@loaders.gl/images';
import {BasisLoader, selectSupportedBasisFormat} from '@loaders.gl/textures';

import {assert} from '../utils/assert';
import {isGLB, parseGLBSync} from './parse-glb';
import {canonicalizeUrl, resolveUrl} from '../gltf-utils/resolve-url';
import {findGLTFFileIndex, resolveGLTFFile} from '../gltf-utils/resolve-gltf-file';
import {getTypedArrayForBufferView} from '../gltf-utils/get-typed-array';
import {preprocessExtensions, decodeExtensions} from '../api/gltf-extensions';
import {normalizeGLTFV1} from '../api/normalize-gltf-v1';

/**  */
export type ParseGLTFOptions = ParseGLBOptions & {
  normalize?: boolean;
  loadImages?: boolean;
  /** Load linked and embedded buffers; required for meshopt decompression. @default true */
  loadBuffers?: boolean;
  /** Resolve draft glTF 2.1 `files` entries. */
  loadFiles?: boolean;
  /** Recursively parse draft glTF 2.1 external assets referenced by nodes. */
  loadExternalAssets?: boolean;
  /** Decompress Draco, `EXT_meshopt_compression`, and `KHR_meshopt_compression` data. @default true */
  decompressMeshes?: boolean;
  excludeExtensions?: string[];
  /** @deprecated not supported in v4. `postProcessGLTF()` must be called by the application */
  postProcess?: never;
};

/**
 * Creates options for parsing an image referenced by a glTF asset.
 * Resolves automatic Basis format selection before the image is delegated to a worker.
 * @param options - glTF loader options.
 * @param mimeType - MIME type declared by the glTF image.
 * @returns Loader options for the referenced image.
 */
export function getGLTFImageOptions(
  options: GLTFLoaderOptions,
  mimeType?: string
): GLTFLoaderOptions {
  const basisOptions = options.basis;
  const basisFormat = basisOptions?.format;

  return {
    ...options,
    core: {...options.core, mimeType},
    basis: {
      ...basisOptions,
      format:
        basisFormat && basisFormat !== 'auto'
          ? basisFormat
          : selectSupportedBasisFormat(basisOptions?.supportedTextureFormats)
    }
  };
}

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
  return await parseGLTFWithExternalAssets(gltf, arrayBufferOrString, byteOffset, options, context);
}

/** Parse glTF data while carrying recursion state through nested external assets. */
async function parseGLTFWithExternalAssets(
  gltf: GLTFWithBuffers,
  arrayBufferOrString,
  byteOffset: number,
  options: GLTFLoaderOptions,
  context: LoaderContext,
  externalAssetLoadState?: ExternalAssetLoadState
): Promise<GLTFWithBuffers> {
  parseGLTFContainerSync(gltf, arrayBufferOrString, byteOffset, options);

  normalizeGLTFV1(gltf, {normalize: options?.gltf?.normalize});

  preprocessExtensions(gltf, options, context);

  // Load linked buffers asynchronously and decodes base64 buffers in parallel
  if (options?.gltf?.loadBuffers && gltf.json.buffers) {
    await loadBuffers(gltf, options, context);
  }

  if (options?.gltf?.loadFiles && gltf.json.files) {
    await loadFiles(gltf, options, context);
  }

  if (options?.gltf?.loadExternalAssets && gltf.json.externalAssets) {
    await loadExternalAssets(gltf, options, context, externalAssetLoadState);
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
function parseGLTFContainerSync(gltf, data, byteOffset, options: GLTFLoaderOptions) {
  // Initialize gltf container
  if (options.core?.baseUrl) {
    gltf.baseUri = options.core?.baseUrl;
  }

  // If data is binary and starting with magic bytes, assume binary JSON text, convert to string
  if (data instanceof ArrayBuffer && !isGLB(data, byteOffset, options.glb)) {
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
  const bufferDefinitions = Array.isArray(buffers) ? buffers : [];
  gltf.buffers = new Array(buffers.length).fill(null);

  // Resolve GLB chunks into the parallel buffers array.
  if (gltf._glb) {
    const {binChunks} = gltf._glb;

    for (let bufferIndex = 0; bufferIndex < bufferDefinitions.length; bufferIndex++) {
      const buffer = bufferDefinitions[bufferIndex];
      if (buffer.chunk === undefined) {
        continue;
      }

      assert(gltf._glb.version === 3, 'glTF buffer.chunk requires a GLB v3 container.');
      assert(
        buffer.uri === undefined,
        `glTF buffer ${bufferIndex} cannot define both uri and chunk.`
      );
      const binChunk = binChunks.find(chunk => chunk.chunkIndex === buffer.chunk);
      assert(
        binChunk,
        `glTF buffer ${bufferIndex} references missing GLB BIN chunk ${buffer.chunk}.`
      );
      assert(
        buffer.byteLength <= binChunk.byteLength,
        `glTF buffer ${bufferIndex} is larger than GLB BIN chunk ${buffer.chunk}.`
      );
      gltf.buffers[bufferIndex] = {
        arrayBuffer: binChunk.arrayBuffer,
        byteOffset: binChunk.byteOffset,
        byteLength: buffer.byteLength
      };
    }

    const uriLessBufferIndices = bufferDefinitions
      .map((buffer, bufferIndex) => (buffer.uri === undefined ? bufferIndex : -1))
      .filter(bufferIndex => bufferIndex !== -1);
    const implicitBinChunk = binChunks.find(chunk => chunk.chunkIndex === 1);
    const usesLegacyImplicitBuffer =
      gltf._glb.version < 3 ||
      (gltf._glb.jsonChunkIndex === 0 &&
        bufferDefinitions[0]?.chunk === undefined &&
        uriLessBufferIndices.length === 1 &&
        uriLessBufferIndices[0] === 0 &&
        Boolean(implicitBinChunk));

    if (usesLegacyImplicitBuffer && (gltf._glb.version < 3 || bufferDefinitions[0])) {
      const binChunk = gltf._glb.version < 3 ? binChunks[0] : implicitBinChunk;
      assert(binChunk);
      gltf.buffers[0] = {
        arrayBuffer: binChunk.arrayBuffer,
        byteOffset: binChunk.byteOffset,
        byteLength: binChunk.byteLength
      };
    }

    if (gltf._glb.version === 3) {
      for (const bufferIndex of uriLessBufferIndices) {
        assert(
          gltf.buffers[bufferIndex],
          `glTF buffer ${bufferIndex} without a uri must define a valid GLB v3 chunk.`
        );
      }
    }

    // TODO - this modifies JSON and is a post processing thing
    // gltf.json.buffers[0].data = gltf.buffers[0].arrayBuffer;
    // gltf.json.buffers[0].byteOffset = gltf.buffers[0].byteOffset;
  }

  if (!gltf._glb) {
    const chunkBufferIndex = bufferDefinitions.findIndex(buffer => buffer.chunk !== undefined);
    assert(chunkBufferIndex === -1, `glTF buffer ${chunkBufferIndex} uses chunk outside a GLB.`);
  }

  // Populate images
  const images = gltf.json.images || [];
  gltf.images = new Array(images.length).fill({});

  const files = gltf.json.files || [];
  gltf.files = new Array(files.length).fill(null);

  const externalAssets = gltf.json.externalAssets || [];
  gltf.externalAssets = new Array(externalAssets.length).fill(null);
}

type ExternalAssetLoadState = {
  /** Parsed assets keyed by their resolved URI. */
  cache: Map<string, Promise<GLTFWithBuffers>>;
  /** Resolved URIs in the current recursion chain. */
  ancestors: Set<string>;
  /** Shared counter used to isolate virtual package URL namespaces. */
  packageIds: {next: number};
};

const PACKAGE_URL_PREFIX = 'gltf-package:';

/** Recursively resolve external assets instantiated by nodes. */
async function loadExternalAssets(
  gltf: GLTFWithBuffers,
  options: GLTFLoaderOptions,
  context: LoaderContext,
  inheritedState?: ExternalAssetLoadState
): Promise<void> {
  const externalAssets = gltf.json.externalAssets || [];
  const referencedIndices = new Set<number>();
  for (const node of gltf.json.nodes || []) {
    if (node.externalAsset !== undefined) {
      assert(
        node.externalAsset >= 0 && node.externalAsset < externalAssets.length,
        `glTF node references missing external asset ${node.externalAsset}.`
      );
      referencedIndices.add(node.externalAsset);
    }
  }

  const state =
    inheritedState ||
    createExternalAssetLoadState(context.url ? new Set([canonicalizeUrl(context.url)]) : new Set());
  for (const externalAssetIndex of referencedIndices) {
    await loadExternalAsset(gltf, externalAssetIndex, options, context, state);
  }
}

/** Parse one external asset and cache repeated file references. */
async function loadExternalAsset(
  gltf: GLTFWithBuffers,
  externalAssetIndex: number,
  options: GLTFLoaderOptions,
  context: LoaderContext,
  state: ExternalAssetLoadState
): Promise<void> {
  const externalAsset = gltf.json.externalAssets?.[externalAssetIndex];
  if (!externalAsset) {
    throw new Error(`Missing glTF external asset ${externalAssetIndex}.`);
  }
  assert(
    Number.isInteger(externalAsset.file) &&
      externalAsset.file >= 0 &&
      externalAsset.file < (gltf.json.files?.length || 0),
    `glTF external asset ${externalAssetIndex} references missing file ${externalAsset.file}.`
  );

  const file = await resolveGLTFFile(gltf, externalAsset.file, options, context);
  const assetKey = file.url;
  assert(
    !assetKey || !state.ancestors.has(assetKey),
    `glTF external asset cycle detected at ${assetKey}.`
  );

  let parsedAsset = assetKey ? state.cache.get(assetKey) : undefined;
  if (!parsedAsset) {
    const childContext = createExternalAssetContext(gltf, file, options, context, state);
    const childState: ExternalAssetLoadState = {
      ...state,
      ancestors: new Set(state.ancestors)
    };
    if (assetKey) {
      childState.ancestors.add(assetKey);
    }
    const data = sliceArrayBuffer(file.arrayBuffer, file.byteOffset, file.byteLength);
    parsedAsset = parseGLTFWithExternalAssets(
      {} as GLTFWithBuffers,
      data,
      0,
      options,
      childContext,
      childState
    );
    if (assetKey) {
      state.cache.set(assetKey, parsedAsset);
    }
  }

  gltf.externalAssets = gltf.externalAssets || [];
  gltf.externalAssets[externalAssetIndex] = await parsedAsset;
}

/** Create recursive loading state for an external-asset tree. */
function createExternalAssetLoadState(ancestors: Set<string>): ExternalAssetLoadState {
  return {cache: new Map(), ancestors, packageIds: {next: 0}};
}

/** Create URL and fetch semantics for a nested external asset. */
function createExternalAssetContext(
  parent: GLTFWithBuffers,
  file: GLTFExternalFile,
  options: GLTFLoaderOptions,
  context: LoaderContext,
  state: ExternalAssetLoadState
): LoaderContext {
  if (file.url && !file.url.startsWith('data:')) {
    return {
      ...context,
      url: file.url,
      filename: getUrlFilename(file.url),
      baseUrl: getUrlBase(file.url)
    };
  }

  const packageBaseUrl = `${PACKAGE_URL_PREFIX}${state.packageIds.next++}`;
  const packageUrlPrefix = `${packageBaseUrl}/`;
  return {
    ...context,
    url: file.name,
    filename: file.name,
    baseUrl: packageBaseUrl,
    fetch: async (resource: string, init?: RequestInit) => {
      const url = resource;
      if (url.startsWith('data:')) {
        return await context.fetch(resource, init);
      }
      const reference = url.startsWith(packageUrlPrefix) ? url.slice(packageUrlPrefix.length) : url;
      const fileIndex = findGLTFFileIndex(parent, reference);
      assert(fileIndex >= 0, `glTF package does not contain file ${reference}.`);
      const resolvedFile = await resolveGLTFFile(parent, fileIndex, options, context);
      const data = sliceArrayBuffer(
        resolvedFile.arrayBuffer,
        resolvedFile.byteOffset,
        resolvedFile.byteLength
      );
      return new Response(data, {headers: {'content-type': resolvedFile.mimeType}});
    }
  };
}

/** Return the containing directory for a URL. */
function getUrlBase(url: string): string {
  const slashIndex = url.lastIndexOf('/');
  return slashIndex >= 0 ? url.slice(0, slashIndex) : '';
}

/** Return the file name component for a URL. */
function getUrlFilename(url: string): string {
  const slashIndex = url.lastIndexOf('/');
  return slashIndex >= 0 ? url.slice(slashIndex + 1) : url;
}

/** Resolve all draft glTF 2.1 unified file references. */
async function loadFiles(
  gltf: GLTFWithBuffers,
  options: GLTFLoaderOptions,
  context: LoaderContext
): Promise<void> {
  const files = gltf.json.files || [];
  await Promise.all(
    files.map((_, fileIndex) => resolveGLTFFile(gltf, fileIndex, options, context))
  );
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

      const uri = resolveUrl(buffer.uri, options, context);
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

/** Return image indices referenced by textures or draft glTF 2.1 asset metadata. */
function getReferencesImageIndices(gltf: GLTFWithBuffers): number[] {
  const imageIndices = new Set<number>();

  if (gltf.json.asset.thumbnail !== undefined) {
    imageIndices.add(gltf.json.asset.thumbnail);
  }

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
    const uri = resolveUrl(image.uri, options, context);

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

  const gltfOptions = getGLTFImageOptions(options, image.mimeType);

  // Call `parse`
  let parsedImage = (await parseFromContext(
    arrayBuffer,
    [ImageBitmapLoader, BasisLoader],
    gltfOptions,
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
  // TODO making sure ImageBitmapLoader is overridable by using array of loaders
  // const parsedImage = await parse(arrayBuffer, [ImageBitmapLoader]);

  // Store the loaded image
  gltf.images = gltf.images || [];
  // @ts-expect-error TODO - sort out image typing asap
  gltf.images[index] = parsedImage;
}
