// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {DataSource as BaseDataSource} from '@loaders.gl/loader-utils';
import type {ArrowTableBatch} from '@loaders.gl/schema';

import {LanceFormat} from './lance-format';
import {parseLanceFileMetadata, type LanceFileMetadata} from './lance-file';
import {LanceDecoderUnavailableError} from './lance-loader';
import {parseLanceManifest, type LanceManifest} from './lance-manifest';
import {parseLanceFileToArrow, readLanceRemoteFileToArrow} from './lance-arrow';
import type {LanceFlatPrimitiveType} from './lance-decoder';
import {LANCE_SOURCE_CAPABILITIES, type LanceSourceCapabilities} from './lance-source-capabilities';

/** Options for a reusable read-only Lance dataset source. */
export type LanceSourceLoaderOptions = {
  lance?: {
    columns?: string[];
    limit?: number;
    batchSize?: number;
    version?: number | string;
    columnTypes?: LanceFlatPrimitiveType[];
    columnNames?: string[];
  };
};

/** Metadata returned after reading a Lance manifest. */
export type LanceSourceMetadata = LanceManifest & Readonly<{manifestURL?: string}>;

/** Runtime read-only Lance source scaffold. */
export class LanceSource extends BaseDataSource<string | Blob, LanceSourceLoaderOptions> {
  /** Feature support advertised by this source implementation. */
  readonly capabilities: LanceSourceCapabilities = LANCE_SOURCE_CAPABILITIES;
  private metadataPromise: Promise<LanceSourceMetadata> | null = null;

