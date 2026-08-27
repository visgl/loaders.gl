// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  COORDINATE_SYSTEM,
  CompositeLayer,
  type CompositeLayerProps,
  type CoordinateSystem,
  type DefaultProps,
  type Layer,
  type LayerContext,
  type UpdateParameters,
  type Viewport
} from '@deck.gl/core';
import {BitmapLayer, type BitmapBoundingBox, type BitmapLayerProps} from '@deck.gl/layers';
import type {
  DataSourceOptions,
  GetRasterParameters,
  Loader,
  RasterBoundingBox,
  RasterData,
  RasterSource,
  RasterSourceMetadata,
  RasterViewport,
  SourceLoader
} from '@loaders.gl/loader-utils';
import {RasterSet, type RasterSetRequest} from '@loaders.gl/tiles';
import {projectWGS84ToPseudoMercator} from './image-source-layer/utils';
import {
  finalizeOwnedSource,
  resolveVisualSource,
  type ResolvedVisualSource
} from './source-layer-utils';

/** Image payload accepted by deck.gl's {@link BitmapLayer}. */
export type RasterBitmapImage = {
  /** RGBA bytes. */
  data: Uint8ClampedArray;
  /** Image width in pixels. */
  width: number;
  /** Image height in pixels. */
  height: number;
};

/** Context passed to custom raster colorizers. */
export type RasterColorizerContext = {
  /** Source metadata used for the request. */
  metadata: RasterSourceMetadata;
  /** Accepted raster request. */
  request: RasterSetRequest;
};

/** Result returned by a custom raster colorizer. */
export type RasterRenderResult = {
  /** Bitmap-compatible image source. */
  image: RasterBitmapImage | TexImageSource;
  /** Deck bounds covered by the image. */
  bounds?: BitmapBoundingBox;
  /** Coordinate system used by the bitmap bounds. */
  coordinateSystem?: CoordinateSystem;
};

/** Props for {@link RasterSourceLayer}. */
export type RasterSourceLayerProps = Omit<CompositeLayerProps, 'data' | 'loaders'> & {
  /** Raster source runtime, URL, or Blob. */
  data: RasterSource | string | Blob;
  /** Parser loaders and SourceLoaders used to resolve URL/Blob inputs. */
  loaders?: ReadonlyArray<Loader | SourceLoader>;
  /** @deprecated Put SourceLoaders in `loaders`. */
  sources?: Readonly<SourceLoader[]>;
  /** Options forwarded to source construction. */
  sourceOptions?: DataSourceOptions;
  /** Optional metadata already loaded by a parent SourceLayer. */
  metadata?: RasterSourceMetadata | null;
  /** Source-specific request fields merged over inferred viewport parameters. */
  rasterParameters?: Record<string, unknown>;
  /** Optional callback for complete request-parameter customization. */
  getRasterParameters?: (
    viewport: RasterViewport,
    metadata: RasterSourceMetadata
  ) => GetRasterParameters | Record<string, unknown>;
  /** Optional raster-to-bitmap colorizer. */
  colorizeRaster?: (raster: RasterData, context: RasterColorizerContext) => RasterRenderResult;
  /** Props forwarded to the default BitmapLayer. */
  bitmapLayerProps?: Partial<BitmapLayerProps>;
  /** Debounce interval applied to viewport requests. */
  debounceTime?: number;
  /** Maximum raster request dimension after device-pixel scaling. */
  maxTextureSize?: number;
  /** Called when metadata resolves. */
  onMetadataLoad?: (metadata: RasterSourceMetadata) => void;
  /** Called when metadata loading fails. */
  onMetadataLoadError?: (error: Error) => void;
  /** Called when a raster request starts. */
  onRasterLoadStart?: (requestId: number) => void;
  /** Called when a raster request becomes current. */
  onRasterLoad?: (request: RasterSetRequest) => void;
  /** Called when a raster request fails. */
  onRasterLoadError?: (requestId: number, error: Error) => void;
  /** Called when metadata/raster loading starts or stops. */
  onLoadingStateChange?: (isLoading: boolean) => void;
  /** Called when URL/Blob source resolution fails. */
  onSourceError?: (error: Error) => void;
};

type RasterSourceLayerState = {
  resolvedSource: ResolvedVisualSource | null;
  rasterSet: RasterSet | null;
  unsubscribeRasterSetEvents: (() => void) | null;
  metadata: RasterSourceMetadata | null;
  renderResult: RasterRenderResult | null;
};

