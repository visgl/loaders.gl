// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {DeflateCompression, GZipCompression, NoCompression} from '@loaders.gl/compression';
import {MD5Hash} from '@loaders.gl/crypto';
import {BlobFile, HttpFile, path} from '@loaders.gl/loader-utils';
import type {LoaderOptions, LoaderWithParser, ReadableFile} from '@loaders.gl/loader-utils';
import type {TilesetSourceResolver} from '@loaders.gl/tiles';
import {
  CD_HEADER_SIGNATURE,
  IndexedArchive,
  makeHashTableFromZipHeaders,
  parseHashTable,
  parseZipCDFileHeader,
  parseZipLocalFileHeader,
  readRange,
  searchFromTheEnd
} from '@loaders.gl/zip';

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
};
export function createTiles3DArchiveResolver(
  data: ArchiveSourceData,
  parserLoader: LoaderWithParser
): {
  loader: LoaderWithParser;
  resolver: TilesetSourceResolver;
};
export function createTiles3DArchiveResolver(
  data: ArchiveSourceData,
  parserLoader: LoaderWithParser = TILES_3D_RUNTIME_LOADER
): {
  loader: LoaderWithParser;
  resolver: TilesetSourceResolver;
} {
  const sourceUrl = getArchiveSourceUrl(data, 'tileset.3tz');
  let archivePromise: Promise<any> | undefined;

  const accessor: ArchiveAccessor = {
    sourceUrl,
    async loadFile(pathInArchive: string): Promise<ArrayBuffer> {
      archivePromise ||= openArchiveReadableFile(data).then(file => parse3DTilesArchive(file));
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
  loader: LoaderWithParser;
  resolver: TilesetSourceResolver;
};
export function createSLPKArchiveResolver(
  data: ArchiveSourceData,
  parserLoader: LoaderWithParser
): {
  loader: LoaderWithParser;
  resolver: TilesetSourceResolver;
};
export function createSLPKArchiveResolver(
  data: ArchiveSourceData,
  parserLoader: LoaderWithParser = I3S_RUNTIME_LOADER
): {
  loader: LoaderWithParser;
  resolver: TilesetSourceResolver;
} {
  const sourceUrl = getArchiveSourceUrl(data, 'tileset.slpk');
  let archivePromise: Promise<any> | undefined;

  const accessor: ArchiveAccessor = {
    sourceUrl,
    async loadFile(pathInArchive: string, mode: ArchiveFileMode = 'http'): Promise<ArrayBuffer> {
      archivePromise ||= openArchiveReadableFile(data).then(file => parseSLPKArchive(file));
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

async function parse3DTilesArchive(fileProvider: ReadableFile): Promise<Tiles3DArchiveAccessor> {
  const hashCDOffset = await searchFromTheEnd(fileProvider, CD_HEADER_SIGNATURE);
  const cdFileHeader = await parseZipCDFileHeader(hashCDOffset, fileProvider);

  let hashTable: Record<string, bigint>;
  if (cdFileHeader?.fileName !== '@3dtilesIndex1@') {
    hashTable = await makeHashTableFromZipHeaders(fileProvider);
  } else {
    const localFileHeader = await parseZipLocalFileHeader(
      cdFileHeader.localHeaderOffset,
      fileProvider
    );
    if (!localFileHeader) {
      throw new Error('corrupted 3tz zip archive');
    }

    const hashFile = await readRange(
      fileProvider,
      localFileHeader.fileDataOffset,
      localFileHeader.fileDataOffset + localFileHeader.compressedSize
    );
    hashTable = parseHashTable(hashFile);
  }

  return new Tiles3DArchiveAccessor(fileProvider, hashTable);
}

async function parseSLPKArchive(fileProvider: ReadableFile): Promise<SLPKArchiveAccessor> {
  const hashCDOffset = await searchFromTheEnd(fileProvider, CD_HEADER_SIGNATURE);
  const cdFileHeader = await parseZipCDFileHeader(hashCDOffset, fileProvider);

  let hashTable: Record<string, bigint>;
  if (cdFileHeader?.fileName !== '@specialIndexFileHASH128@') {
    hashTable = await makeHashTableFromZipHeaders(fileProvider);
  } else {
    const localFileHeader = await parseZipLocalFileHeader(
      cdFileHeader.localHeaderOffset,
      fileProvider
    );
    if (!localFileHeader) {
      throw new Error('corrupted SLPK');
    }

    const hashFile = await readRange(
      fileProvider,
      localFileHeader.fileDataOffset,
      localFileHeader.fileDataOffset + localFileHeader.compressedSize
    );
    hashTable = parseHashTable(hashFile);
  }

  return new SLPKArchiveAccessor(fileProvider, hashTable);
}

class Tiles3DArchiveAccessor extends IndexedArchive {
  private readonly hashTable?: Record<string, bigint>;

  constructor(fileProvider: ReadableFile, hashTable?: Record<string, bigint>) {
    super(fileProvider, hashTable);
    this.hashTable = hashTable;
  }

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

  private async getFileBytes(pathInArchive: string): Promise<ArrayBuffer | null> {
    if (this.hashTable) {
      const nameHash = await new MD5Hash().hash(
        new TextEncoder().encode(pathInArchive).buffer,
        'hex'
      );
      const byteOffset = this.hashTable[nameHash];
      if (byteOffset === undefined) {
        return null;
      }

      const localFileHeader = await parseZipLocalFileHeader(byteOffset, this.file);
      if (!localFileHeader) {
        return null;
      }

      const compressedFile = await readRange(
        this.file,
        localFileHeader.fileDataOffset,
        localFileHeader.fileDataOffset + localFileHeader.compressedSize
      );

      switch (localFileHeader.compressionMethod) {
        case 0:
          return await new NoCompression().decompress(compressedFile);
        case 8:
          return await new DeflateCompression({raw: true}).decompress(compressedFile);
        default:
          throw new Error('Only Deflation compression is supported');
      }
    }

    return await this.getFileWithoutHash(pathInArchive);
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

class SLPKArchiveAccessor extends IndexedArchive {
  private readonly hashTable?: Record<string, bigint>;
  private readonly textEncoder = new TextEncoder();
  private readonly md5Hash = new MD5Hash();

  constructor(fileProvider: ReadableFile, hashTable?: Record<string, bigint>) {
    super(fileProvider, hashTable);
    this.hashTable = hashTable;
  }

  async getFile(pathInArchive: string, mode: ArchiveFileMode = 'raw'): Promise<ArrayBuffer> {
    if (mode === 'http') {
      const extensions = SLPK_PATH_DESCRIPTIONS.find(item => item.test.test(pathInArchive))?.extensions;
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
      return await new GZipCompression().decompress(data);
    }
    return data;
  }

  private async getFileBytes(pathInArchive: string): Promise<ArrayBuffer | undefined> {
    if (this.hashTable) {
      const nameHash = await this.md5Hash.hash(this.textEncoder.encode(pathInArchive).buffer, 'hex');
      const offset = this.hashTable[nameHash];
      if (offset === undefined) {
        return undefined;
      }

      const localFileHeader = await parseZipLocalFileHeader(offset, this.file);
      if (!localFileHeader) {
        return undefined;
      }

      return await readRange(
        this.file,
        localFileHeader.fileDataOffset,
        localFileHeader.fileDataOffset + localFileHeader.compressedSize
      );
    }

    try {
      return await this.getFileWithoutHash(pathInArchive);
    } catch {
      return undefined;
    }
  }
}