  /** Creates a source that will eventually scan a Lance dataset. */
  constructor(data: string | Blob, options: LanceSourceLoaderOptions, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Reads and caches the table schema from the Lance manifest. */
  async getSchema(): Promise<LanceManifest['fields']> {
    const metadata = await this.getMetadata();
    return metadata.fields;
  }

  /** Reads and caches the current table manifest. */
  async getMetadata(): Promise<LanceSourceMetadata> {
    this.metadataPromise ||= this.loadMetadata();
    return await this.metadataPromise;
  }

  /** Reads the footer and raw metadata tables for one Lance data file. */
  async getFileMetadata(filePath?: string): Promise<LanceFileMetadata> {
    const data = this.data;
    if (data instanceof Blob) {
      return parseLanceFileMetadata(await data.arrayBuffer());
    }

    let dataFileURL = data;
    if (!/\.lance(?:$|[?#])/i.test(dataFileURL)) {
      const manifest = await this.getMetadata();
      const path = filePath ?? manifest.fragments[0]?.files[0]?.path;
      if (!path) {
        throw new Error('Lance dataset manifest does not contain a data file');
      }
      dataFileURL = `${data.replace(/\/$/, '')}/data/${path}`;
    } else if (filePath) {
      dataFileURL = `${data.replace(/\/$/, '')}/${filePath.replace(/^\//, '')}`;
    }

    const response = await this.fetch(dataFileURL);
    if (!response.ok) {
      throw new Error(`Failed to read Lance data file ${dataFileURL}: ${response.status}`);
    }
    return parseLanceFileMetadata(await response.arrayBuffer());
  }

  /** Reads record batches once the Lance decoder is available. */
  async *readBatches(): AsyncIterable<ArrowTableBatch> {
    const lanceOptions = this.options.lance;
    if (!lanceOptions?.columnTypes) {
      throw new LanceDecoderUnavailableError();
    }
    const table =
      typeof this.data === 'string' && !/\.lance(?:$|[?#])/i.test(this.data)
        ? await this.readRemoteArrow(
            lanceOptions.columnTypes,
            lanceOptions.columnNames,
            lanceOptions.limit
          )
        : parseLanceFileToArrow(await this.loadDataFile(), {
            columnTypes: lanceOptions.columnTypes,
            columnNames: lanceOptions.columnNames
          });
    yield {batchType: 'data', shape: 'arrow-table', data: table.data, length: table.data.numRows};
  }

  /** Reads the first remote data file through HTTP range requests. */
  private async readRemoteArrow(
    columnTypes: LanceFlatPrimitiveType[],
    columnNames: string[] | undefined,
    limit: number | undefined
  ) {
    const metadata = await this.getMetadata();
    const dataFile = metadata.fragments[0]?.files[0];
    if (!dataFile) throw new Error('Lance dataset manifest does not contain a data file');
    const dataFileURL = `${this.data.toString().replace(/\/$/, '')}/data/${dataFile.path}`;
    return await readLanceRemoteFileToArrow(
      dataFileURL,
      dataFile.fileSizeBytes!,
      columnTypes.map((type, index) => ({
        index,
        name: columnNames?.[index] ?? `column${index}`,
        type
      })),
      limit
    );
  }

  private async loadDataFile(): Promise<ArrayBuffer> {
    const data = this.data;
    if (data instanceof Blob) return await data.arrayBuffer();

    let dataFileURL = data;
    if (!/\.lance(?:$|[?#])/i.test(dataFileURL)) {
      const manifest = await this.getMetadata();
      const path = manifest.fragments[0]?.files[0]?.path;
      if (!path) throw new Error('Lance dataset manifest does not contain a data file');
      dataFileURL = `${data.replace(/\/$/, '')}/data/${path}`;
    }
    const response = await this.fetch(dataFileURL);
    if (!response.ok) {
      throw new Error(`Failed to read Lance data file ${dataFileURL}: ${response.status}`);
    }
    return await response.arrayBuffer();
  }

  private async loadMetadata(): Promise<LanceSourceMetadata> {
    const data = this.data;
    if (data instanceof Blob) {
      return parseLanceManifest(await data.arrayBuffer());
    }

    const manifestURL = await this.resolveManifestURL();
    const response = await this.fetch(manifestURL);
    if (!response.ok) {
      throw new Error(`Failed to read Lance manifest ${manifestURL}: ${response.status}`);
    }
    return {...parseLanceManifest(await response.arrayBuffer()), manifestURL};
  }

  private async resolveManifestURL(): Promise<string> {
    const data = this.data;
    if (typeof data !== 'string') {
      throw new Error('Lance manifest discovery requires a dataset URL or path');
    }
    const root = data.replace(/\/$/, '');
    const requestedVersion = this.options.lance?.version;
    if (requestedVersion !== undefined && requestedVersion !== 'latest') {
      return `${root}/_versions/${requestedVersion}.manifest`;
    }

    const hintURL = `${root}/_versions/latest_version_hint.json`;
    const hintResponse = await this.fetch(hintURL);
    if (!hintResponse.ok) {
      throw new Error(
        `Unable to discover the latest Lance manifest at ${hintURL}; provide lance.version explicitly`
      );
    }
    const hint = (await hintResponse.json()) as {version?: number | string};
    if (hint.version === undefined) {
      throw new Error(`Lance version hint ${hintURL} does not contain a version`);
    }
    return `${root}/_versions/${hint.version}.manifest`;
  }
}

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: __VERSION__ is supplied by the build
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Metadata-only Lance source loader. */
export const LanceSourceLoader = {
  ...LanceFormat,
  dataType: null as unknown as LanceSource,
  batchType: null as never,
  name: 'LanceSourceLoader',
  id: 'lance-source',
  module: 'lance',
  version: VERSION,
  type: 'lance',
  fromUrl: true,
  fromBlob: true,
  options: {
    lance: {
      columns: undefined,
      limit: undefined,
      batchSize: undefined,
      version: undefined,
      columnTypes: undefined,
      columnNames: undefined
    }
  },
  defaultOptions: {
    lance: {
      columns: undefined!,
      limit: undefined!,
      batchSize: undefined!,
      version: undefined!,
      columnTypes: undefined!,
      columnNames: undefined!
    }
  },
  testURL: (url: string): boolean => /(?:\.lance|\.lance\/)(?:$|[?#/])/i.test(url),
  preload: async () => LanceSourceLoader,
  createDataSource(
    data: string | Blob,
    options: LanceSourceLoaderOptions,
    coreApi?: CoreAPI
  ): LanceSource {
    return new LanceSource(data, options, coreApi);
  }
} as const satisfies SourceLoader<LanceSource, LanceSourceLoaderOptions>;
