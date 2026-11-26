// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {_GlobeViewport, WebMercatorViewport, type LayerContext, type Viewport} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import type {
  GetRasterParameters,
  RasterBoundingBox,
  RasterSourceMetadata
} from '@loaders.gl/core/loader-utils';
import {projectionEngine} from '@math.gl/geospatial/projection';
import {expect, test, vi} from 'vitest';
import {RasterBitmapLayer} from '../src/raster-bitmap-layer';
import {RasterSourceLayer, type RasterSourceLayerProps} from '../src/raster-source-layer';

/** Reference source centered on the UTM zone 26N central meridian. */
const PROJECTED_METADATA: RasterSourceMetadata = {
  width: 1000,
  height: 500,
  bandCount: 1,
  dtype: 'float32',
  crs: 'EPSG:32626',
  boundingBox: [
    [400_000, 4_100_000],
    [600_000, 4_300_000]
  ]
};

/** Payload extent inside the source, independent of the viewport request bounds. */
const RASTER_BOUNDS: RasterBoundingBox = [
  [499_000, 4_205_000],
  [501_000, 4_207_000]
];

/** Sets up a memory raster source and a viewport without starting a renderer. */
function createProjectedLayer(
  viewport: Viewport,
  metadata: RasterSourceMetadata,
  props: Partial<RasterSourceLayerProps> = {}
) {
  const getRaster = vi.fn(async (_parameters: GetRasterParameters) => ({
    width: 2,
    height: 2,
    bandCount: 1,
    dtype: 'float32' as const,
    data: new Float32Array([0, 1, 2, 3]),
    boundingBox: RASTER_BOUNDS
  }));
  const onRasterLoad = vi.fn();
  const onSourceError = vi.fn();
  const layer = new RasterSourceLayer({
    data: {getMetadata: async () => metadata, getRaster},
    debounceTime: 0,
    onRasterLoad,
    onSourceError,
    ...props
  });
  layer.context = {viewport} as LayerContext;
  layer.initializeState();
  return {layer, getRaster, onRasterLoad, onSourceError};
}

test.for([
  'cpu',
  'gpu'
] as const)('requests UTM viewport bounds and places the %s bitmap in source meters', async (rendering, {
  onTestFinished
}) => {
  const viewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -27,
    latitude: 38,
    zoom: 12
  });
  const {layer, getRaster, onRasterLoad} = createProjectedLayer(viewport, PROJECTED_METADATA, {
    rendering,
    maxTextureSize: 100,
    onMetadataLoad: () => {
      layer['requestRaster'](viewport);
      expect(getRaster).not.toHaveBeenCalled();
    }
  });
  onTestFinished(() => layer['releaseRasterSet']());
  await layer['resolveSource'](layer.props);
  await vi.waitFor(() => expect(onRasterLoad).toHaveBeenCalledOnce());

  const request = getRaster.mock.calls[0][0].viewport;
  const {from} = (await projectionEngine.getCRS('EPSG:32626')).converter.WGS84;
  const corners = [
    from(viewport.unproject([0, 0])),
    from(viewport.unproject([480, 0])),
    from(viewport.unproject([0, 240])),
    from(viewport.unproject([480, 240]))
  ];
  const [minimumX, minimumY, maximumX, maximumY] = request.getBounds!();
  for (const [x, y] of corners) {
    expect(x).toBeGreaterThanOrEqual(minimumX);
    expect(x).toBeLessThanOrEqual(maximumX);
    expect(y).toBeGreaterThanOrEqual(minimumY);
    expect(y).toBeLessThanOrEqual(maximumY);
  }
  expect(request.crs).toBe('EPSG:32626');
  expect(minimumX).toBeGreaterThan(490_000);
  expect(maximumY).toBeGreaterThan(4_200_000);
  expect(request.width).toBe(100);
  expect(request.width / request.height).toBeCloseTo(
    (maximumX - minimumX) / (maximumY - minimumY),
    1
  );

  const bitmap = layer.renderLayers() as BitmapLayer;
  expect(bitmap.constructor).toBe(rendering === 'gpu' ? RasterBitmapLayer : BitmapLayer);
  expect(bitmap.props.coordinateSystem).toBe('EPSG:32626');
  expect(bitmap.props.bounds).toEqual([499_000, 4_205_000, 501_000, 4_207_000]);
  if (rendering === 'cpu' && typeof ImageData !== 'undefined') {
    expect(bitmap.props.image).toBeInstanceOf(ImageData);
  }
});