const defaultProps: DefaultProps<RasterSourceLayerProps> = {
  id: 'raster-source-layer',
  data: null as never,
  loaders: {type: 'array', compare: false, value: []},
  sources: {type: 'array', compare: false, value: []},
  sourceOptions: {type: 'object', compare: false, value: {}},
  rasterParameters: {type: 'object', compare: false, value: {}},
  bitmapLayerProps: {type: 'object', compare: false, value: {}},
  debounceTime: 100,
  maxTextureSize: 1024,
  onMetadataLoad: {type: 'function', value: () => {}},
  onMetadataLoadError: {type: 'function', value: () => {}},
  onRasterLoadStart: {type: 'function', value: () => {}},
  onRasterLoad: {type: 'function', value: () => {}},
  onRasterLoadError: {type: 'function', value: () => {}},
  onLoadingStateChange: {type: 'function', value: () => {}},
  onSourceError: {type: 'function', value: () => {}}
};

/**
 * Viewport-driven deck.gl adapter for loaders.gl {@link RasterSource} runtimes.
 *
 * Geospatial rasters render in longitude/latitude bounds. Sources without geospatial bounds render
 * as a full pixel-coordinate plane and are suitable for an OrthographicView.
 */
export class RasterSourceLayer extends CompositeLayer<RasterSourceLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'RasterSourceLayer';

  /** Default raster request and rendering props. */
  static defaultProps: DefaultProps = defaultProps;

  /** Typed raster runtime state. */
  state = null as unknown as RasterSourceLayerState;

  private resolutionId = 0;

  /** Creates a raster source layer with mixed parser and source loader support. */
  constructor(props: RasterSourceLayerProps) {
    super(props as any);
  }

  /** Raster layers update when props or the active viewport changes. */
  shouldUpdateState(): boolean {
    return true;
  }

  /** Initializes source and request-manager state. */
  initializeState(): void {
    this.state = {
      resolvedSource: null,
      rasterSet: null,
      unsubscribeRasterSetEvents: null,
      metadata: null,
      renderResult: null
    };
  }

  /** Releases pending requests and layer-owned sources. */
  finalizeState(context: LayerContext): void {
    this.resolutionId++;
    this.releaseRasterSet();
    if (this.state.resolvedSource?.owned) {
      void finalizeOwnedSource(this.state.resolvedSource.source);
    }
    super.finalizeState(context);
  }

  /** Returns true when the current raster request has settled. */
  get isLoaded(): boolean {
    return Boolean(this.state?.rasterSet?.isLoaded) && super.isLoaded;
  }

  /** Resolves sources and issues viewport-driven raster requests. */
  updateState({props, oldProps, changeFlags}: UpdateParameters<this>): void {
    const sourceChanged =
      changeFlags.dataChanged ||
      props.loaders !== oldProps.loaders ||
      props.sources !== oldProps.sources ||
      props.sourceOptions !== oldProps.sourceOptions;

    if (sourceChanged) {
      void this.resolveSource(props);
      return;
    }

    if (
      props.rasterParameters !== oldProps.rasterParameters ||
      props.getRasterParameters !== oldProps.getRasterParameters ||
      props.debounceTime !== oldProps.debounceTime ||
      changeFlags.viewportChanged
    ) {
      this.requestRaster(this.context.viewport);
    }
  }

  /** Renders the current raster as a BitmapLayer. */
  renderLayers(): Layer | null {
    const renderResult = this.state.renderResult;
    if (!renderResult) {
      return null;
    }

    return new BitmapLayer({
      ...this.getSubLayerProps({id: 'bitmap'}),
      coordinateSystem: renderResult.coordinateSystem,
      image: renderResult.image as any,
      bounds: renderResult.bounds as any,
      ...this.props.bitmapLayerProps
    }) as unknown as Layer;
  }

  private async resolveSource(props: RasterSourceLayerProps): Promise<void> {
    const resolutionId = ++this.resolutionId;
    const previousSource = this.state.resolvedSource;
    try {
      const resolvedSource = await resolveVisualSource(props);
      if (resolvedSource.sourceType !== 'raster') {
        if (resolvedSource.owned) {
          await finalizeOwnedSource(resolvedSource.source);
        }
        throw new Error(
          `RasterSourceLayer expected a raster source but resolved ${resolvedSource.sourceType}.`
        );
      }
      if (resolutionId !== this.resolutionId) {
        if (resolvedSource.owned) {
          await finalizeOwnedSource(resolvedSource.source);
        }
        return;
      }
      if (previousSource?.owned && previousSource.source !== resolvedSource.source) {
        await finalizeOwnedSource(previousSource.source);
      }

      this.releaseRasterSet();
      const rasterSet = RasterSet.fromRasterSource(resolvedSource.source as RasterSource, {
        debounceTime: props.debounceTime
      });
      const unsubscribeRasterSetEvents = rasterSet.subscribe({
        onLoadingStateChange: isLoading => this.props.onLoadingStateChange?.(isLoading),
        onMetadataLoad: metadata => this.handleMetadataLoad(metadata),
        onMetadataLoadError: error => this.props.onMetadataLoadError?.(error),
        onRasterLoadStart: requestId => this.props.onRasterLoadStart?.(requestId),
        onRasterLoad: request => this.handleRasterLoad(request),
        onRasterLoadError: (requestId, error) => this.props.onRasterLoadError?.(requestId, error),
        onUpdate: () => this.setNeedsUpdate()
      });
      this.setState({resolvedSource, rasterSet, unsubscribeRasterSetEvents, renderResult: null});

      if (props.metadata) {
        rasterSet.metadata = props.metadata;
        this.handleMetadataLoad(props.metadata);
      } else {
        await rasterSet.loadMetadata();
      }
    } catch (error) {
      if (resolutionId === this.resolutionId) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        this.props.onSourceError?.(normalizedError);
        this.raiseError(normalizedError, 'resolving raster source');
      }
    }
  }

  private handleMetadataLoad(metadata: RasterSourceMetadata): void {
    this.setState({metadata});
    this.props.onMetadataLoad?.(metadata);
    this.requestRaster(this.context.viewport, 0, metadata);
  }

  private handleRasterLoad(request: RasterSetRequest): void {
    const metadata = this.state.metadata;
    if (!metadata) {
      return;
    }
    const renderResult = createRasterRenderResult(request, metadata, this.props.colorizeRaster);
    this.setState({renderResult});
    this.props.onRasterLoad?.(request);
  }

  private requestRaster(
    viewport: Viewport,
    debounceTime = this.props.debounceTime,
    metadata = this.state.metadata
  ): void {
    const rasterSet = this.state.rasterSet;
    if (!rasterSet || !metadata || !viewport) {
      return;
    }
    const rasterViewport = createRasterViewport(
      viewport,
      metadata,
      this.props.maxTextureSize,
      Boolean(this.props.getRasterParameters)
    );
    const defaultBands = metadata.bandCount >= 3 ? [0, 1, 2] : [0];
    const inferredParameters: GetRasterParameters = {
      viewport: rasterViewport,
      bands: defaultBands
    };
    const customParameters = this.props.getRasterParameters?.(rasterViewport, metadata);
    rasterSet.requestRaster(
      {
        ...inferredParameters,
        ...this.props.rasterParameters,
        ...customParameters,
        viewport: (customParameters as GetRasterParameters | undefined)?.viewport || rasterViewport
      } as GetRasterParameters,
      debounceTime
    );
  }

  private releaseRasterSet(): void {
    this.state?.unsubscribeRasterSetEvents?.();
    this.state?.rasterSet?.finalize();
    this.setState?.({
      rasterSet: null,
      unsubscribeRasterSetEvents: null,
      metadata: null,
      renderResult: null
    });
  }
}

