// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {RasterSet} from '@loaders.gl/tiles';
import {sampleRaster, rasterCoordinateToPixel} from '@loaders.gl/loader-utils';
import type {
  NumericRasterData,
  RasterRegionParameters,
  RasterRegionSource
} from '@loaders.gl/loader-utils';

/** Renderer-injected coverage provider; every region has an explicit supported CRS. */
export type RasterCoverageProvider = () => RasterRegionParameters[];

/** Runs independent region requests without deck.gl or Kepler dependencies. */
export function createRegionExample(source: RasterRegionSource, coverage: RasterCoverageProvider) {
  const counters = {started: 0, accepted: 0, canceled: 0};
  const manager = RasterSet.fromCallbacks<
    NumericRasterData,
    {regions: RasterRegionParameters[]; signal?: AbortSignal}
  >({
    debounceTime: 0,
    getMetadata: options => source.getMetadata(options),
    getRaster: async parameters => {
      counters.started++;
      try {
        // The manager retains a representative payload, while the consumer retains placements.
        const rasters = await Promise.all(
          parameters.regions.map(region =>
            source.getRasterForRegion({...region, signal: parameters.signal})
          )
        );
        parameters.signal?.throwIfAborted();
        if (!rasters.length) throw new Error('Coverage provider returned no regions');
        return {...rasters[0], metadata: {...rasters[0].metadata, regions: rasters}};
      } catch (error) {
        if (parameters.signal?.aborted) counters.canceled++;
        throw error;
      }
    }
  });
  manager.subscribe({
    onRasterLoad: () => {
      counters.accepted++;
    }
  });
  return {
    counters,
    manager,
    /** Call on camera or projection changes; provider splits and transforms coverage. */
    update: (signal?: AbortSignal) => manager.requestRaster({regions: coverage(), signal}),
    /** Pick within one payload; never interpolate across the dateline split. */
    identify: (
      raster: NumericRasterData,
      coordinate: [number, number],
      coordinateReferenceSystem: RasterRegionParameters['crs'],
      domain: 'raw' | 'physical' = 'raw'
    ) => {
      if (!raster.crs) throw new Error('Payload CRS is unavailable');
      return sampleRaster(
        raster,
        rasterCoordinateToPixel(raster, coordinate, coordinateReferenceSystem),
        {
          domain
        }
      );
    },
    /** Manager owns requests and subscriptions; the injected source remains borrowed. */
    finalize: () => manager.finalize()
  };
}