test('clips projected requests to the source extent and skips disjoint viewports', async ({
  onTestFinished
}) => {
  const viewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -27,
    latitude: 38,
    zoom: 12
  });
  const metadata = {...PROJECTED_METADATA, boundingBox: RASTER_BOUNDS};
  const {layer, getRaster} = createProjectedLayer(viewport, metadata, {metadata});
  onTestFinished(() => layer['releaseRasterSet']());
  await layer['resolveSource'](layer.props);
  expect(getRaster.mock.calls[0][0].viewport.bounds).toEqual(RASTER_BOUNDS);

  const offscreenViewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -27,
    latitude: 39,
    zoom: 12
  });
  layer['requestRaster'](offscreenViewport, 0);
  expect(getRaster).toHaveBeenCalledOnce();
});

test('reports an off-screen projected source as loaded without a request', async ({
  onTestFinished
}) => {
  const offscreenViewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -27,
    latitude: 39,
    zoom: 12
  });
  const metadata = {...PROJECTED_METADATA, boundingBox: RASTER_BOUNDS};
  const {layer, getRaster} = createProjectedLayer(offscreenViewport, metadata, {metadata});
  onTestFinished(() => layer['releaseRasterSet']());
  await layer['resolveSource'](layer.props);
  expect(getRaster).not.toHaveBeenCalled();
  expect(layer.state.projectedSourceOffscreen).toBe(true);
  // Minimal deck.gl internal state, so the base Layer reports no pending async props.
  (layer as any).internalState = {isAsyncPropLoading: () => false, subLayers: []};
  expect(layer.isLoaded).toBe(true);
  (layer as any).internalState = null;

  const visibleViewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -27,
    latitude: 38,
    zoom: 12
  });
  layer['requestRaster'](visibleViewport, 0);
  expect(layer.state.projectedSourceOffscreen).toBe(false);
  expect(getRaster).toHaveBeenCalledOnce();
});

test('clears the off-screen loaded state when the source is released', async ({onTestFinished}) => {
  const offscreenViewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -27,
    latitude: 39,
    zoom: 12
  });
  const metadata = {...PROJECTED_METADATA, boundingBox: RASTER_BOUNDS};
  const {layer} = createProjectedLayer(offscreenViewport, metadata, {metadata});
  onTestFinished(() => layer['releaseRasterSet']());
  await layer['resolveSource'](layer.props);
  expect(layer.state.projectedSourceOffscreen).toBe(true);

  // A data change releases the raster set before the next source resolves.
  layer['releaseRasterSet']();
  expect(layer.state.projectedSourceOffscreen).toBe(false);
  (layer as any).internalState = {isAsyncPropLoading: () => false, subLayers: []};
  expect(layer.isLoaded).toBe(false);
  (layer as any).internalState = null;
});

test('samples the globe surface and skips non-finite and horizon-clamped sky points', async ({
  onTestFinished
}) => {
  const viewport = new _GlobeViewport({
    width: 800,
    height: 400,
    longitude: -27,
    latitude: 38,
    zoom: 1
  });
  const center = viewport.unproject([400, 200]);
  const sky = viewport.unproject([400, 0]);
  expect(sky.every(Number.isFinite)).toBe(true);
  expect(viewport.project(sky)[1]).toBeGreaterThan(1);
  // Give one sky sample a distinct northing so its rejection is observable in the bounds.
  const offscreenGround = [-27, -80];
  const unproject = viewport.unproject.bind(viewport);
  const unprojectSpy = vi.spyOn(viewport, 'unproject').mockImplementation(position => {
    const [screenX, screenY] = position;
    if (screenX === 0) {
      return [Number.NaN, Number.POSITIVE_INFINITY];
    }
    return screenX === 400 && screenY === 0 ? offscreenGround : unproject(position);
  });
  onTestFinished(() => unprojectSpy.mockRestore());
  const {layer, getRaster} = createProjectedLayer(viewport, {
    ...PROJECTED_METADATA,
    boundingBox: undefined
  });
  onTestFinished(() => layer['releaseRasterSet']());
  await layer['resolveSource'](layer.props);
  const [minimumX, minimumY, maximumX, maximumY] = getRaster.mock.calls[0][0].viewport.getBounds!();
  const {from} = (await projectionEngine.getCRS('EPSG:32626')).converter.WGS84;
  const [centerX, centerY] = from(center);
  expect(centerX).toBeGreaterThan(minimumX);
  expect(centerX).toBeLessThan(maximumX);
  expect(centerY).toBeGreaterThan(minimumY);
  expect(centerY).toBeLessThan(maximumY);
  expect(minimumY).toBeGreaterThan(from(offscreenGround)[1]);

  unprojectSpy.mockReturnValue([Number.NaN, Number.NaN]);
  layer['requestRaster'](viewport, 0);
  expect(getRaster).toHaveBeenCalledOnce();
});

