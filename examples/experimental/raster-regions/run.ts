// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GeoTIFFRasterSource} from '@loaders.gl/geotiff';
import {RangeRequestScheduler} from '@loaders.gl/loader-utils';
import {createRegionExample} from './index.ts';
import type {RasterRegionParameters} from '@loaders.gl/loader-utils';

const url = process.argv[2];
if (!url)
  throw new Error('Usage: node --experimental-strip-types run.ts <range-supported TIFF URL>');
let reportRegionTransfer: (() => void) | undefined;
const transport = {requests: 0, bytes: 0, abortedRanges: 0};
const scheduler = new RangeRequestScheduler({
  onEvent: event => {
    if (event.type === 'request') {
      transport.requests++;
      reportRegionTransfer?.();
    }
    if (event.type === 'response') transport.bytes += event.responseBytes ?? 0;
    if (event.type === 'abort') transport.abortedRanges++;
  }
});
const source = new GeoTIFFRasterSource(url, {
  geotiff: {rangeScheduler: scheduler, rangeCacheProps: {maxEntries: 0, maxBytes: 0}}
});
const metadata = await source.getMetadata();
if (!metadata.crs || !metadata.boundingBox)
  throw new Error('The source must declare CRS and bounds');
const region: RasterRegionParameters = {
  bounds: metadata.boundingBox,
  crs: metadata.crs,
  width: 64,
  height: 64,
  maxPixels: 4096,
  maxDecodedBytes: 16 * 1024 * 1024
};
const center: [number, number] = [
  (metadata.boundingBox[0][0] + metadata.boundingBox[1][0]) / 2,
  (metadata.boundingBox[0][1] + metadata.boundingBox[1][1]) / 2
];
const example = createRegionExample(source, () => [region]);
const accepted = new Promise<void>((resolve, reject) =>
  example.manager.subscribe({
    onRasterLoad: request => {
      console.log({
        requests: example.counters,
        transport,
        raw: example.identify(request.raster, center, region.crs, 'raw'),
        physical: example.identify(request.raster, center, region.crs, 'physical')
      });
      resolve();
    },
    onRasterLoadError: (_requestId, error) => reject(error)
  })
);
const regionTransferStarted = new Promise<void>(resolve => {
  reportRegionTransfer = resolve;
});
try {
  example.update();
  await Promise.race([regionTransferStarted, accepted]);
  example.update();
  await accepted;
} finally {
  example.finalize();
  source.finalize();
  // This executable owns the injected scheduler and disposes it explicitly.
  scheduler.finalize();
}
