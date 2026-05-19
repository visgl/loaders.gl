// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {I3SSource, type TilesetSourceResolver} from '@loaders.gl/tiles';
import {BlobFile, HttpFile, path} from '@loaders.gl/loader-utils';
import type {
  CoreAPI,
  Loader,
  LoaderOptions,
  LoaderWithParser,
  ReadableFile
} from '@loaders.gl/loader-utils';
import {parseSLPKArchive} from './lib/parsers/parse-slpk/parse-slpk';

/** Constructor input for {@link SLPKSource}. */
export type SLPKSourceInput = {
  /** SLPK archive URL or Blob. */
  url: string | Blob;
  /** Parser used for I3S JSON and tile content stored inside the archive. */
  loader: Loader;
  /** Base path exposed to the underlying I3S source. */
  basePath?: string;
  /** Core API used to parse inner I3S resources. */
  coreApi?: CoreAPI;
};

/**
 * I3S source backed by an SLPK archive.
 *
 * This source implements the same {@link I3SSource} runtime contract, so `Tileset3D` can traverse
 * archive-backed and URL-backed I3S datasets interchangeably.
 */
export class SLPKSource extends I3SSource {
  /**
   * Creates an I3S source that reads resources from an SLPK archive.
   * @param input Archive source input
   * @param loadOptions Loader options forwarded to inner resource parsing
   */
  constructor(input: SLPKSourceInput, loadOptions: LoaderOptions = {}) {
    const sourceUrl = getArchiveSourceUrl(input.url, 'tileset.slpk');
    let source: SLPKSource | undefined;
    const getCoreApi = () => source?.coreApi || input.coreApi;
    const resolver = createSLPKResolver(input.url, sourceUrl, getCoreApi);

    super(
      {
        url: sourceUrl,
        loader: input.loader as LoaderWithParser,
        basePath: input.basePath || sourceUrl,
        resolver,
        coreApi: input.coreApi
      },
      loadOptions
    );
    source = this;
  }
}

function createSLPKResolver(
  data: string | Blob,
  sourceUrl: string,
  getCoreApi: () => CoreAPI | undefined
): TilesetSourceResolver {
  let archivePromise: Promise<Awaited<ReturnType<typeof parseSLPKArchive>>> | undefined;

  async function loadFile(pathInArchive: string): Promise<ArrayBuffer> {
    archivePromise ||= openArchiveReadableFile(data, getCoreApi()).then(file =>
      parseSLPKArchive(file)
    );
    const archive = await archivePromise;
    return await archive.getFile(pathInArchive, 'http');
  }

  return {
    async loadRoot<DataT>(
      _url: string,
      loader: LoaderWithParser<DataT>,
      loadOptions: LoaderOptions
    ): Promise<DataT> {
      return await parseArchiveResource(
        loadFile,
        sourceUrl,
        '',
        sourceUrl,
        loader,
        loadOptions,
        getCoreApi()
      );
    },

    async loadResource<DataT>(
      url: string,
      loader: LoaderWithParser<DataT>,
      loadOptions: LoaderOptions
    ): Promise<DataT> {
      const pathInArchive = resolveArchivePath(url, url, sourceUrl);
      return await parseArchiveResource(
        loadFile,
        url,
        pathInArchive,
        sourceUrl,
        loader,
        loadOptions,
        getCoreApi()
      );
    }
  };
}

async function parseArchiveResource<DataT>(
  loadFile: (pathInArchive: string) => Promise<ArrayBuffer>,
  resourceUrl: string,
  pathInArchive: string,
  sourceUrl: string,
  loader: LoaderWithParser<DataT>,
  loadOptions: LoaderOptions,
  coreApi?: CoreAPI
): Promise<DataT> {
  if (!coreApi) {
    throw new Error('SLPKSource requires an injected coreApi to parse archive resources');
  }

  const data = await loadFile(pathInArchive);
  const archiveFetch = createArchiveFetch(loadFile, resourceUrl, sourceUrl);
  return (await coreApi.parse(
    data,
    loader,
    {
      ...loadOptions,
      fetch: archiveFetch
    },
    {
      url: resourceUrl,
      fetch: archiveFetch,
      _parse: coreApi.parse,
      loaders: [loader],
      coreApi
    } as any
  )) as DataT;
}

function createArchiveFetch(
  loadFile: (pathInArchive: string) => Promise<ArrayBuffer>,
  contextUrl: string,
  sourceUrl: string
): typeof fetch {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const requestUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const pathInArchive = resolveArchivePath(requestUrl, contextUrl, sourceUrl);
    const data = await loadFile(pathInArchive);
    return new Response(data, {status: 200});
  };
}

async function openArchiveReadableFile(
  data: string | Blob,
  coreApi?: CoreAPI
): Promise<ReadableFile> {
  if (typeof data !== 'string') {
    return new BlobFile(data);
  }

  if (/^https?:\/\//i.test(data)) {
    return new HttpFile(data);
  }

  if (!coreApi) {
    throw new Error('SLPKSource requires an injected coreApi to load local archives');
  }
  const response = await coreApi.fetchFile(data);
  return new BlobFile(await response.arrayBuffer());
}

function getArchiveSourceUrl(data: string | Blob, fallbackFilename: string): string {
  if (typeof data === 'string') {
    return data;
  }

  const fileName =
    'name' in data && typeof data.name === 'string' && data.name ? data.name : fallbackFilename;
  return `memory://${fileName}`;
}

function stripQueryString(url: string): string {
  const queryIndex = url.indexOf('?');
  return queryIndex >= 0 ? url.slice(0, queryIndex) : url;
}

function resolveArchivePath(request: string, baseUrl: string, archiveUrl: string): string {
  const requestWithoutQuery = stripQueryString(request);
  const archiveRoot = stripQueryString(archiveUrl);
  const basePath = path.dirname(stripQueryString(baseUrl));
  const markerMatch = requestWithoutQuery.match(/\.slpk\/(.*)$/i);
  if (markerMatch?.[1]) {
    return markerMatch[1];
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