/** Converts a typed raster into a deck.gl-compatible RGBA bitmap image. */
export function colorizeRasterData(raster: RasterData): RasterBitmapImage {
  const target = new Uint8ClampedArray(raster.width * raster.height * 4);
  if (Array.isArray(raster.data) && raster.data.length >= 3) {
    writeSeparateRgb(target, raster);
  } else if (!Array.isArray(raster.data) && raster.interleaved && raster.bandCount >= 3) {
    writeInterleavedRgb(target, raster);
  } else {
    const values = Array.isArray(raster.data) ? raster.data[0] : raster.data;
    writeSingleBand(target, values, raster.noData);
  }
  return {data: target, width: raster.width, height: raster.height};
}

/** Creates default bitmap props for a typed raster response. */
export function createDefaultRasterRenderResult(
  raster: RasterData,
  parameters: GetRasterParameters,
  metadata: RasterSourceMetadata
): RasterRenderResult {
  if (!raster.boundingBox && !metadata.boundingBox && !metadata.crs) {
    return {
      image: colorizeRasterData(raster),
      bounds: [0, metadata.height, metadata.width, 0],
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN
    };
  }
  const rasterBounds = raster.boundingBox || parameters.viewport.bounds || metadata.boundingBox;
  if (!rasterBounds) {
    return {
      image: colorizeRasterData(raster),
      bounds: [0, raster.height, raster.width, 0],
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN
    };
  }
  const bounds =
    (raster.crs || metadata.crs) === 'EPSG:3857'
      ? unprojectPseudoMercatorBounds(rasterBounds)
      : flattenBounds(rasterBounds);
  return {
    image: colorizeRasterData(raster),
    bounds,
    coordinateSystem: COORDINATE_SYSTEM.LNGLAT
  };
}