test('requests a projected source confined to the strip near the globe limb', async ({
  onTestFinished
}) => {
  const viewport = new _GlobeViewport({
    width: 800,
    height: 400,
    longitude: -27,
    latitude: 38,
    zoom: 1
  });
  const {from} = (await projectionEngine.getCRS('EPSG:32626')).converter.WGS84;
  const surface = viewport.unproject([400, 355]);
  expect(viewport.project(surface)[1]).toBeCloseTo(355);
  expect(viewport.project(viewport.unproject([400, 400]))[1]).toBeLessThan(399.5);
  const [sourceX, sourceY] = from(surface);
  // The southernmost valid grid sample is at (400, 350). The next row is sky,
  // so the unrefined bounds end north of this entire source.
  const boundingBox: RasterBoundingBox = [
    [sourceX - 1_000, sourceY - 1_000],
    [sourceX + 1_000, sourceY + 1_000]
  ];
  const {layer, getRaster} = createProjectedLayer(viewport, {...PROJECTED_METADATA, boundingBox});
  onTestFinished(() => layer['releaseRasterSet']());
  await layer['resolveSource'](layer.props);
  expect(getRaster).toHaveBeenCalledOnce();
  expect(getRaster.mock.calls[0][0].viewport.bounds).toEqual(boundingBox);
});

test('pitched Web Mercator can unproject sky to a finite point that misses the original pixel', () => {
  const viewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -27,
    latitude: 38,
    zoom: 4,
    pitch: 60,
    altitude: 0.75
  });
  const position = viewport.unproject([240, 15]);
  expect(position.every(Number.isFinite)).toBe(true);
  const [screenX, screenY] = viewport.project(position);
  expect(Math.hypot(screenX - 240, screenY - 15)).toBeGreaterThan(0.5);
});

test.for([
  {pitch: 60, lastSkyRow: 0, nearHorizonY: 25},
  {pitch: 85, lastSkyRow: 90, nearHorizonY: 105}
])('excludes behind-camera samples at $pitch degrees and keeps distant ground', async ({
  pitch,
  lastSkyRow,
  nearHorizonY
}, {onTestFinished}) => {
  const viewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -27,
    latitude: 38,
    zoom: 12,
    pitch,
    altitude: 0.75
  });
  const sky = viewport.unproject([240, lastSkyRow]);
  expect(sky.every(Number.isFinite)).toBe(true);
  const [screenX, screenY, skyDepth] = viewport.project([...sky, 0]);
  // Perspective division can return the original pixel even for a point behind the camera.
  expect(Math.hypot(screenX - 240, screenY - lastSkyRow)).toBeLessThan(0.5);
  const horizonDepth = viewport.projectionMatrix[10] / viewport.projectionMatrix[11];
  expect(skyDepth).toBeGreaterThan(horizonDepth);

  const {from} = (await projectionEngine.getCRS('EPSG:32626')).converter.WGS84;
  const groundNorthings: number[] = [];
  for (let row = lastSkyRow + 30; row <= 240; row += 30) {
    for (let column = 0; column <= 480; column += 60) {
      groundNorthings.push(from(viewport.unproject([column, row]))[1]);
    }
  }
  const distantGround = viewport.unproject([240, nearHorizonY]);
  const [, , distantDepth] = viewport.project([...distantGround, 0]);
  expect(distantDepth).toBeGreaterThan(1);
  expect(distantDepth).toBeLessThan(horizonDepth);
  const distantNorthing = from(distantGround)[1];
  expect(distantNorthing).toBeGreaterThan(Math.max(...groundNorthings));

  const {layer, getRaster} = createProjectedLayer(viewport, {
    ...PROJECTED_METADATA,
    boundingBox: undefined
  });
  onTestFinished(() => layer['releaseRasterSet']());
  await layer['resolveSource'](layer.props);
  expect(getRaster).toHaveBeenCalledOnce();
  const [, minimumY, , maximumY] = getRaster.mock.calls[0][0].viewport.getBounds!();
  expect(minimumY).toBeCloseTo(Math.min(...groundNorthings), 6);
  expect(from(sky)[1]).toBeLessThan(minimumY);
  expect(maximumY).toBeGreaterThanOrEqual(distantNorthing);
});

