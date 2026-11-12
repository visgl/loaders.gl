// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderOptions, Loader, DataType} from '@loaders.gl/core/loader-utils';
import {
  compareArrayBuffers,
  path,
  log,
  isBlob,
  ensureArrayBuffer,
  isArrayBufferLike,
  isSourceLoader
} from '@loaders.gl/core/loader-utils';
import {TypedArray} from '@loaders.gl/core/schema';
import {normalizeLoader} from '../loader-utils/normalize-loader';
import {normalizeLoaderOptions} from '../loader-utils/option-utils';
import {getResourceUrl, getResourceMIMEType} from '../utils/resource-utils';
import {compareMIMETypes} from '../utils/mime-type-utils';
import {getRegisteredLoaders} from './register-loaders';
import {stripQueryString} from '../utils/url-utils';

const EXT_PATTERN = /\.([^.]+)$/;

// TODO - Need a variant that peeks at streams for parseInBatches
// TODO - Detect multiple matching loaders? Use heuristics to grade matches?
// TODO - Allow apps to pass context to disambiguate between multiple matches (e.g. multiple .json formats)?

/**
 * Find a loader that matches file extension and/or initial file content
 * Search the loaders array argument for a loader that matches url extension or initial data
 * Returns: a normalized loader
 * @param data data to assist
 * @param loaders
 * @param options
 * @param context used internally, applications should not provide this parameter
 * @param operation selects the URL matching priority for parsing or source creation
 */
export async function selectLoader(
  data: DataType,
  loaders: Loader[] | Loader = [],
  options?: LoaderOptions,
  context?: LoaderContext,
  operation: 'parse' | 'source' = 'parse'
): Promise<Loader | null> {
  if (!validHTTPResponse(data)) {
    return null;
  }

  const normalizedOptions = normalizeLoaderOptions(options || {});
  normalizedOptions.core ||= {};

  if (loaders && !Array.isArray(loaders)) {
    return normalizeLoader(loaders);
  }

  const text = data instanceof Response && mayContainText(data) ? await data.clone().text() : null;
  let initialBytes: ArrayBuffer | undefined;

  async function matchCandidates(candidates: Loader[]): Promise<Loader | null> {
    normalizeLoaders(candidates);
    const loader =
      (text !== null &&
        selectLoaderInternal(text, candidates, normalizedOptions, context, operation)) ||
      selectLoaderInternal(data, candidates, normalizedOptions, context, operation);
    if (!loader && isBlob(data) && candidates.length) {
      initialBytes ??= await data.slice(0, 10).arrayBuffer();
      return selectLoaderInternal(initialBytes, candidates, normalizedOptions, context, operation);
    }
    return loader;
  }

  let loader = await matchCandidates(loaders || []);
  if (!loader && !normalizedOptions.core.ignoreRegisteredLoaders) {
    loader = await matchCandidates(getRegisteredLoaders());
  }

  // no loader available
  if (!loader && !normalizedOptions.core.nothrow) {
    throw new Error(getNoValidLoaderMessage(data));
  }

  return loader;
}

function mayContainText(response: Response): boolean {
  const mimeType = getResourceMIMEType(response);
  return Boolean(
    mimeType &&
      (mimeType.startsWith('text/') ||
        mimeType === 'application/json' ||
        mimeType.endsWith('+json'))
  );
}

/**
 * Find a loader that matches file extension and/or initial file content
 * Search the loaders array argument for a loader that matches url extension or initial data
 * Returns: a normalized loader
 * @param data data to assist
 * @param loaders
 * @param options
 * @param context used internally, applications should not provide this parameter
 * @param operation selects the URL matching priority for parsing or source creation
 */
export function selectLoaderSync(
  data: DataType,
  loaders: Loader[] | Loader = [],
  options?: LoaderOptions,
  context?: LoaderContext,
  operation: 'parse' | 'source' = 'parse'
): Loader | null {
  if (!validHTTPResponse(data)) {
    return null;
  }

  const normalizedOptions = normalizeLoaderOptions(options || {});
  normalizedOptions.core ||= {};

  // eslint-disable-next-line complexity
  // if only a single loader was provided (not as array), force its use
  // TODO - Should this behavior be kept and documented?
  if (loaders && !Array.isArray(loaders)) {
    // TODO - remove support for legacy loaders
    return normalizeLoader(loaders);
  }

  const candidates = loaders || [];
  normalizeLoaders(candidates);
  let loader = selectLoaderInternal(data, candidates, normalizedOptions, context, operation);
  if (!loader && !normalizedOptions.core.ignoreRegisteredLoaders) {
    loader = selectLoaderInternal(
      data,
      getRegisteredLoaders(),
      normalizedOptions,
      context,
      operation
    );
  }

  // no loader available
  if (!loader && !normalizedOptions.core.nothrow) {
    throw new Error(getNoValidLoaderMessage(data));
  }

  return loader;
}

