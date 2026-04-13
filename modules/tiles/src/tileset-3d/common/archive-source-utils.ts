// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {BlobFile, HttpFile, path} from '@loaders.gl/loader-utils';
import type {LoaderOptions, LoaderWithParser, ReadableFile} from '@loaders.gl/loader-utils';

/**
 * Input accepted by archive-backed tileset sources.
 */
export type ArchiveSourceData = string | Blob;

/**
 * Minimal shared state required by archive-backed fetch handlers.
 */
export type ArchiveFetchState = {
  url: string;
  getArchiveFile(archivePath: string): Promise<ArrayBuffer>;
};

/**
 * Opens a random-access readable file for an archive URL or blob.
 * @param data Archive input.
 * @returns Readable file wrapper.
 */
export async function openArchiveReadableFile(data: ArchiveSourceData): Promise<ReadableFile> {
  if (typeof data !== 'string') {
    return new BlobFile(data);
  }

  if (/^https?:\/\//i.test(data)) {
    return new HttpFile(data);
  }

  const response = await fetchFile(data);
  const arrayBuffer = await response.arrayBuffer();
  return new BlobFile(arrayBuffer);
}

/**
 * Creates a stable virtual URL for blob-backed archive sources.
 * @param data Archive input.
 * @param fallbackFilename File name to use when the blob does not expose one.
 * @returns URL-like string used in loader contexts.
 */
export function getArchiveSourceUrl(data: ArchiveSourceData, fallbackFilename: string): string {
  if (typeof data === 'string') {
    return data;
  }

  const fileName =
    'name' in data && typeof data.name === 'string' && data.name ? data.name : fallbackFilename;
  return `memory://${fileName}`;
}

/**
 * Removes any query string component from a source path.
 * @param url Input path.
 * @returns Path without query parameters.
 */
export function stripQueryString(url: string): string {
  const queryIndex = url.indexOf('?');
  return queryIndex >= 0 ? url.slice(0, queryIndex) : url;
}

/**
 * Resolves a fetch request against an archive-backed virtual root.
 * @param request Request URL.
 * @param baseUrl Virtual URL of the current parsed resource.
 * @param archiveUrl Archive root URL prefix.
 * @returns Normalized path inside the archive.
 */
export function resolveArchivePath(request: string, baseUrl: string, archiveUrl: string): string {
  const requestWithoutQuery = stripQueryString(request);
  const archiveRoot = stripQueryString(archiveUrl);
  const basePath = path.dirname(stripQueryString(baseUrl));
  const markerMatch = requestWithoutQuery.match(/\.(3tz|slpk)\/(.*)$/i);
  if (markerMatch?.[2]) {
    return markerMatch[2];
  }

  const absoluteRequest = requestWithoutQuery.startsWith(archiveRoot)
    ? requestWithoutQuery
    : path.resolve(basePath, requestWithoutQuery);

  if (absoluteRequest === archiveRoot) {
    return '';
  }

  if (absoluteRequest.startsWith(`${archiveRoot}/`)) {
    return absoluteRequest.slice(archiveRoot.length + 1);
  }

  return absoluteRequest.replace(/^\/+/, '');
}

/**
 * Creates a fetch function that reads from a tileset archive instead of the network.
 * @param source Archive-backed source instance.
 * @param contextUrl Parsed resource URL that relative requests resolve against.
 * @returns Fetch-like function backed by the archive.
 */
export function createArchiveFetch(source: ArchiveFetchState, contextUrl: string): typeof fetch {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const requestUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const archivePath = resolveArchivePath(requestUrl, contextUrl, source.url);
    const data = await source.getArchiveFile(archivePath);
    return new Response(data, {status: 200});
  };
}

/**
 * Parses an archive file with a tileset loader using an archive-backed fetch context.
 * @param data Resource bytes extracted from the archive.
 * @param loader Loader used to parse the resource.
 * @param options Loader options.
 * @param source Archive-backed source instance.
 * @param contextUrl Virtual URL of the resource inside the archive.
 * @returns Parsed tileset or tile payload.
 */
export async function parseArchiveResource<DataT>(
  data: ArrayBuffer,
  loader: LoaderWithParser<DataT>,
  options: LoaderOptions,
  source: ArchiveFetchState,
  contextUrl: string
): Promise<DataT> {
  const archiveFetch = createArchiveFetch(source, contextUrl);
  return await parse(
    data,
    loader,
    {
      ...options,
      fetch: archiveFetch
    },
    {
      url: contextUrl,
      fetch: archiveFetch,
      _parse: parse,
      loaders: [loader]
    } as any
  );
}