/** Applies custom raster colorization while retaining inferred placement defaults. */
export function createRasterRenderResult(
  request: RasterSetRequest,
  metadata: RasterSourceMetadata,
  colorizeRaster?: RasterSourceLayerProps['colorizeRaster']
): RasterRenderResult {
  const defaultRenderResult = createDefaultRasterRenderResult(
    request.raster,
    request.parameters,
    metadata
  );
  if (!colorizeRaster) {
    return defaultRenderResult;
  }
  return {
    ...defaultRenderResult,
    ...colorizeRaster(request.raster, {metadata, request})
  };
}

/** Converts a deck.gl viewport into the normalized viewport accepted by RasterSource. */
export function createRasterViewport(
  viewport: Viewport,
  metadata: RasterSourceMetadata,
  maxTextureSize = 1024,
  allowCustomProjection = false
): RasterViewport {
  const devicePixelRatio = globalThis.devicePixelRatio || 1;
  const width = Math.max(
    1,
    Math.min(maxTextureSize, Math.round(viewport.width * devicePixelRatio))
  );
  const height = Math.max(
    1,
    Math.min(maxTextureSize, Math.round(viewport.height * devicePixelRatio))
  );
  const viewportBounds = viewport.getBounds?.();
  let bounds: RasterBoundingBox | undefined;
  if (!metadata.boundingBox && !metadata.crs) {
    bounds = [
      [0, 0],
      [metadata.width, metadata.height]
    ];
  } else if (viewportBounds) {
    bounds = [
      [viewportBounds[0], viewportBounds[1]],
      [viewportBounds[2], viewportBounds[3]]
    ];
    if (metadata.crs === 'EPSG:3857') {
      bounds = [projectWGS84ToPseudoMercator(bounds[0]), projectWGS84ToPseudoMercator(bounds[1])];
    } else if (metadata.crs && !/EPSG:4326|CRS:84/i.test(metadata.crs) && !allowCustomProjection) {
      throw new Error(
        `RasterSourceLayer cannot infer viewport reprojection for ${metadata.crs}. Provide getRasterParameters().`
      );
    }
  }

  const center = bounds
    ? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2]
    : [0, 0];
  return {
    id: viewport.id || 'raster-source-layer',
    width,
    height,
    zoom: 'zoom' in viewport ? Number((viewport as any).zoom) : 0,
    center,
    crs: metadata.crs,
    bounds,
    getBounds: bounds
      ? () => [bounds![0][0], bounds![0][1], bounds![1][0], bounds![1][1]]
      : undefined,
    project: coordinates => viewport.project(coordinates as any) as number[],
    unprojectPosition: position =>
      viewport.unprojectPosition(position as any) as [number, number, number]
  };
}

function writeSingleBand(
  target: Uint8ClampedArray,
  values: ArrayLike<number>,
  noData?: number | null
): void {
  const statistics = computeStatistics(values, noData);
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    const outputIndex = index * 4;
    if (!Number.isFinite(value) || value === noData || !statistics) {
      target[outputIndex + 3] = 0;
      continue;
    }
    const normalized = clamp(
      (value - statistics.lowerBound) / (statistics.upperBound - statistics.lowerBound)
    );
    const [red, green, blue] = sampleColorRamp(Math.sqrt(normalized));
    target[outputIndex] = red;
    target[outputIndex + 1] = green;
    target[outputIndex + 2] = blue;
    target[outputIndex + 3] = 255;
  }
}

