// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, DataSourceOptions, SourceLoader} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {RADFormat} from './splats-format';
import {
  parseRADChunkHeader,
  tryParseRADHeader,
  type RADChunkMetadata,
  type RADChunkRange,
  type RADMetadata
} from './lib/parse-rad';
import {
  parseRADChunk,
  parseRADChunkToGaussianSplats,
  type RADChunkDecodeOptions
} from './lib/parse-rad-chunk';
import {makeGaussianSplatsArrowTable} from './lib/splats-arrow-table';
import type {GaussianSplats} from './types';

const DEFAULT_RAD_HEADER_BYTE_LENGTHS = [64 * 1024, 256 * 1024, 1024 * 1024];
const DEFAULT_RAD_MAX_CONCURRENT_CHUNK_REQUESTS = 4;

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for creating a Spark RAD source. */
export type RADSourceLoaderOptions = DataSourceOptions & {
  rad?: {
    /** Optional request headers forwarded to RAD and RADC fetches. */
    headers?: Record<string, string>;
    /** Whether remote RAD and RADC fetches should include credentials. */
    withCredentials?: boolean;
    /** Header byte lengths to try while probing remote RAD metadata. */
    headerByteLengths?: number[];
  };
};

/** Optional parameters for fetching RAD chunk bytes or metadata. */
export type RADChunkRequestOptions = {
  /** Abort signal forwarded to the underlying fetch. */
  signal?: AbortSignal;
} & RADChunkDecodeOptions;

/** Options for iterating decoded RAD chunk tables. */
export type RADChunkTableIteratorOptions = RADChunkRequestOptions & {
  /** First chunk index to decode. */
  startChunkIndex?: number;
  /** Maximum number of chunks to decode. */
  maxChunks?: number;
  /** Maximum number of splats to decode before stopping. */
  maxSplats?: number;
  /** Maximum number of RAD chunks to fetch and decode at once when the iterator must inspect a chunk window before yielding. */
  maxConcurrentChunkRequests?: number;
  /** Whether loaded child splats should replace parent LoD splats in returned tables. */
  pruneLoadedLoDParents?: boolean;
};