/** Implements loaders selection logic */
// eslint-disable-next-line complexity
function selectLoaderInternal(
  data: DataType,
  loaders: Loader[],
  options?: LoaderOptions,
  context?: LoaderContext,
  operation: 'parse' | 'source' = 'parse'
) {
  const url = getResourceUrl(data);
  const type = getResourceMIMEType(data);

  const testUrl = stripQueryString(url) || context?.url;

  let loader: Loader | null = null;
  let reason: string = '';

  // if options.mimeType is supplied, it takes precedence
  const sourceType =
    options?.core && 'type' in options.core ? (options.core.type as string | undefined) : undefined;
  if (sourceType && sourceType !== 'auto') {
    loader = findSourceLoaderByType(loaders, sourceType);
    reason = loader ? `match forced by supplied source type ${sourceType}` : '';
  }

  // if options.mimeType is supplied, it takes precedence
  if (options?.core?.mimeType) {
    loader = findLoaderByMIMEType(loaders, options?.core?.mimeType);
    reason = `match forced by supplied MIME type ${options?.core?.mimeType}`;
  }

  // Source URL rules take priority only when opening a data source.
  if (!loader && operation === 'source') {
    loader = findSourceLoaderByTestURL(loaders, testUrl);
    reason = loader ? `matched source url ${testUrl}` : '';
  }

  loader = loader || findLoaderByUrl(loaders, testUrl);
  reason = reason || (loader ? `matched url ${testUrl}` : '');

  loader = loader || findSourceLoaderByTestURL(loaders, testUrl);
  reason = reason || (loader ? `matched source url ${testUrl}` : '');

  // Look up loader by mime type
  loader = loader || findLoaderByMIMEType(loaders, type);
  reason = reason || (loader ? `matched MIME type ${type}` : '');

  // Look for loader via initial bytes (Note: not always accessible (e.g. Response, stream, async iterator)
  // @ts-ignore Blob | Response
  loader = loader || findLoaderByInitialBytes(loaders, data);
  // @ts-ignore Blob | Response
  reason = reason || (loader ? `matched initial data ${getFirstCharacters(data)}` : '');

  if (!loader && isBlob(data)) {
    loader = findSourceLoaderByTestData(loaders, data);
    reason = reason || (loader ? 'matched source testData' : '');
  }

  // Look up loader by fallback mime type
  if (options?.core?.fallbackMimeType) {
    loader = loader || findLoaderByMIMEType(loaders, options?.core?.fallbackMimeType);
    reason = reason || (loader ? `matched fallback MIME type ${type}` : '');
  }

  if (reason) {
    log.log(1, `selectLoader selected ${loader?.name}: ${reason}.`);
  }

  return loader;
}

/** Check HTTP Response */
function validHTTPResponse(data: unknown): boolean {
  // HANDLE HTTP status
  if (data instanceof Response) {
    // 204 - NO CONTENT. This handles cases where e.g. a tile server responds with 204 for a missing tile
    if (data.status === 204) {
      return false;
    }
  }
  return true;
}

/** Generate a helpful message to help explain why loader selection failed. */
function getNoValidLoaderMessage(data: DataType): string {
  const url = getResourceUrl(data);
  const type = getResourceMIMEType(data);

  let message = 'No valid loader found (';
  message += url ? `${path.filename(url)}, ` : 'no url provided, ';
  message += `MIME type: ${type ? `"${type}"` : 'not provided'}, `;
  // First characters are only accessible when called on data (string or arrayBuffer).
  // @ts-ignore Blob | Response
  const firstCharacters: string = data ? getFirstCharacters(data) : '';
  message += firstCharacters ? ` first bytes: "${firstCharacters}"` : 'first bytes: not available';
  message += ')';
  return message;
}

function normalizeLoaders(loaders: Loader[]): void {
  for (const loader of loaders) {
    normalizeLoader(loader);
  }
}

// TODO - Would be nice to support http://example.com/file.glb?parameter=1
// E.g: x = new URL('http://example.com/file.glb?load=1'; x.pathname
function findLoaderByUrl(loaders: Loader[], url?: string): Loader | null {
  // Get extension
  const match = url && EXT_PATTERN.exec(url);
  const extension = match && match[1];
  return extension ? findLoaderByExtension(loaders, extension) : null;
}

