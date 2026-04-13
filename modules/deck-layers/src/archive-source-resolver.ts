// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {BlobFile, HttpFile, path} from '@loaders.gl/loader-utils';
import type {LoaderOptions, LoaderWithParser, ReadableFile} from '@loaders.gl/loader-utils';
import type {TilesetSourceResolver} from '@loaders.gl/tiles';

type ArchiveSourceData = string | Blob;
type ArchiveFileMode = 'http' | 'raw';

type ArchiveAccessor = {
  sourceUrl: string;
  loadFile(pathInArchive: string, mode?: ArchiveFileMode): Promise<ArrayBuffer>;
};

/**
 * Creates a resolver that reuses the existing `.3tz` archive parser for `Tiles3DSource`.
 * @param data Archive URL or blob.
 * @returns Resolver and runtime loader for the standard 3D Tiles source.
 */
export function createTiles3DArchiveResolver(data: ArchiveSourceData): {
  loader: LoaderWithParser;
  resolver: TilesetSourceResolver;
} {
  const sourceUrl = getArchiveSourceUrl(data, 'tileset.3tz');
  let archivePromise: Promise<any> | undefined;

  const accessor: ArchiveAccessor = {
    sourceUrl,
    async loadFile(pathInArchive: string): Promise<ArrayBuffer> {
      archivePromise ||= openArchiveReadableFile(data).then(async file => {
        const {parse3DTilesArchive} = await load3DTilesModule();
        return await parse3DTilesArchive(file);
      });
      const archive = await archivePromise;
      return await archive.getFile(pathInArchive);
    }
  };

  return {
    loader: TILES_3D_RUNTIME_LOADER,
    resolver: createArchiveResolver(accessor, 'tileset.json', 'raw')
  };
}

/**
 * Creates a resolver that reuses the existing `.slpk` archive parser for `I3SSource`.
 * @param data Archive URL or blob.
 * @returns Resolver and runtime loader for the standard I3S source.
 */
export function createSLPKArchiveResolver(data: ArchiveSourceData): {
  loader: LoaderWithParser;
  resolver: TilesetSourceResolver;
} {
  const sourceUrl = getArchiveSourceUrl(data, 'tileset.slpk');
  let archivePromise: Promise<any> | undefined;

  const accessor: ArchiveAccessor = {
    sourceUrl,
    async loadFile(pathInArchive: string, mode: ArchiveFileMode = 'http'): Promise<ArrayBuffer> {
      archivePromise ||= openArchiveReadableFile(data).then(async file => {
        const {parseSLPKArchive} = await loadI3SModule();
        return await parseSLPKArchive(file);
      });
      const archive = await archivePromise;
      return await archive.getFile(pathInArchive, mode);
    }
  };

  return {
    loader: I3S_RUNTIME_LOADER,
    resolver: createArchiveResolver(accessor, '', 'http')
  };
}

const TILES_3D_RUNTIME_LOADER: LoaderWithParser = {
  id: '3d-tiles',
  name: '3D Tiles',
  module: '3d-tiles',
  version: 'latest',
  extensions: ['json'],
  mimeTypes: ['application/json'],
  options: {},
  parse: async (arrayBuffer, options, context) => {
    const {Tiles3DLoader} = await load3DTilesModule();
    return await Tiles3DLoader.parse(arrayBuffer, options, context);
  }
};

const I3S_RUNTIME_LOADER: LoaderWithParser = {
  id: 'i3s',
  name: 'I3S',
  module: 'i3s',
  version: 'latest',
  extensions: ['json'],
  mimeTypes: ['application/json'],
  options: {},
  parse: async (arrayBuffer, options, context) => {
    const {I3SLoader} = await loadI3SModule();
    return await I3SLoader.parse(arrayBuffer, options, context);
  }
};

function createArchiveResolver(
  accessor: ArchiveAccessor,
  rootPath: string,
  rootMode: ArchiveFileMode
): TilesetSourceResolver {
  const rootUrl = rootPath ? `${accessor.sourceUrl}/${rootPath}` : accessor.sourceUrl;

  return {
    loadRoot<DataT>(
      _url: string,
      loader: LoaderWithParser<DataT>,
      loadOptions: LoaderOptions
    ): Promise<DataT> {
      return parseArchiveResource(accessor, rootUrl, rootPath, rootMode, loader, loadOptions);
    },

    loadResource<DataT>(
      url: string,
      loader: LoaderWithParser<DataT>,
      loadOptions: LoaderOptions
    ): Promise<DataT> {
      const pathInArchive = resolveArchivePath(url, url, accessor.sourceUrl);
      return parseArchiveResource(accessor, url, pathInArchive, 'http', loader, loadOptions);
    }
  };
}

async function parseArchiveResource<DataT>(
  accessor: ArchiveAccessor,
  resourceUrl: string,
  pathInArchive: string,
  mode: ArchiveFileMode,
  loader: LoaderWithParser<DataT>,
  loadOptions: LoaderOptions
): Promise<DataT> {
  const data = await accessor.loadFile(pathInArchive, mode);
  const archiveFetch = createArchiveFetch(accessor, resourceUrl);

  return await parse(
    data,
    loader,
    {
      ...loadOptions,
      fetch: archiveFetch
    },
    {
      url: resourceUrl,
      fetch: archiveFetch,
      _parse: parse,
      loaders: [loader]
    } as any
  );
}

function createArchiveFetch(accessor: ArchiveAccessor, contextUrl: string): typeof fetch {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const requestUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const pathInArchive = resolveArchivePath(requestUrl, contextUrl, accessor.sourceUrl);
    const data = await accessor.loadFile(pathInArchive, 'http');
    return new Response(data, {status: 200});
  };
}

async function openArchiveReadableFile(data: ArchiveSourceData): Promise<ReadableFile> {
  if (typeof data !== 'string') {
    return new BlobFile(data);
  }

  if (/^https?:\/\//i.test(data)) {
    return new HttpFile(data);
  }

  const response = await fetchFile(data);
  return new BlobFile(await response.arrayBuffer());
}

function getArchiveSourceUrl(data: ArchiveSourceData, fallbackFilename: string): string {
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

async function load3DTilesModule(): Promise<any> {
  const moduleName = '@loaders.gl/3d-tiles';
  return await import(moduleName);
}

async function loadI3SModule(): Promise<any> {
  const moduleName = '@loaders.gl/i3s';
  return await import(moduleName);
}
