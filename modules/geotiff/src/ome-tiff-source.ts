// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  DataSourceOptions,
  Source,
  TileRangeRequestSchedulerProps
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {BaseClient, fromArrayBuffer, fromCustomClient, type GeoTIFF} from 'geotiff';

import {RangeRequestClient} from './lib/range-request-client';
import {isOmeTiff, loadOmeTiff} from './lib/ome/load-ome-tiff';
import type {TiffPixelSource} from './lib/tiff-pixel-source';
import type {PixelData, PixelSourceSelection} from './types';

const VERSION = '1.0.0';

/** Options for OME-TIFF pixel sources. */
export type OMETiffSourceOptions = DataSourceOptions & {
  tileRangeRequest?: TileRangeRequestSchedulerProps & {
    /** Reserved concurrency hint for range-request transports. */
    maxConcurrentRequests?: number;
  };
};

/** Loaded OME-TIFF pixel pyramid and OME-XML metadata. */
export type OMETiffSourceData = {
  /** Pixel sources, one per pyramid resolution. */
  data: TiffPixelSource<string[]>[];
  /** First OME image metadata parsed from the ImageDescription XML. */
  metadata: Record<string, unknown>;
};

/** Parameters for reading one OME-TIFF 2D raster plane. */
export type OMETiffRasterParameters = {
  /** Pyramid resolution index. */
  resolution?: number;
  /** Non-spatial OME dimension selection, for example `{t: 0, c: 1, z: 0}`. */
  selection: PixelSourceSelection<string[]>;
  /** Optional abort signal for tile decode / raster IO. */
  signal?: AbortSignal;
};

/** Parameters for reading one OME-TIFF tile. */
export type OMETiffTileParameters = OMETiffRasterParameters & {
  /** Pixel tile x coordinate within the selected pyramid level. */
  x: number;
  /** Pixel tile y coordinate within the selected pyramid level. */
  y: number;
};

/** loaders.gl Source descriptor for OME-TIFF pixel pyramids. */
export const OMETiffSource = {
  name: 'OME-TIFF',
  id: 'ome-tiff-source',
  module: 'geotiff',
  version: VERSION,
  extensions: ['ome.tif', 'ome.tiff', 'tif', 'tiff'],
  mimeTypes: ['image/tiff', 'image/geotiff'],
  type: 'ome-tiff',
  fromUrl: true,
  fromBlob: true,

  defaultOptions: {
    tileRangeRequest: {
      batchDelayMs: 50,
      maxGapBytes: 65536,
      rangeExpansionBytes: 65536,
      maxMergedBytes: 8388608,
      maxConcurrentRequests: 6
    }
  },

  testURL: (url: string): boolean => /\.ome\.tiff?$|\.ome\.tif$/i.test(url),
  createDataSource: (url: string | Blob, options: OMETiffSourceOptions): OMETiffDataSource =>
    new OMETiffDataSource(url, options)
} as const satisfies Source<OMETiffDataSource>;

/**
 * Data source for OME-TIFF pixel pyramids.
 */
export class OMETiffDataSource extends DataSource<string | Blob, OMETiffSourceOptions> {
  /** Promise that resolves to OME metadata and pixel-source pyramid levels. */
  readonly ready: Promise<OMETiffSourceData>;

  /** Creates an OME-TIFF data source for a URL or Blob. */
  constructor(data: string | Blob, options: OMETiffSourceOptions = {}) {
    super(data, options, OMETiffSource.defaultOptions);
    this.ready = this.loadData(data);
  }

  /** Returns OME-XML metadata parsed for the first image. */
  async getMetadata(): Promise<Record<string, unknown>> {
    return (await this.ready).metadata;
  }

  /** Returns pixel sources for all available pyramid resolutions. */
  async getPixelSources(): Promise<readonly TiffPixelSource<string[]>[]> {
    return (await this.ready).data;
  }

  /** Returns one pixel source by pyramid resolution index. */
  async getPixelSource(resolution: number = 0): Promise<TiffPixelSource<string[]>> {
    const pixelSources = await this.getPixelSources();
    const pixelSource = pixelSources[resolution];
    if (!pixelSource) {
      throw new Error(`OME-TIFF resolution ${resolution} is not available.`);
    }
    return pixelSource;
  }

  /** Reads one 2D raster plane from the requested pyramid resolution. */
  async getRaster(parameters: OMETiffRasterParameters): Promise<PixelData> {
    const pixelSource = await this.getPixelSource(parameters.resolution);
    return await pixelSource.getRaster({
      selection: parameters.selection,
      signal: parameters.signal
    });
  }

  /** Reads one pixel tile from the requested pyramid resolution. */
  async getTile(parameters: OMETiffTileParameters): Promise<PixelData> {
    const pixelSource = await this.getPixelSource(parameters.resolution);
    return await pixelSource.getTile({
      x: parameters.x,
      y: parameters.y,
      selection: parameters.selection,
      signal: parameters.signal
    });
  }

  /** Opens the TIFF container and extracts OME pixel sources. */
  private async loadData(data: string | Blob): Promise<OMETiffSourceData> {
    const tiff = await this.openGeoTIFF(data);
    const firstImage = await tiff.getImage(0);
    if (!(await isOmeTiff(firstImage))) {
      throw new Error('GeoTIFF is not an OME-TIFF.');
    }
    return await loadOmeTiff(tiff, firstImage);
  }

  /** Opens a Blob directly or a URL through the scheduled range-request client. */
  private async openGeoTIFF(data: string | Blob): Promise<GeoTIFF> {
    if (typeof data !== 'string') {
      return await fromArrayBuffer(await data.arrayBuffer());
    }

    const client = new RangeRequestClient(this.url, {
      ...this.options.tileRangeRequest,
      fetch: this.fetch
    });
    return await fromCustomClient(client as unknown as BaseClient, {maxRanges: 0});
  }
}
