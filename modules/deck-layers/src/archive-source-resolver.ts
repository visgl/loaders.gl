// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {GZipDecompressor} from '@loaders.gl/compression';
import {BlobFile, HttpFile, path} from '@loaders.gl/loader-utils';
import type {Loader, LoaderOptions, LoaderWithParser, ReadableFile} from '@loaders.gl/loader-utils';
import type {TilesetSourceResolver} from '@loaders.gl/tiles-3d';
import {IndexedArchive, type ZipArchiveOptions} from '@loaders.gl/zip';

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
  loader: Loader;
  resolver: TilesetSourceResolver;
};
export function createTiles3DArchiveResolver(
  data: ArchiveSourceData,
  parserLoader: Loader,
  archiveOptions?: ZipArchiveOptions
): {
  loader: Loader;
  resolver: TilesetSourceResolver;
};
export function createTiles3DArchiveResolver(
  data: ArchiveSourceData,
  parserLoader: Loader = TILES_3D_RUNTIME_LOADER,
  archiveOptions: ZipArchiveOptions = {}
): {
  loader: Loader;
  resolver: TilesetSourceResolver;
} {
  const sourceUrl = getArchiveSourceUrl(data, 'tileset.3tz');
  let archivePromise: Promise<any> | undefined;

  const accessor: ArchiveAccessor = {
    sourceUrl,
    async loadFile(pathInArchive: string): Promise<ArrayBuffer> {
      archivePromise ||= openArchiveReadableFile(data).then(file =>
        parse3DTilesArchive(file, archiveOptions)
      );
      const archive = await archivePromise;
      return await archive.getFile(pathInArchive);
    }
  };

  return {
    loader: parserLoader,
    resolver: createArchiveResolver(accessor, 'tileset.json', 'raw')
  };
}

/**
 * Creates a resolver that reuses the existing `.slpk` archive parser for `I3SSource`.
 * @param data Archive URL or blob.
 * @returns Resolver and runtime loader for the standard I3S source.
 */