function writeSeparateRgb(target: Uint8ClampedArray, raster: RasterData): void {
  const [redBand, greenBand, blueBand] = raster.data as ArrayLike<number>[];
  const statistics = [
    computeStatistics(redBand, raster.noData),
    computeStatistics(greenBand, raster.noData),
    computeStatistics(blueBand, raster.noData)
  ];
  for (let index = 0; index < redBand.length; index++) {
    const outputIndex = index * 4;
    const values = [redBand[index], greenBand[index], blueBand[index]];
    if (values.some(value => !Number.isFinite(value) || value === raster.noData)) {
      continue;
    }
    target[outputIndex] = scaleToByte(values[0], statistics[0]);
    target[outputIndex + 1] = scaleToByte(values[1], statistics[1]);
    target[outputIndex + 2] = scaleToByte(values[2], statistics[2]);
    target[outputIndex + 3] = 255;
  }
}

function writeInterleavedRgb(target: Uint8ClampedArray, raster: RasterData): void {
  const values = raster.data as ArrayLike<number>;
  const channelSamples = [[], [], []] as number[][];
  const stride = Math.max(1, Math.floor((raster.width * raster.height) / 4096));
  for (let pixelIndex = 0; pixelIndex < raster.width * raster.height; pixelIndex += stride) {
    const inputIndex = pixelIndex * raster.bandCount;
    for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
      const value = values[inputIndex + channelIndex];
      if (Number.isFinite(value) && value !== raster.noData) {
        channelSamples[channelIndex].push(value);
      }
    }
  }
  const statistics = channelSamples.map(sample => computeStatistics(sample, raster.noData));
  for (let pixelIndex = 0; pixelIndex < raster.width * raster.height; pixelIndex++) {
    const inputIndex = pixelIndex * raster.bandCount;
    const outputIndex = pixelIndex * 4;
    const red = values[inputIndex];
    const green = values[inputIndex + 1];
    const blue = values[inputIndex + 2];
    if ([red, green, blue].some(value => !Number.isFinite(value) || value === raster.noData)) {
      continue;
    }
    target[outputIndex] = scaleToByte(red, statistics[0]);
    target[outputIndex + 1] = scaleToByte(green, statistics[1]);
    target[outputIndex + 2] = scaleToByte(blue, statistics[2]);
    target[outputIndex + 3] = 255;
  }
}

function computeStatistics(
  values: ArrayLike<number>,
  noData?: number | null
): {lowerBound: number; upperBound: number} | null {
  const sample: number[] = [];
  const stride = Math.max(1, Math.floor(values.length / 4096));
  for (let index = 0; index < values.length; index += stride) {
    const value = values[index];
    if (Number.isFinite(value) && value !== noData) {
      sample.push(value);
    }
  }
  if (!sample.length) {
    return null;
  }
  sample.sort((left, right) => left - right);
  const lowerBound = sample[Math.floor((sample.length - 1) * 0.02)];
  const upperBound = sample[Math.floor((sample.length - 1) * 0.98)];
  return {lowerBound, upperBound: lowerBound === upperBound ? upperBound + 1 : upperBound};
}

function scaleToByte(
  value: number,
  statistics: {lowerBound: number; upperBound: number} | null
): number {
  if (!statistics) {
    return Math.round(clamp(value / 255) * 255);
  }
  return Math.round(
    clamp((value - statistics.lowerBound) / (statistics.upperBound - statistics.lowerBound)) * 255
  );
}

function sampleColorRamp(value: number): [number, number, number] {
  const stops = [
    [8, 29, 88],
    [32, 83, 150],
    [39, 145, 140],
    [100, 189, 99],
    [252, 217, 98]
  ] as const;
  const scaledIndex = clamp(value) * (stops.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(stops.length - 1, lowerIndex + 1);
  const mix = scaledIndex - lowerIndex;
  return [0, 1, 2].map(channelIndex =>
    Math.round(
      stops[lowerIndex][channelIndex] +
        (stops[upperIndex][channelIndex] - stops[lowerIndex][channelIndex]) * mix
    )
  ) as [number, number, number];
}

function flattenBounds(bounds: RasterBoundingBox): [number, number, number, number] {
  return [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]];
}

function unprojectPseudoMercatorBounds(
  bounds: RasterBoundingBox
): [number, number, number, number] {
  const minimum = unprojectPseudoMercator(bounds[0]);
  const maximum = unprojectPseudoMercator(bounds[1]);
  return [minimum[0], minimum[1], maximum[0], maximum[1]];
}

function unprojectPseudoMercator(position: [number, number]): [number, number] {
  const earthRadius = 6378137;
  const longitude = (position[0] / earthRadius) * (180 / Math.PI);
  const latitude =
    (2 * Math.atan(Math.exp(position[1] / earthRadius)) - Math.PI / 2) * (180 / Math.PI);
  return [longitude, latitude];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