test('reports unresolvable CRS definitions and keeps custom request and placement overrides', async ({
  onTestFinished
}) => {
  const viewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -27,
    latitude: 38,
    zoom: 12
  });
  const metadata = {...PROJECTED_METADATA, crs: 'EPSG:999999'};
  const onMetadataLoadError = vi.fn();
  const {layer, getRaster, onSourceError} = createProjectedLayer(viewport, metadata, {
    onMetadataLoadError
  });
  onTestFinished(() => layer['releaseRasterSet']());
  await layer['resolveSource'](layer.props);
  expect(getRaster).not.toHaveBeenCalled();
  expect(onSourceError).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringMatching(/EPSG:999999.*getRasterParameters/)
    })
  );
  expect(onMetadataLoadError).toHaveBeenCalledWith(onSourceError.mock.calls[0][0]);

  const customBounds = [0, 0, 2, 2] as const;
  const getRasterParameters = vi.fn((rasterViewport: GetRasterParameters['viewport']) => ({
    viewport: {...rasterViewport, bounds: RASTER_BOUNDS}
  }));
  const custom = createProjectedLayer(viewport, metadata, {
    getRasterParameters,
    colorizeRaster: () => ({
      image: {data: new Uint8ClampedArray(16), width: 2, height: 2},
      bounds: [...customBounds],
      coordinateSystem: 'cartesian'
    })
  });
  onTestFinished(() => custom.layer['releaseRasterSet']());
  await custom.layer['resolveSource'](custom.layer.props);
  await vi.waitFor(() => expect(custom.onRasterLoad).toHaveBeenCalledOnce());
  expect(custom.getRaster.mock.calls[0][0].viewport.bounds).toEqual(RASTER_BOUNDS);
  expect(getRasterParameters.mock.calls[0][0].getBounds?.()).toEqual(viewport.getBounds());
  expect((custom.layer.renderLayers() as BitmapLayer).props).toMatchObject({
    coordinateSystem: 'cartesian',
    bounds: customBounds
  });
});

/** NAD83 / UTM zone 19N is not a built-in projection engine code. */
const NAD83_UTM19_DEFINITION = '+proj=utm +zone=19 +datum=NAD83 +units=m +no_defs';

test.for([
  'cpu',
  'gpu'
] as const)('places a %s raster in a CRS supplied by resolveCRSDefinition', async (rendering, {
  onTestFinished
}) => {
  await expect(projectionEngine.getCRS('EPSG:26919')).rejects.toThrow(/EPSG:26919/);
  const viewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -69,
    latitude: 41,
    zoom: 12
  });
  const resolveCRSDefinition = vi.fn(async (identifier: string) =>
    identifier === 'EPSG:26919' ? NAD83_UTM19_DEFINITION : null
  );
  const {layer, getRaster, onRasterLoad} = createProjectedLayer(
    viewport,
    {
      ...PROJECTED_METADATA,
      crs: 'EPSG:26919',
      boundingBox: [
        [400_000, 4_400_000],
        [600_000, 4_700_000]
      ]
    },
    {rendering, resolveCRSDefinition}
  );
  onTestFinished(() => layer['releaseRasterSet']());
  await layer['resolveSource'](layer.props);
  await vi.waitFor(() => expect(onRasterLoad).toHaveBeenCalledOnce());

  expect(resolveCRSDefinition).toHaveBeenCalledOnce();
  expect(resolveCRSDefinition).toHaveBeenCalledWith('EPSG:26919');
  const request = getRaster.mock.calls[0][0].viewport;
  expect(request.crs).toBe('EPSG:26919');
  const [minimumX, minimumY, maximumX, maximumY] = request.getBounds!();
  expect(minimumX).toBeLessThan(500_000);
  expect(maximumX).toBeGreaterThan(500_000);
  expect(minimumY).toBeGreaterThan(4_500_000);
  expect(maximumY).toBeLessThan(4_600_000);

  const bitmap = layer.renderLayers() as BitmapLayer;
  expect(bitmap.props.coordinateSystem).toBe(NAD83_UTM19_DEFINITION);
});

test('keeps the built-in identifier when resolveCRSDefinition returns nothing', async ({
  onTestFinished
}) => {
  const viewport = new WebMercatorViewport({
    width: 480,
    height: 240,
    longitude: -27,
    latitude: 38,
    zoom: 12
  });
  const resolveCRSDefinition = vi.fn(() => undefined);
  const {layer, onRasterLoad} = createProjectedLayer(viewport, PROJECTED_METADATA, {
    resolveCRSDefinition
  });
  onTestFinished(() => layer['releaseRasterSet']());
  await layer['resolveSource'](layer.props);
  await vi.waitFor(() => expect(onRasterLoad).toHaveBeenCalledOnce());

  expect(resolveCRSDefinition).toHaveBeenCalledWith('EPSG:32626');
  expect((layer.renderLayers() as BitmapLayer).props.coordinateSystem).toBe('EPSG:32626');
});
