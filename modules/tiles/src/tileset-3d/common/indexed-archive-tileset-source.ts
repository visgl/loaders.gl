// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BlobFile, HttpFile, path} from '@loaders.gl/loader-utils';
import type {CoreAPI, Loader, LoaderOptions, ReadableFile} from '@loaders.gl/loader-utils';
import type {TilesetSourceResolver} from './tileset-source';

/** Options for {@link IndexedArchiveTilesetSource}. */
export type IndexedArchiveTilesetSourceOptions<ArchiveT> = {
  /** Archive URL or Blob. */
  data: string | Blob;
  /** Filename to expose for Blob inputs that do not provide a name. */
  fallbackFilename: string;
  /** Archive file extension used as the URL path marker. */
  archiveExtension: string;
  /** Path to the root metadata resource inside the archive. */
  rootPath: string;
  /** Optional mode passed when loading the root metadata resource. */
  rootMode?: string;
  /** Parses an opened readable file into an indexed archive object. */
  parseArchive: (file: ReadableFile) => Promise<ArchiveT>;
  /** Loads one resource from the parsed archive. */
  getFile: (archive: ArchiveT, pathInArchive: string, mode?: string) => Promise<ArrayBuffer>;
  /** Returns the core API used for local file loading and nested resource parsing. */
  getCoreApi: () => CoreAPI | undefined;
  /** Error message to throw when the core API is required but unavailable. */
  missingCoreApiMessage: string;
};

/**
 * Tileset source resolver backed by an indexed archive such as 3TZ or SLPK.
 *
 * The source owns archive opening, archive caching, path resolution, and archive-backed `fetch`
 * injection. Format-specific parsing and file lookup stay in the owning format module.
 */
export class IndexedArchiveTilesetSource<ArchiveT> implements TilesetSourceResolver {
  /** URL exposed to the tileset source that owns this archive source. */
  readonly sourceUrl: string;

  private readonly options: IndexedArchiveTilesetSourceOptions<ArchiveT>;
  private archivePromise?: Promise<ArchiveT>;

  /**
   * Creates an indexed archive tileset source.
   * @param options Archive source options
   */
  constructor(options: IndexedArchiveTilesetSourceOptions<ArchiveT>) {
    this.options = options;
    this.sourceUrl = getArchiveSourceUrl(options.data, options.fallbackFilename);
  }

  /**
   * Loads and parses the archive root metadata resource.
   * @param url Root URL, ignored because the archive root path is configured explicitly
   * @param loader Loader used to parse the root metadata
   * @param loadOptions Loader options forwarded to parsing
   */
  async loadRoot<DataT>(
    url: string,
    loader: Loader<DataT>,
    loadOptions: LoaderOptions
  ): Promise<DataT> {
    return await this.parseArchiveResource(
      url,
      this.options.rootPath,
      loader,
      loadOptions,
      this.options.rootMode
    );
  }

  /**
   * Loads and parses an archive resource relative to a requesting resource URL.
   * @param url Resource URL
   * @param loader Loader used to parse the resource
   * @param loadOptions Loader options forwarded to parsing
   */
  async loadResource<DataT>(
    url: string,
    loader: Loader<DataT>,
    loadOptions: LoaderOptions
  ): Promise<DataT> {
    const pathInArchive = this.resolveArchivePath(url, url);
    return await this.parseArchiveResource(url, pathInArchive, loader, loadOptions);
  }

  private async parseArchiveResource<DataT>(
    resourceUrl: string,
    pathInArchive: string,
    loader: Loader<DataT>,
    loadOptions: LoaderOptions,
    mode?: string
  ): Promise<DataT> {
    const coreApi = this.options.getCoreApi();
    if (!coreApi) {
      throw new Error(this.options.missingCoreApiMessage);
    }

    const data = await this.loadFile(pathInArchive, mode);
    const archiveFetch = this.createArchiveFetch(resourceUrl);
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

  private createArchiveFetch(contextUrl: string): typeof fetch {
    return async (input: RequestInfo | URL): Promise<Response> => {
      const requestUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const pathInArchive = this.resolveArchivePath(requestUrl, contextUrl);
      const data = await this.loadFile(pathInArchive);
      return new Response(data, {status: 200});
    };
  }

  private async loadFile(pathInArchive: string, mode?: string): Promise<ArrayBuffer> {
    this.archivePromise ||= this.openArchiveReadableFile().then(file =>
      this.options.parseArchive(file)
    );
    const archive = await this.archivePromise;
    return await this.options.getFile(archive, pathInArchive, mode);
  }

  private async openArchiveReadableFile(): Promise<ReadableFile> {
    const {data} = this.options;
    if (typeof data !== 'string') {
      return new BlobFile(data);
    }

    if (/^https?:\/\//i.test(data)) {
      return new HttpFile(data);
    }

    const coreApi = this.options.getCoreApi();
    if (!coreApi) {
      throw new Error(this.options.missingCoreApiMessage);
    }
    const response = await coreApi.fetchFile(data);
    return new BlobFile(await response.arrayBuffer());
  }

  private resolveArchivePath(request: string, baseUrl: string): string {
    const requestWithoutQuery = stripQueryString(request);
    const archiveRoot = stripQueryString(this.sourceUrl);
    const baseWithoutQuery = stripQueryString(baseUrl);
    const basePath =
      baseWithoutQuery === archiveRoot ? archiveRoot : path.dirname(baseWithoutQuery);
    const markerExpression = new RegExp(`\\.${this.options.archiveExtension}/(.*)$`, 'i');
    const markerMatch = requestWithoutQuery.match(markerExpression);
    if (markerMatch?.[1]) {
      return markerMatch[1];
    }

    const isAbsoluteRequest =
      /^[a-z][a-z0-9+.-]*:/i.test(requestWithoutQuery) || requestWithoutQuery.startsWith('/');
    const absoluteRequest = requestWithoutQuery.startsWith(archiveRoot)
      ? requestWithoutQuery
      : baseWithoutQuery === archiveRoot && !isAbsoluteRequest
        ? `${archiveRoot}/${requestWithoutQuery}`
        : path.resolve(basePath, requestWithoutQuery);

    if (absoluteRequest === archiveRoot) {
      return '';
    }

    if (absoluteRequest.startsWith(`${archiveRoot}/`)) {
      return absoluteRequest.slice(archiveRoot.length + 1);
    }

    return absoluteRequest.replace(/^\/+/, '');
  }
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