/** Source factory for Spark `.rad` paged LoD Gaussian splat containers. */
export const RADSourceLoader = {
  dataType: null as unknown as RADSource,
  batchType: null as never,
  ...RADFormat,
  name: 'RADSourceLoader',
  version: VERSION,
  type: 'rad',
  fromUrl: true,
  fromBlob: true,

  options: {
    rad: {
      headers: undefined!,
      withCredentials: false,
      headerByteLengths: undefined!
    }
  },

  defaultOptions: {
    rad: {
      headers: undefined!,
      withCredentials: false,
      headerByteLengths: undefined!
    }
  },

  testURL: (url: string): boolean => /\.rad(?:$|[?#])/i.test(url),
  createDataSource: (
    data: string | Blob,
    options: RADSourceLoaderOptions,
    coreApi?: CoreAPI
  ): RADSource => new RADSource(data, options, coreApi)
} as const satisfies SourceLoader<RADSource>;

/** Runtime source for RAD metadata and chunk-byte access. */
export class RADSource extends DataSource<string | Blob, RADSourceLoaderOptions> {
  /** Shared metadata promise exposed for source-style integrations. */
  metadata: Promise<RADMetadata>;

  /** Lazily initialized RAD header promise. */
  private _metadataPromise: Promise<RADMetadata> | null = null;
  /** Lazily initialized per-chunk metadata promises. */
  private _chunkMetadataPromises: Map<number, Promise<RADChunkMetadata>> = new Map();

  constructor(data: string | Blob, options: RADSourceLoaderOptions, coreApi?: CoreAPI) {
    super(data, options, RADSourceLoader.defaultOptions, coreApi);
    this.metadata = this.getMetadata();
  }

  /** Ensures the RAD header metadata has been loaded. */
  async initialize(): Promise<void> {
    await this.getMetadata();
  }

  /** Returns parsed Spark RAD top-level metadata. */
  async getMetadata(): Promise<RADMetadata> {
    if (!this._metadataPromise) {
      this._metadataPromise = this._loadMetadata();
    }
    return await this._metadataPromise;
  }

  /** Returns the number of chunks declared by the RAD metadata. */
  async getChunkCount(): Promise<number> {
    const metadata = await this.getMetadata();
    return metadata.chunks.length;
  }

  /** Returns the URL used for a chunk, or `null` for Blob-backed inline chunks. */
  async getChunkUrl(chunkIndex: number): Promise<string | null> {
    const metadata = await this.getMetadata();
    const chunk = this._getChunkRange(metadata, chunkIndex);
    if (chunk.filename) {
      return resolveRADChunkUrl(this.url, chunk.filename);
    }
    return typeof this.data === 'string' ? this.url : null;
  }

  /** Fetches one raw RADC chunk by index. */
  async getChunk(chunkIndex: number, options: RADChunkRequestOptions = {}): Promise<ArrayBuffer> {
    const metadata = await this.getMetadata();
    const chunk = this._getChunkRange(metadata, chunkIndex);

    if (chunk.filename) {
      if (typeof this.data !== 'string') {
        throw new Error('RADSource: sidecar RADC chunks require a URL-backed RAD source.');
      }
      return await this._fetchArrayBuffer(resolveRADChunkUrl(this.url, chunk.filename), undefined, {
        signal: options.signal
      });
    }

    if (chunk.bytes === 0) {
      return new ArrayBuffer(0);
    }

    const byteOffset = metadata.chunksByteOffset + chunk.offset;
    if (typeof this.data !== 'string') {
      return await this.data.slice(byteOffset, byteOffset + chunk.bytes).arrayBuffer();
    }

    return await this._fetchArrayBuffer(
      this.url,
      {offset: byteOffset, bytes: chunk.bytes},
      {signal: options.signal}
    );
  }

  /** Fetches and parses metadata for one RADC chunk. */
  async getChunkMetadata(
    chunkIndex: number,
    options: RADChunkRequestOptions = {}
  ): Promise<RADChunkMetadata> {
    let chunkMetadataPromise = this._chunkMetadataPromises.get(chunkIndex);
    if (!chunkMetadataPromise) {
      chunkMetadataPromise = this.getChunk(chunkIndex, options).then(chunk =>
        parseRADChunkHeader(chunk)
      );
      this._chunkMetadataPromises.set(chunkIndex, chunkMetadataPromise);
    }
    return await chunkMetadataPromise;
  }

  /** Fetches and decodes one RADC chunk into raw Gaussian splat arrays. */
  async getChunkSplats(
    chunkIndex: number,
    options: RADChunkRequestOptions = {}
  ): Promise<GaussianSplats> {
    const metadata = await this.getMetadata();
    return parseRADChunkToGaussianSplats(
      await this.getChunk(chunkIndex, options),
      this._getChunkDecodeOptions(metadata, options)
    );
  }

  /** Fetches and decodes one RADC chunk into a Mesh Arrow table. */
  async getChunkTable(
    chunkIndex: number,
    options: RADChunkRequestOptions = {}
  ): Promise<MeshArrowTable> {
    const metadata = await this.getMetadata();
    return parseRADChunk(
      await this.getChunk(chunkIndex, options),
      this._getChunkDecodeOptions(metadata, options)
    );
  }

  /** Iterates decoded RADC chunks as Mesh Arrow tables. */
  async *getChunkTables(options: RADChunkTableIteratorOptions = {}): AsyncIterable<MeshArrowTable> {
    const metadata = await this.getMetadata();
    const startChunkIndex = options.startChunkIndex ?? 0;
    const maxChunks = options.maxChunks ?? Number.POSITIVE_INFINITY;
    const maxSplats = options.maxSplats ?? Number.POSITIVE_INFINITY;
    let chunkCount = 0;
    let splatCount = 0;

    if (options.pruneLoadedLoDParents) {
      const chunkIndices = getRADChunkTableIteratorIndices(
        metadata,
        startChunkIndex,
        maxChunks,
        maxSplats
      );
      const splatChunks = await this._getChunkSplatsConcurrently(chunkIndices, options);
      let loadedGlobalSplatEnd = 0;
      for (const splats of splatChunks) {
        chunkCount++;
        splatCount += splats.splatCount;
        const base = getRADChunkSplatBase(splats);
        loadedGlobalSplatEnd = Math.max(loadedGlobalSplatEnd, base + splats.splatCount);
      }
      for (const splats of splatChunks) {
        yield makeGaussianSplatsArrowTable(pruneLoadedLoDParents(splats, loadedGlobalSplatEnd));
      }
      return;
    }

    for (
      let chunkIndex = startChunkIndex;
      chunkIndex < metadata.chunks.length && chunkCount < maxChunks && splatCount < maxSplats;
      chunkIndex++
    ) {
      const table = await this.getChunkTable(chunkIndex, options);
      chunkCount++;
      splatCount += table.data.numRows;
      yield table;
    }
  }

  /** Fetches and decodes RAD chunks with bounded concurrency while preserving chunk order. */
  private async _getChunkSplatsConcurrently(
    chunkIndices: number[],
    options: RADChunkTableIteratorOptions
  ): Promise<GaussianSplats[]> {
    const splatChunks = new Array<GaussianSplats>(chunkIndices.length);
    const maxConcurrentChunkRequests = getRADMaxConcurrentChunkRequests(
      options.maxConcurrentChunkRequests
    );
    let nextResultIndex = 0;

    async function loadNextChunk(source: RADSource): Promise<void> {
      while (nextResultIndex < chunkIndices.length) {
        const resultIndex = nextResultIndex++;
        const chunkIndex = chunkIndices[resultIndex];
        splatChunks[resultIndex] = await source.getChunkSplats(chunkIndex, options);
      }
    }

    const workerCount = Math.min(maxConcurrentChunkRequests, chunkIndices.length);
    await Promise.all(Array.from({length: workerCount}, () => loadNextChunk(this)));
    return splatChunks;
  }

  /** Adds source-level RAD decode metadata to chunk decode options. */
  private _getChunkDecodeOptions(
    metadata: RADMetadata,
    options: RADChunkRequestOptions
  ): RADChunkRequestOptions {
    return {
      ...options,
      radChunk: {
        splatEncoding: metadata.splatEncoding,
        ...options.radChunk
      }
    };
  }

  /** Loads and parses the top-level RAD metadata. */
  private async _loadMetadata(): Promise<RADMetadata> {
    const headerByteLengths = this.options.rad?.headerByteLengths?.length
      ? this.options.rad.headerByteLengths
      : DEFAULT_RAD_HEADER_BYTE_LENGTHS;

    if (typeof this.data !== 'string') {
      const byteLength = Math.min(this.data.size, Math.max(...headerByteLengths));
      const metadata = tryParseRADHeader(await this.data.slice(0, byteLength).arrayBuffer());
      if (metadata) {
        return metadata;
      }
      throw new Error('RADSource: Blob does not contain a complete RAD metadata header.');
    }

    for (const byteLength of headerByteLengths) {
      const metadata = tryParseRADHeader(
        await this._fetchArrayBuffer(this.url, {offset: 0, bytes: byteLength})
      );
      if (metadata) {
        return metadata;
      }
    }

    throw new Error('RADSource: failed to load a complete RAD metadata header.');
  }

  /** Returns a validated chunk table entry. */
  private _getChunkRange(metadata: RADMetadata, chunkIndex: number): RADChunkRange {
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= metadata.chunks.length) {
      throw new Error(
        `RADSource: chunk index ${chunkIndex} is outside 0-${metadata.chunks.length - 1}.`
      );
    }
    return metadata.chunks[chunkIndex];
  }

  /** Fetches a full or ranged ArrayBuffer while tolerating non-206 range fallbacks. */
  private async _fetchArrayBuffer(
    url: string,
    range?: {offset: number; bytes: number},
    options: RADChunkRequestOptions = {}
  ): Promise<ArrayBuffer> {
    const response = await this._fetchResponse(url, this._getRequestInit(range, options));
    if (!response.ok) {
      throw new Error(
        `RADSource: failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    if (range && response.status !== 206 && arrayBuffer.byteLength >= range.offset + range.bytes) {
      return arrayBuffer.slice(range.offset, range.offset + range.bytes);
    }
    if (range && arrayBuffer.byteLength > range.bytes) {
      return arrayBuffer.slice(0, range.bytes);
    }
    return arrayBuffer;
  }

  /** Fetches through custom source fetch hooks or the injected core fetchFile helper. */
  private async _fetchResponse(url: string, requestInit: RequestInit): Promise<Response> {
    if (this._hasCustomFetch()) {
      return await this.fetch(url, requestInit);
    }
    return this.hasCoreApi
      ? await this.coreApi.fetchFile(url, requestInit)
      : await this.fetch(url, requestInit);
  }

  /** Returns true when source options supplied an explicit fetch override. */
  private _hasCustomFetch(): boolean {
    return Boolean(this.loadOptions?.core?.fetch || this.loadOptions?.fetch);
  }

  /** Builds request options for RAD fetches. */
  private _getRequestInit(
    range?: {offset: number; bytes: number},
    options: RADChunkRequestOptions = {}
  ): RequestInit {
    const headers = new Headers(this.options.rad?.headers);
    if (range && range.bytes > 0) {
      headers.set('Range', `bytes=${range.offset}-${range.offset + range.bytes - 1}`);
    }

    return {
      headers,
      credentials: this.options.rad?.withCredentials ? 'include' : 'same-origin',
      signal: options.signal
    };
  }
}

/** Returns the RAD chunk indices requested by a chunk-table iterator. */
function getRADChunkTableIteratorIndices(
  metadata: RADMetadata,
  startChunkIndex: number,
  maxChunks: number,
  maxSplats: number
): number[] {
  const chunkIndices: number[] = [];
  let estimatedSplatCount = 0;
  for (
    let chunkIndex = startChunkIndex;
    chunkIndex < metadata.chunks.length &&
    chunkIndices.length < maxChunks &&
    estimatedSplatCount < maxSplats;
    chunkIndex++
  ) {
    const chunk = metadata.chunks[chunkIndex];
    chunkIndices.push(chunkIndex);
    estimatedSplatCount += chunk?.count ?? metadata.chunkSize ?? 0;
  }
  return chunkIndices;
}

/** Returns a positive integer chunk request concurrency limit. */
function getRADMaxConcurrentChunkRequests(maxConcurrentChunkRequests?: number): number {
  return Number.isFinite(maxConcurrentChunkRequests) && maxConcurrentChunkRequests! > 0
    ? Math.floor(maxConcurrentChunkRequests!)
    : DEFAULT_RAD_MAX_CONCURRENT_CHUNK_REQUESTS;
}

/** Returns the first global splat index represented by decoded RAD chunk data. */
function getRADChunkSplatBase(splats: GaussianSplats): number {
  return typeof splats.loaderData?.base === 'number' ? splats.loaderData.base : 0;
}

/** Remove parent LoD rows when their children are present in the loaded chunk range. */
function pruneLoadedLoDParents(
  splats: GaussianSplats,
  loadedGlobalSplatEnd: number
): GaussianSplats {
  const childCounts = splats.loaderData?.childCounts;
  const childStarts = splats.loaderData?.childStarts;
  if (!(childCounts instanceof Uint16Array) || !(childStarts instanceof Uint32Array)) {
    return splats;
  }

  const keepRows = new Uint32Array(splats.splatCount);
  let keepCount = 0;
  for (let rowIndex = 0; rowIndex < splats.splatCount; rowIndex++) {
    const childCount = childCounts[rowIndex];
    const childStart = childStarts[rowIndex];
    if (childCount > 0 && childStart < loadedGlobalSplatEnd) {
      continue;
    }
    keepRows[keepCount++] = rowIndex;
  }
  if (keepCount === splats.splatCount) {
    return splats;
  }

  const keptRows = keepRows.subarray(0, keepCount);
  const sphericalHarmonicsComponentCount = splats.sphericalHarmonicsComponentCount ?? 0;
  return {
    ...splats,
    splatCount: keepCount,
    positions: copyInterleavedRows(splats.positions, 3, keptRows),
    scales: copyInterleavedRows(splats.scales, 3, keptRows),
    rotations: copyInterleavedRows(splats.rotations, 4, keptRows),
    colors: copyInterleavedRows(splats.colors, 3, keptRows),
    sphericalHarmonicDcs: splats.sphericalHarmonicDcs
      ? copyInterleavedRows(splats.sphericalHarmonicDcs, 3, keptRows)
      : undefined,
    opacities: copyInterleavedRows(splats.opacities, 1, keptRows),
    sphericalHarmonics:
      splats.sphericalHarmonics && sphericalHarmonicsComponentCount
        ? copyInterleavedRows(splats.sphericalHarmonics, sphericalHarmonicsComponentCount, keptRows)
        : undefined,
    loaderData: {
      ...splats.loaderData,
      count: keepCount,
      childCounts: copyInterleavedRows(childCounts, 1, keptRows),
      childStarts: copyInterleavedRows(childStarts, 1, keptRows)
    }
  };
}

/** Copy selected rows from an interleaved typed array. */
function copyInterleavedRows<T extends Float32Array | Uint8Array | Uint16Array | Uint32Array>(
  values: T,
  itemSize: number,
  rows: Uint32Array
): T {
  const copiedValues = new (values.constructor as {new (length: number): T})(
    rows.length * itemSize
  );
  for (let outputRowIndex = 0; outputRowIndex < rows.length; outputRowIndex++) {
    const inputOffset = rows[outputRowIndex] * itemSize;
    const outputOffset = outputRowIndex * itemSize;
    copiedValues.set(values.subarray(inputOffset, inputOffset + itemSize), outputOffset);
  }
  return copiedValues;
}

/** Resolves a sidecar RADC chunk filename relative to its parent RAD URL. */
export function resolveRADChunkUrl(rootUrl: string, chunkFilename: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(chunkFilename) || chunkFilename.startsWith('/')) {
    return chunkFilename;
  }
  if (!rootUrl) {
    throw new Error('RADSource: cannot resolve a sidecar RADC chunk without a RAD URL.');
  }

  try {
    return new URL(chunkFilename, rootUrl).toString();
  } catch {
    const [rootPath, suffix = ''] = rootUrl.split(/([?#].*)/, 2);
    const lastSlashIndex = Math.max(rootPath.lastIndexOf('/'), rootPath.lastIndexOf('\\'));
    const rootDirectory = lastSlashIndex >= 0 ? rootPath.slice(0, lastSlashIndex + 1) : '';
    return `${rootDirectory}${chunkFilename}${suffix}`;
  }
}
