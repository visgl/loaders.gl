// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, MapView, WebMercatorViewport} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import type {RasterBoundingBox, RasterData, RasterSource} from '@loaders.gl/core/loader-utils';
import {expect, test} from 'vitest';
import {projectWGS84ToPseudoMercator} from '../src/image-source-layer/utils';
import {RasterBitmapLayer} from '../src/raster-bitmap-layer';
import {colorizeRasterData, RasterSourceLayer} from '../src/raster-source-layer';

/** Row encodings that share the same geographic placement. */
type RasterCRS = 'EPSG:4326' | 'EPSG:3857';

/** Returns the same one-row stripe with bounds in the requested CRS. */
function createStripeSource(crs: RasterCRS): RasterSource {
  const geographicBounds: RasterBoundingBox = [
    [-10, 20],
    [10, 70]
  ];
  const [southwest, northeast] = geographicBounds;
  const boundingBox: RasterBoundingBox =
    crs === 'EPSG:3857'
      ? [projectWGS84ToPseudoMercator(southwest), projectWGS84ToPseudoMercator(northeast)]
      : geographicBounds;
  const width = 8;
  const height = 101;
  const data = new Uint8Array(width * height);
  const middleRow = (height - 1) / 2;
  data.fill(1, middleRow * width, (middleRow + 1) * width);
  const metadata = {width, height, bandCount: 1, dtype: 'uint8', crs, boundingBox} as const;
  const raster: RasterData = {...metadata, data};
  return {
    /** Returns the stripe fixture's metadata. */
    async getMetadata() {
      return metadata;
    },
    /** Returns the full fixture regardless of the viewport request. */
    async getRaster() {
      return raster;
    }
  };
}

test.each<[rendering: 'cpu' | 'gpu', crs: RasterCRS, expectedLatitude: number]>([
  ['cpu', 'EPSG:4326', 45],
  ['gpu', 'EPSG:4326', 45],
  // Latitude at the midpoint of the projected y coordinates for 20°N and 70°N.
  ['cpu', 'EPSG:3857', 51.2794],
  ['gpu', 'EPSG:3857', 51.2794]
])('%s renders the %s stripe at %d°N', async (rendering, crs, expectedLatitude) => {
  await expectStripeLatitude(rendering, crs, expectedLatitude);
});

test('cpu honors an explicit lnglat override for the EPSG:3857 stripe', async () => {
  await expectStripeLatitude('cpu', 'EPSG:3857', 45, 'lnglat');
});

/** Renders the stripe and checks its latitude to within one screen pixel. */
async function expectStripeLatitude(
  rendering: 'cpu' | 'gpu',
  crs: RasterCRS,
  expectedLatitude: number,
  imageCoordinateSystem?: 'lnglat'
): Promise<void> {
  const width = 64;
  const height = 256;
  const screenColumn = Math.floor(width / 2);
  const {longitude, latitude, zoom} = new WebMercatorViewport({width, height}).fitBounds([
    [-10, 15],
    [10, 75]
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const rendered = Promise.withResolvers<Uint8Array>();
  let rasterLoaded = false;
  const layer = new RasterSourceLayer({
    id: 'raster-stripe',
    data: createStripeSource(crs),
    rendering,
    colorizeRaster: raster => {
      // deck.gl v10 draws the default plain image object as black until #4654 lands.
      const image = colorizeRasterData(raster);
      return {image: new ImageData(new Uint8ClampedArray(image.data), image.width, image.height)};
    },
    bitmapLayerProps: imageCoordinateSystem ? {_imageCoordinateSystem: imageCoordinateSystem} : {},
    onRasterLoad: () => {
      rasterLoaded = true;
    },
    onMetadataLoadError: rendered.reject,
    onRasterLoadError: (_requestId, error) => rendered.reject(error)
  });
  const renderTimeout = window.setTimeout(
    () => rendered.reject(new Error('Timed out waiting for the raster to load and render')),
    5000
  );
  let deck: Deck<MapView> | undefined;
  try {
    document.body.append(canvas);
    deck = new Deck({
      canvas,
      width,
      height,
      useDevicePixels: false,
      views: new MapView(),
      viewState: {longitude, latitude, zoom},
      layers: [layer],
      onAfterRender: ({gl}) => {
        if (rasterLoaded && layer.isLoaded) {
          const pixels = new Uint8Array(height * 4);
          gl.readPixels(screenColumn, 0, 1, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          rendered.resolve(pixels);
        }
      },
      onError: rendered.reject
    });
    const pixels = await rendered.promise;
    expect(layer.getSubLayers()[0]?.constructor).toBe(
      rendering === 'cpu' ? BitmapLayer : RasterBitmapLayer
    );

    const stripeRows: number[] = [];
    for (let row = 0; row < height; row++) {
      // The default ramp goes from dark blue (red = 8) to yellow (red = 252).
      if (pixels[row * 4] > 128) {
        stripeRows.push(height - row - 0.5); // WebGL reads rows bottom to top.
      }
    }
    expect(stripeRows.length, 'visible stripe rows').toBeGreaterThan(0);
    const stripeScreenY = (stripeRows[0] + stripeRows[stripeRows.length - 1]) / 2;
    const screenX = screenColumn + 0.5;
    const [viewport] = deck.getViewports();
    const [, stripeLatitude] = viewport.unproject([screenX, stripeScreenY]);
    const [, expectedScreenY] = viewport.project([longitude, expectedLatitude]);
    const latitudePerPixel = Math.abs(
      viewport.unproject([screenX, expectedScreenY - 0.5])[1] -
        viewport.unproject([screenX, expectedScreenY + 0.5])[1]
    );
    expect(
      Math.abs(stripeLatitude - expectedLatitude),
      `Stripe at ${stripeLatitude.toFixed(4)}°N, expected ${expectedLatitude}°N within one pixel`
    ).toBeLessThanOrEqual(latitudePerPixel);
  } finally {
    window.clearTimeout(renderTimeout);
    deck?.finalize();
    canvas.remove();
  }
}
