// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RangeRequestScheduler, type RangeRequestSchedulerProps} from '@loaders.gl/loader-utils';
import type {Source, RangeResponse} from 'pmtiles';

/** Options for the PMTiles range-request source adapter. */
export type RangeRequestSourceOptions = RangeRequestSchedulerProps & {
  /** Fetch function used for PMTiles HTTP requests. */
  fetch?: (url: string, options?: RequestInit) => Promise<Response>;
};

/**
 * PMTiles compatible source that reads HTTP byte ranges through a coalescing scheduler.
 */
export class RangeRequestSource implements Source {
  /** URL of the PMTiles archive. */
  readonly url: string;
  private readonly fetch: (url: string, options?: RequestInit) => Promise<Response>;
  private readonly scheduler: RangeRequestScheduler;

  /** Creates a PMTiles package Source backed by scheduled HTTP range requests. */
  constructor(url: string, options: RangeRequestSourceOptions = {}) {
    this.url = url;
    this.fetch = options.fetch || fetch;
    this.scheduler = new RangeRequestScheduler({
      batchDelayMs: options.batchDelayMs ?? 0,
      maxGapBytes: options.maxGapBytes,
      rangeExpansionBytes: options.rangeExpansionBytes,
      maxMergedBytes: options.maxMergedBytes,
      stats: options.stats,
      onEvent: options.onEvent
    });
  }

  /** Returns the PMTiles source cache key. */
  getKey(): string {
    return this.url;
  }

  /** Reads an exact byte range from the PMTiles archive. */
  async getBytes(offset: number, length: number, signal?: AbortSignal): Promise<RangeResponse> {
    const data = await this.scheduler.fetch({
      sourceId: this.url,
      url: this.url,
      offset,
      length,
      signal,
      fetch: this.fetch
    });

    return {data};
  }
}