function findLoaderByExtension(loaders: Loader[], extension: string): Loader | null {
  extension = extension.toLowerCase();

  for (const loader of loaders) {
    for (const loaderExtension of loader.extensions) {
      if (loaderExtension.toLowerCase() === extension) {
        return loader;
      }
    }
  }
  return null;
}

function findSourceLoaderByType(loaders: Loader[], type: string): Loader | null {
  for (const loader of loaders) {
    if (isSourceLoader(loader) && loader.type === type) {
      return loader;
    }
  }
  return null;
}

function findSourceLoaderByTestURL(loaders: Loader[], url?: string): Loader | null {
  if (!url) {
    return null;
  }

  for (const loader of loaders) {
    if (isSourceLoader(loader) && loader.testURL(url)) {
      return loader;
    }
  }
  return null;
}

function findSourceLoaderByTestData(loaders: Loader[], data: Blob): Loader | null {
  for (const loader of loaders) {
    if (isSourceLoader(loader)) {
      if (loader.testData?.(data)) {
        return loader;
      }
    }
  }
  return null;
}

function findLoaderByMIMEType(loaders: Loader[], mimeType: string): Loader | null {
  for (const loader of loaders) {
    if (loader.mimeTypes?.some(mimeType1 => compareMIMETypes(mimeType, mimeType1))) {
      return loader;
    }

    // Support referring to loaders using the "unregistered tree"
    // https://en.wikipedia.org/wiki/Media_type#Unregistered_tree
    if (compareMIMETypes(mimeType, `application/x.${loader.id}`)) {
      return loader;
    }
  }
  return null;
}

function findLoaderByInitialBytes(loaders: Loader[], data: string | ArrayBuffer): Loader | null {
  if (!data) {
    return null;
  }

  for (const loader of loaders) {
    if (typeof data === 'string') {
      if (testDataAgainstText(data, loader)) {
        return loader;
      }
    } else if (ArrayBuffer.isView(data)) {
      // Typed Arrays can have offsets into underlying buffer
      if (testDataAgainstBinary(data.buffer, data.byteOffset, loader)) {
        return loader;
      }
    } else if (data instanceof ArrayBuffer) {
      const byteOffset = 0;
      if (testDataAgainstBinary(data, byteOffset, loader)) {
        return loader;
      }
    }
    // TODO Handle streaming case (requires creating a new AsyncIterator)
  }
  return null;
}

function testDataAgainstText(data: string, loader: Loader): boolean {
  if (loader.testText) {
    return loader.testText(data);
  }

  const tests = Array.isArray(loader.tests) ? loader.tests : [loader.tests];
  return tests.some(test => data.startsWith(test as string));
}

function testDataAgainstBinary(data: ArrayBufferLike, byteOffset: number, loader: Loader): boolean {
  const tests = Array.isArray(loader.tests) ? loader.tests : [loader.tests];
  return tests.some(test => testBinary(data, byteOffset, loader, test));
}

function testBinary(
  data: ArrayBufferLike,
  byteOffset: number,
  loader: Loader,
  test?: ArrayBuffer | string | ((b: ArrayBuffer) => boolean)
): boolean {
  if (isArrayBufferLike(test)) {
    return compareArrayBuffers(test, data, test.byteLength);
  }
  switch (typeof test) {
    case 'function':
      return test(ensureArrayBuffer(data));

    case 'string':
      // Magic bytes check: If `test` is a string, check if binary data starts with that strings
      const magic = getMagicString(data, byteOffset, test.length);
      return test === magic;

    default:
      return false;
  }
}

function getFirstCharacters(data: string | ArrayBuffer | TypedArray, length: number = 5) {
  if (typeof data === 'string') {
    return data.slice(0, length);
  } else if (ArrayBuffer.isView(data)) {
    // Typed Arrays can have offsets into underlying buffer
    return getMagicString(data.buffer, data.byteOffset, length);
  } else if (data instanceof ArrayBuffer) {
    const byteOffset = 0;
    return getMagicString(data, byteOffset, length);
  }
  return '';
}

function getMagicString(arrayBuffer: ArrayBufferLike, byteOffset: number, length: number): string {
  if (arrayBuffer.byteLength < byteOffset + length) {
    return '';
  }
  const dataView = new DataView(arrayBuffer);
  let magic = '';
  for (let i = 0; i < length; i++) {
    magic += String.fromCharCode(dataView.getUint8(byteOffset + i));
  }
  return magic;
}