export function createSLPKArchiveResolver(data: ArchiveSourceData): {
  loader: Loader;
  resolver: TilesetSourceResolver;
};
export function createSLPKArchiveResolver(
  data: ArchiveSourceData,
  parserLoader: Loader,
  archiveOptions?: ZipArchiveOptions
): {
  loader: Loader;
  resolver: TilesetSourceResolver;
};
export function createSLPKArchiveResolver(
  data: ArchiveSourceData,
  parserLoader: Loader = I3S_RUNTIME_LOADER,
  archiveOptions: ZipArchiveOptions = {}
): {
  loader: Loader;
  resolver: TilesetSourceResolver;
} {
  const sourceUrl = getArchiveSourceUrl(data, 'tileset.slpk');
  let archivePromise: Promise<any> | undefined;

  const accessor: ArchiveAccessor = {
    sourceUrl,
    async loadFile(pathInArchive: string, mode: ArchiveFileMode = 'http'): Promise<ArrayBuffer> {
      archivePromise ||= openArchiveReadableFile(data).then(file =>
        parseSLPKArchive(file, archiveOptions)
      );
      const archive = await archivePromise;
      return await archive.getFile(pathInArchive, mode);
    }
  };

  return {
    loader: parserLoader,
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
  parse: async () => {
    throw new Error('Tiles3D archive URLs require a 3D Tiles loader');
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
  parse: async () => {
    throw new Error('SLPK archive URLs require an I3S loader');
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
      loader: Loader<DataT>,
      loadOptions: LoaderOptions
    ): Promise<DataT> {
      return parseArchiveResource(accessor, rootUrl, rootPath, rootMode, loader, loadOptions);
    },

    loadResource<DataT>(
      url: string,
      loader: Loader<DataT>,
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
  loader: Loader<DataT>,
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

/** Opens the 3TZ index through the shared container reader. */
async function parse3DTilesArchive(
  file: ReadableFile,
  options: ZipArchiveOptions
): Promise<Tiles3DArchiveAccessor> {
  const archive = new Tiles3DArchiveAccessor(file, undefined, undefined, options);
  try {
    await archive.initializeIndex('@3dtilesIndex1@');
    return archive;
  } catch (error) {
    await archive.close();
    throw error;
  }
}

/** Opens the SLPK index while preserving lowercase fallback hashes. */
async function parseSLPKArchive(
  file: ReadableFile,
  options: ZipArchiveOptions
): Promise<SLPKArchiveAccessor> {
  const archive = new SLPKArchiveAccessor(file, undefined, undefined, options);
  try {
    await archive.initializeIndex('@specialIndexFileHASH128@', true);
    return archive;
  } catch (error) {
    await archive.close();
    throw error;
  }
}

/** Format resource aliases layered over the shared ZIP entry transport. */
class Tiles3DArchiveAccessor extends IndexedArchive {
  /** Reads and decodes one format resource. */
  async getFile(pathInArchive: string): Promise<ArrayBuffer> {
    let data = await this.getFileBytes(pathInArchive.toLowerCase());
    if (!data) {
      data = await this.getFileBytes(pathInArchive);
    }
    if (!data) {
      throw new Error(`No such file in the archive: ${pathInArchive}`);
    }

    return data;
  }

  /** Verifies the indexed ZIP entry using the common container implementation. */
  private async getFileBytes(path: string): Promise<ArrayBuffer | null> {
    return (await this.readZipEntry(path)) ?? null;
  }
}

const SLPK_PATH_DESCRIPTIONS: {test: RegExp; extensions: string[]}[] = [
  {test: /^$/, extensions: ['3dSceneLayer.json.gz']},
  {test: /nodepages\/\d+$/, extensions: ['.json.gz']},
  {test: /sublayers\/\d+$/, extensions: ['/3dSceneLayer.json.gz']},
  {test: /nodes\/(\d+|root)$/, extensions: ['/3dNodeIndexDocument.json.gz']},
  {test: /nodes\/\d+\/textures\/.+$/, extensions: ['.jpg', '.png', '.bin.dds.gz', '.ktx', '.ktx2']},
  {test: /nodes\/\d+\/geometries\/\d+$/, extensions: ['.bin.gz', '.draco.gz']},
  {test: /nodes\/\d+\/attributes\/f_\d+\/\d+$/, extensions: ['.bin.gz']},
  {test: /statistics\/(f_\d+\/\d+|summary)$/, extensions: ['.json.gz']},
  {test: /nodes\/\d+\/shared$/, extensions: ['/sharedResource.json.gz']}
];

/** Format resource aliases layered over the shared ZIP entry transport. */
class SLPKArchiveAccessor extends IndexedArchive {
  /** Reads and decodes one format resource. */
  async getFile(pathInArchive: string, mode: ArchiveFileMode = 'raw'): Promise<ArrayBuffer> {
    if (mode === 'http') {
      const extensions = SLPK_PATH_DESCRIPTIONS.find(item =>
        item.test.test(pathInArchive)
      )?.extensions;
      if (extensions) {
        for (const extension of extensions) {
          const data = await this.getDataByPath(`${pathInArchive}${extension}`);
          if (data) {
            return data;
          }
        }
      }
    }

    if (mode === 'raw') {
      const compressedData = await this.getDataByPath(`${pathInArchive}.gz`);
      if (compressedData) {
        return compressedData;
      }
      const uncompressedData = await this.getFileBytes(pathInArchive);
      if (uncompressedData) {
        return uncompressedData;
      }
    }

    throw new Error(`No such file in the archive: ${pathInArchive}`);
  }

  private async getDataByPath(pathInArchive: string): Promise<ArrayBuffer | undefined> {
    let data = await this.getFileBytes(pathInArchive.toLowerCase());
    if (!data) {
      data = await this.getFileBytes(pathInArchive);
    }
    if (!data) {
      return undefined;
    }
    if (/\.gz$/.test(pathInArchive)) {
      return await new GZipDecompressor().decompress(data);
    }
    return data;
  }

  /** Leaves content-level gzip decoding to this format adapter. */
  private async getFileBytes(path: string): Promise<ArrayBuffer | undefined> {
    return await this.readZipEntry(path);
  }
}
