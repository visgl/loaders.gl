// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import * as pmtiles from 'pmtiles';

/**
 * A PMTiles library compatible source that reads from blobs
 * @deprecated TODO - reimplement as ReadableFileSource
 * Use loaders.gl HTTP range requests instead
 */
export class BlobSource implements pmtiles.Source {
  blob: Blob;
  key: string;

  constructor(blob: Blob, key: string) {
    this.blob = blob;
    this.key = key;
  }

  // TODO - how is this used?
  getKey() {
    // @ts-expect-error url is only defined on File subclass
    return this.blob.url || '';
  }

  async getBytes(
    offset: number,
    length: number,
    signal?: AbortSignal
  ): Promise<pmtiles.RangeResponse> {
    const slice = this.blob.slice(offset, offset + length);
    const data = await slice.arrayBuffer();
    return {
      data
      // etag: response.headers.get('ETag') || undefined,
      // cacheControl: response.headers.get('Cache-Control') || undefined,
      // expires: response.headers.get('Expires') || undefined
    };
  }
}
