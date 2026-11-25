// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  type CompositeLayerProps,
  type CoordinateSystem,
  type DefaultProps,
  type GetPickingInfoParams,
  type Layer,
  type LayerContext,
  type UpdateParameters,
  type Viewport
} from '@deck.gl/core';
import {
  BitmapLayer,
  type BitmapBoundingBox,
  type BitmapLayerPickingInfo,
  type BitmapLayerProps
} from '@deck.gl/layers';
import type {
  DataSourceOptions,
  GetRasterParameters,
  Loader,
  RasterBandMetadata,
  RasterBoundingBox,
  RasterData,
  NumericRasterData,
  RasterSource,
  RasterSourceMetadata,
  RasterViewport
} from '@loaders.gl/core/loader-utils';
import {
  computeRasterStatistics,
  isRasterSampleValid,
  sampleRaster
} from '@loaders.gl/core/loader-utils';
import {RasterSet, type RasterSetRequest} from '@loaders.gl/tiles/raster-set';
import {projectWGS84ToPseudoMercator} from './image-source-layer/utils';
import {
  type RasterBitmapData,
  RasterBitmapLayer,
  type RasterBitmapLayerProps,
  type RasterBitmapLayerPickingInfo,
  type RasterColormap,
  type RasterValueScale
} from './raster-bitmap-layer';
import {sampleColorRamp} from './raster-color-ramp';
import {
  finalizeOwnedSource,
  getCoordinateReferenceSystemIdentifier,
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

/** Props passed to a custom sublayer for the active raster rendering mode. */
export type RasterSourceSubLayerProps = Partial<BitmapLayerProps> | RasterBitmapLayerProps;

/** Props for {@link RasterSourceLayer}. */
export type RasterSourceLayerProps = Omit<CompositeLayerProps, 'data' | 'loaders'> & {
  /** Raster source runtime, URL, or Blob. */
  data: RasterSource | string | Blob;
  /** Parser loaders and SourceLoaders used to resolve URL/Blob inputs. */
  loaders?: ReadonlyArray<Loader>;
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
  /** Optional raster-to-bitmap colorizer for the CPU path. */
  colorizeRaster?: (raster: RasterData, context: RasterColorizerContext) => RasterRenderResult;
  /** Props forwarded to either bitmap sublayer. */
  bitmapLayerProps?: Partial<BitmapLayerProps>;
  /** Uses GPU colorization for single-band rasters when set to `'gpu'`. Defaults to `'cpu'`. */
  rendering?: 'cpu' | 'gpu';
  /** GPU color scale endpoints. Defaults to the current raster's sampled 2nd and 98th percentiles. */
  valueRange?: [number, number];
  /** GPU colormap preset or custom 256-entry RGBA lookup table. Defaults to `'default'`. */
  colormap?: RasterColormap;
  /** Transform applied after normalizing a GPU raster sample. Defaults to `'sqrt'`. */
  valueScale?: RasterValueScale;
  /** Optional factory receiving the props of the default sublayer. */
  renderSubLayer?: (props: RasterSourceSubLayerProps) => Layer;
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

/** Placement fields shared by CPU and GPU bitmaps. */
type RasterBitmapPlacement = Pick<RasterRenderResult, 'bounds' | 'coordinateSystem'>;

/** GPU sublayer inputs for the accepted raster and its placement. */
type RasterSourceGPUResult = RasterBitmapPlacement &
  Pick<RasterBitmapLayerProps, 'noData'> & {
    /** Single-band samples prepared for the GPU sublayer. */
    raster: RasterBitmapData;
    /** Computed percentile endpoints, or null when the sampled raster had no valid values. */
    percentileRange?: [number, number] | null;
  };

/** Source and rendering state shared across layer instances. */
type RasterSourceLayerState = {
  /** Identifies the current source resolution. */
  resolutionId: number;
  /** Current source runtime and ownership information. */
  resolvedSource: ResolvedVisualSource | null;
  /** Viewport request manager. */
  rasterSet: RasterSet | null;
  /** Removes listeners from the request manager. */
  unsubscribeRasterSetEvents: (() => void) | null;
  /** Current source metadata. */
  metadata: RasterSourceMetadata | null;
  /** Latest accepted raster request. */
  rasterRequest: RasterSetRequest | null;
  /** Cached CPU bitmap. */
  renderResult: RasterRenderResult | null;
  /** Cached GPU raster and placement. */
  gpuResult: RasterSourceGPUResult | null;
};

/** Default raster request and rendering props. */
const defaultProps: DefaultProps<RasterSourceLayerProps> = {
  id: 'raster-source-layer',
  data: null as never,
  loaders: {type: 'array', compare: false, value: []},
  sourceOptions: {type: 'object', compare: false, value: {}},
  rasterParameters: {type: 'object', compare: false, value: {}},
  bitmapLayerProps: {type: 'object', compare: false, value: {}},
  rendering: 'cpu',
  colormap: 'default',
  valueScale: 'sqrt',
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

/** Full opacity on the native scale for unsigned and floating-point alpha samples. */
const ALPHA_MAXIMUM: Partial<Record<NumericRasterData['dtype'], number>> = {
  uint16: 65535,
  uint32: 4294967295,
  float32: 1,
  float64: 1
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
      resolutionId: 0,
      resolvedSource: null,
      rasterSet: null,
      unsubscribeRasterSetEvents: null,
      metadata: null,
      rasterRequest: null,
      renderResult: null,
      gpuResult: null
    };
  }

  /** Releases pending requests and layer-owned sources. */
  finalizeState(context: LayerContext): void {
    this.state.resolutionId++;
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
      props.sourceOptions !== oldProps.sourceOptions;

    if (sourceChanged) {
      void this.resolveSource(props);
      return;
    }

    const {rasterRequest, metadata, gpuResult} = this.state;
    if (rasterRequest && metadata) {
      const useGPU = props.rendering === 'gpu' && rasterRequest.raster.bandCount === 1;
      if (
        useGPU !== Boolean(gpuResult) ||
        (useGPU &&
          (props.bitmapLayerProps !== oldProps.bitmapLayerProps ||
            (!props.valueRange && gpuResult?.percentileRange === undefined)))
      ) {
        this.updateRasterRendering(rasterRequest, metadata);
      }
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

  /** Renders the current raster with the selected bitmap sublayer. */
  renderLayers(): Layer | null {
    const {renderResult, gpuResult} = this.state;
    const {
      bitmapLayerProps,
      colormap = 'default',
      valueRange,
      valueScale = 'sqrt',
      renderSubLayer
    } = this.props;
    if (gpuResult) {
      const {percentileRange, raster, ...placement} = gpuResult;
      const props: RasterBitmapLayerProps = {
        ...this.getSubLayerProps({id: 'raster-bitmap'}),
        ...placement,
        ...bitmapLayerProps,
        raster: !valueRange && percentileRange === null ? null : raster,
        valueRange: valueRange ?? percentileRange ?? [0, 1],
        colormap,
        valueScale
      };
      return renderSubLayer ? renderSubLayer(props) : new RasterBitmapLayer(props);
    }
    if (!renderResult) {
      return null;
    }

    const props: Partial<BitmapLayerProps> = {
      ...this.getSubLayerProps({id: 'bitmap'}),
      coordinateSystem: renderResult.coordinateSystem,
      image: renderResult.image as any,
      bounds: renderResult.bounds,
      ...bitmapLayerProps
    };
    return renderSubLayer ? renderSubLayer(props) : new BitmapLayer(props);
  }

  /** Preserves the GPU sublayer's value and samples same-size CPU bitmaps. */
  override getPickingInfo(parameters: GetPickingInfoParams) {
    const info = super.getPickingInfo(parameters) as Partial<RasterBitmapLayerPickingInfo> &
      BitmapLayerPickingInfo;
    const raster = this.state.rasterRequest?.raster;
    if (
      info.value === undefined &&
      info.bitmap &&
      raster?.bandCount === 1 &&
      raster.width === info.bitmap.size.width &&
      raster.height === info.bitmap.size.height &&
      this.state.metadata
    ) {
      const rasterWithNoData = applyMetadataNoData(raster, this.state.metadata);
      info.value = sampleRaster(rasterWithNoData, info.bitmap.pixel).values[0] ?? null;
    }
    return info;
  }

  /** Resolves a runtime and attaches its request manager to the latest layer instance. */
  private async resolveSource(props: RasterSourceLayerProps): Promise<void> {
    const resolutionId = ++this.state.resolutionId;
    const getLayer = () => (this.getCurrentLayer() as this | null) ?? this;
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
      if (resolutionId !== this.state.resolutionId) {
        if (resolvedSource.owned) {
          await finalizeOwnedSource(resolvedSource.source);
        }
        return;
      }
      const layer = getLayer();
      layer.releaseRasterSet();
      const rasterSet = RasterSet.fromRasterSource(resolvedSource.source as RasterSource, {
        debounceTime: layer.props.debounceTime
      });
      const unsubscribeRasterSetEvents = rasterSet.subscribe({
        onLoadingStateChange: isLoading => getLayer().props.onLoadingStateChange?.(isLoading),
        onMetadataLoad: metadata => getLayer().handleMetadataLoad(metadata),
        onMetadataLoadError: error => getLayer().props.onMetadataLoadError?.(error),
        onRasterLoadStart: requestId => getLayer().props.onRasterLoadStart?.(requestId),
        onRasterLoad: request => getLayer().handleRasterLoad(request),
        onRasterLoadError: (requestId, error) =>
          getLayer().props.onRasterLoadError?.(requestId, error),
        onUpdate: () => getLayer().setNeedsUpdate()
      });
      layer.setState({resolvedSource, rasterSet, unsubscribeRasterSetEvents});

      if (previousSource?.owned && previousSource.source !== resolvedSource.source) {
        await finalizeOwnedSource(previousSource.source);
      }
      if (resolutionId !== this.state.resolutionId) {
        return;
      }
      const metadata = getLayer().props.metadata;
      if (metadata) {
        rasterSet.metadata = metadata;
        getLayer().handleMetadataLoad(metadata);
      } else {
        await rasterSet.loadMetadata();
      }
    } catch (error) {
      if (resolutionId === this.state.resolutionId) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        const layer = getLayer();
        layer.props.onSourceError?.(normalizedError);
        layer.raiseError(normalizedError, 'resolving raster source');
      }
    }
  }

  /** Stores metadata and starts the first viewport request. */
  private handleMetadataLoad(metadata: RasterSourceMetadata): void {
    this.setState({metadata});
    this.props.onMetadataLoad?.(metadata);
    this.requestRaster(this.context.viewport, 0, metadata);
  }

  /** Stores an accepted request and prepares its selected rendering path. */
  private handleRasterLoad(request: RasterSetRequest): void {
    const metadata = this.state.metadata;
    if (!metadata) {
      return;
    }
    this.updateRasterRendering(request, metadata);
    this.setState({rasterRequest: request});
    this.props.onRasterLoad?.(request);
  }

  /** Prepares GPU inputs for a single band or caches the existing CPU colorization. */
  private updateRasterRendering(request: RasterSetRequest, metadata: RasterSourceMetadata): void {
    const {raster, parameters} = request;
    const {rendering, valueRange, bitmapLayerProps, colorizeRaster} = this.props;
    if (rendering === 'gpu' && raster.bandCount === 1) {
      const placement =
        bitmapLayerProps?.bounds && bitmapLayerProps.coordinateSystem !== undefined
          ? {bounds: bitmapLayerProps.bounds, coordinateSystem: bitmapLayerProps.coordinateSystem}
          : getRasterBitmapPlacement(raster, parameters, metadata);
      const rasterWithNoData = applyMetadataNoData(raster, metadata);
      const previousGPUResult = this.state.rasterRequest === request ? this.state.gpuResult : null;
      const percentileRange = previousGPUResult?.percentileRange;
      const gpuResult: RasterSourceGPUResult = {
        ...placement,
        raster: previousGPUResult?.raster ?? createRasterBitmapData(rasterWithNoData),
        noData:
          raster.bands?.[0]?.noData === undefined
            ? rasterWithNoData.noData
            : raster.bands[0].noData,
        percentileRange:
          !valueRange && percentileRange === undefined
            ? getRasterPercentileRange(rasterWithNoData, 0)
            : percentileRange
      };
      this.setState({gpuResult, renderResult: null});
    } else {
      const renderResult = createRasterRenderResult(request, metadata, colorizeRaster);
      this.setState({renderResult, gpuResult: null});
    }
  }

  /** Requests the current viewport with source-specific parameter overrides. */
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
    const {colorBands, alphaBand} = getDisplayBands(metadata);
    const inferredParameters: GetRasterParameters = {
      viewport: rasterViewport,
      bands:
        this.props.rendering === 'gpu' && metadata.bandCount === 1
          ? [0]
          : alphaBand < 0
            ? colorBands
            : [...colorBands, alphaBand]
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

  /** Releases the manager and clears rendering state for its source. */
  private releaseRasterSet(): void {
    this.state?.unsubscribeRasterSetEvents?.();
    this.state?.rasterSet?.finalize();
    this.setState?.({
      rasterSet: null,
      unsubscribeRasterSetEvents: null,
      metadata: null,
      rasterRequest: null,
      renderResult: null,
      gpuResult: null
    });
  }
}

/** Marks masked samples as NaN while preserving the original values of valid texels for picking. */
function createRasterBitmapData(raster: RasterData): RasterBitmapData {
  const {data, width, height, validityMasks} = raster;
  const samples = Array.isArray(data) ? data[0] : data;
  return {
    width,
    height,
    data: validityMasks?.some(mask => mask.band === undefined || mask.band === 0)
      ? Float64Array.from(samples, (value, index) =>
          isRasterSampleValid(raster, index % width, Math.floor(index / width), 0) ? value : NaN
        )
      : samples
  };
}

/** Computes the default stretch from up to 4,096 evenly spaced visible raster samples. */
function getRasterPercentileRange(
  raster: NumericRasterData,
  band: number,
  isVisible?: (pixel: [number, number]) => boolean
): [number, number] | null {
  const samples: number[] = [];
  const pixelCount = raster.width * raster.height;
  const count = Math.min(pixelCount, 4096);
  for (let sampleIndex = 0; sampleIndex < count; sampleIndex++) {
    const index = Math.floor((sampleIndex * pixelCount) / count);
    const pixel: [number, number] = [index % raster.width, Math.floor(index / raster.width)];
    if (isVisible && !isVisible(pixel)) continue;
    const value = sampleRaster(raster, pixel, {bands: [band]}).values[0];
    if (value !== undefined) samples.push(value);
  }
  if (!samples.length) return null;
  samples.sort((left, right) => left - right);
  const lowerBound = samples[Math.floor((samples.length - 1) * 0.02)];
  const upperBound = samples[Math.floor((samples.length - 1) * 0.98)];
  return [lowerBound, upperBound === lowerBound ? upperBound + 1 : upperBound];
}

/** Selects display bands by role, with positional defaults for rasters without color roles. */
function getDisplayBands(raster: {bandCount: number; bands?: RasterBandMetadata[]}): {
  /** Payload band indices in display order. */
  colorBands: number[];
  /** Payload index of the alpha band, or -1 when absent. */
  alphaBand: number;
} {
  if (!raster.bands) return {colorBands: raster.bandCount >= 3 ? [0, 1, 2] : [0], alphaBand: -1};
  const indices = Array.from({length: raster.bandCount}, (_, index) => index);
  /** Finds the first payload band with the requested role. */
  const findBand = (role: RasterBandMetadata['colorInterpretation']) =>
    indices.find(index => raster.bands?.[index]?.colorInterpretation === role) ?? -1;
  const alphaBand = findBand('alpha');
  const rgb = [findBand('red'), findBand('green'), findBand('blue')];
  if (rgb.every(index => index >= 0)) return {colorBands: rgb, alphaBand};
  const gray = findBand('gray');
  if (gray >= 0) return {colorBands: [gray], alphaBand};

  const available = indices.filter(index => raster.bands?.[index]?.colorInterpretation !== 'alpha');
  return {colorBands: available.slice(0, available.length >= 3 ? 3 : 1), alphaBand};
}

/** Converts a native alpha sample to an opacity byte. */
function scaleAlphaToByte(value: number | undefined, maximum: number): number {
  return Math.round(clamp((value ?? 0) / maximum) * 255);
}

/** Converts a typed raster into a deck.gl-compatible RGBA bitmap image. */
export function colorizeRasterData(
  raster: NumericRasterData,
  options: {
    /** Opt in to min/max stretch; default preserves the historical percentile stretch. */ stretch?:
      | 'range'
      | 'percentile';
  } = {}
): RasterBitmapImage {
  const pixelCount = raster.width * raster.height;
  const target = new Uint8ClampedArray(pixelCount * 4);
  const {colorBands, alphaBand} = getDisplayBands(raster);
  const hasAlpha = alphaBand >= 0;
  const sampleBands = hasAlpha ? [...colorBands, alphaBand] : colorBands;
  const useAllColorNoData =
    !hasAlpha &&
    colorBands.length === 3 &&
    ['red', 'green', 'blue'].every(
      (role, channel) => raster.bands?.[colorBands[channel]]?.colorInterpretation === role
    );
  const hasNoData =
    Number.isFinite(raster.noData) ||
    sampleBands.some(band => Number.isFinite(raster.bands?.[band]?.noData));
  // Keep masks and non-finite checks in the display sample, independently of nodata inference.
  const displayRaster =
    raster.bands && hasNoData && (hasAlpha || useAllColorNoData)
      ? {...raster, noData: null, bands: raster.bands.map(band => ({...band, noData: null}))}
      : raster;
  const alphaDtype = raster.bands?.[alphaBand]?.dtype ?? raster.dtype;
  const alphaMaximum = ALPHA_MAXIMUM[alphaDtype] ?? 255;
  const alphaSampleOptions = {bands: [alphaBand]};
  const isVisible = hasAlpha
    ? (pixel: [number, number]) =>
        scaleAlphaToByte(
          sampleRaster(displayRaster, pixel, alphaSampleOptions).values[0],
          alphaMaximum
        ) > 0
    : undefined;
  const ranges = options.stretch === 'range' ? computeRasterStatistics(raster, 4096) : [];
  const statistics = colorBands.map((band): [number, number] | null => {
    if (options.stretch !== 'range') return getRasterPercentileRange(raster, band, isVisible);
    const range = ranges[band];
    return range.min === undefined || range.max === undefined
      ? null
      : [range.min, range.max === range.min ? range.max + 1 : range.max];
  });
  for (let index = 0; index < pixelCount; index++) {
    const pixel: [number, number] = [index % raster.width, Math.floor(index / raster.width)];
    const sample = sampleRaster(displayRaster, pixel, {bands: sampleBands});
    if (!sample.valid.every(Boolean)) continue;
    if (
      useAllColorNoData &&
      displayRaster !== raster &&
      !colorBands.some(band => isRasterSampleValid(raster, pixel[0], pixel[1], band))
    )
      continue;

    const outputIndex = index * 4;
    const alpha = hasAlpha ? scaleAlphaToByte(sample.values[colorBands.length], alphaMaximum) : 255;
    if (alpha === 0) continue;
    if (colorBands.length === 3) {
      for (let channel = 0; channel < 3; channel++)
        target[outputIndex + channel] = scaleToByte(sample.values[channel]!, statistics[channel]);
    } else {
      const range = statistics[0];
      if (range) {
        const normalized = clamp((sample.values[0]! - range[0]) / (range[1] - range[0]));
        const color = sampleColorRamp(Math.sqrt(normalized));
        target.set(color, outputIndex);
      } else if (!hasAlpha) {
        continue;
      }
    }
    target[outputIndex + 3] = alpha;
  }
  return {data: target, width: raster.width, height: raster.height};
}

/** Creates default bitmap props for a typed raster response. */
export function createDefaultRasterRenderResult(
  raster: RasterData,
  parameters: GetRasterParameters,
  metadata: RasterSourceMetadata
): RasterRenderResult {
  const rasterWithMetadataNoData = applyMetadataNoData(raster, metadata);
  const rasterWithBandMetadata =
    !raster.bands && metadata.bands?.some(band => band.colorInterpretation !== undefined)
      ? {
          ...rasterWithMetadataNoData,
          bands: Array.from({length: raster.bandCount}, (_, index) => {
            const sourceBand = parameters.bands?.[index] ?? index;
            return metadata.bands?.[sourceBand] ?? {index: sourceBand, dtype: raster.dtype};
          })
        }
      : rasterWithMetadataNoData;
  return {
    ...getRasterBitmapPlacement(raster, parameters, metadata),
    image: colorizeRasterData(rasterWithBandMetadata)
  };
}

/** Supplies source-level no-data when the payload does not declare a value. */
function applyMetadataNoData(raster: RasterData, metadata: RasterSourceMetadata): RasterData {
  return raster.noData === undefined && metadata.noData !== undefined
    ? {...raster, noData: metadata.noData}
    : raster;
}

/** Calculates bitmap bounds and deck coordinates without touching sample data. */
function getRasterBitmapPlacement(
  raster: RasterData,
  parameters: GetRasterParameters,
  metadata: RasterSourceMetadata
): RasterBitmapPlacement {
  if (
    !raster.boundingBox &&
    !metadata.boundingBox &&
    !metadata.crs &&
    !raster.crs &&
    !raster.transform
  ) {
    return {
      bounds: [0, metadata.height, metadata.width, 0],
      coordinateSystem: 'cartesian'
    };
  }
  const rasterBounds = raster.boundingBox || parameters.viewport.bounds || metadata.boundingBox;
  if (!rasterBounds && !raster.transform) {
    return {
      bounds: [0, raster.height, raster.width, 0],
      coordinateSystem: 'cartesian'
    };
  }
  const rasterCoordinateReferenceSystem = getCoordinateReferenceSystemIdentifier(
    raster.crs || metadata.crs
  );
  if (
    rasterCoordinateReferenceSystem &&
    rasterCoordinateReferenceSystem !== 'EPSG:3857' &&
    !/^(EPSG:4326|CRS:84|OGC:CRS84)$/i.test(rasterCoordinateReferenceSystem)
  ) {
    throw new Error(
      'RasterSourceLayer requires explicit bounds and coordinateSystem for an unsupported source CRS'
    );
  }
  const bounds = raster.transform
    ? getAffineBitmapBounds(raster, rasterCoordinateReferenceSystem === 'EPSG:3857')
    : rasterCoordinateReferenceSystem === 'EPSG:3857'
      ? unprojectPseudoMercatorBounds(rasterBounds!)
      : flattenBounds(rasterBounds!);
  return {
    bounds,
    coordinateSystem: rasterCoordinateReferenceSystem ? 'lnglat' : 'cartesian'
  };
}

/** Applies custom raster colorization while retaining inferred placement defaults. */
export function createRasterRenderResult(
  request: RasterSetRequest,
  metadata: RasterSourceMetadata,
  colorizeRaster?: RasterSourceLayerProps['colorizeRaster']
): RasterRenderResult {
  const customRenderResult = colorizeRaster?.(request.raster, {metadata, request});
  if (customRenderResult?.bounds && customRenderResult.coordinateSystem !== undefined)
    return customRenderResult;
  const defaultRenderResult = createDefaultRasterRenderResult(
    request.raster,
    request.parameters,
    metadata
  );
  return customRenderResult ? {...defaultRenderResult, ...customRenderResult} : defaultRenderResult;
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
  const coordinateReferenceSystem = getCoordinateReferenceSystemIdentifier(metadata.crs);
  let bounds: RasterBoundingBox | undefined;
  if (!metadata.crs) {
    bounds = metadata.boundingBox ?? [
      [0, 0],
      [metadata.width, metadata.height]
    ];
  } else if (viewportBounds) {
    bounds = [
      [viewportBounds[0], viewportBounds[1]],
      [viewportBounds[2], viewportBounds[3]]
    ];
    if (coordinateReferenceSystem === 'EPSG:3857') {
      bounds = [projectWGS84ToPseudoMercator(bounds[0]), projectWGS84ToPseudoMercator(bounds[1])];
    } else if (
      metadata.crs &&
      (!coordinateReferenceSystem ||
        !/^(EPSG:4326|CRS:84|OGC:CRS84)$/i.test(coordinateReferenceSystem)) &&
      !allowCustomProjection
    ) {
      throw new Error(
        `RasterSourceLayer cannot infer viewport reprojection for ${
          coordinateReferenceSystem || 'the declared CRS'
        }. Provide getRasterParameters().`
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
    crs: coordinateReferenceSystem,
    bounds,
    getBounds: bounds
      ? () => [bounds![0][0], bounds![0][1], bounds![1][0], bounds![1][1]]
      : undefined,
    project: coordinates => viewport.project(coordinates as any) as number[],
    unprojectPosition: position =>
      viewport.unprojectPosition(position as any) as [number, number, number]
  };
}

/** Normalizes one RGB channel using its raster stretch. */
function scaleToByte(value: number, statistics: [number, number] | null): number {
  if (!statistics) {
    return Math.round(clamp(value / 255) * 255);
  }
  const [lowerBound, upperBound] = statistics;
  return Math.round(clamp((value - lowerBound) / (upperBound - lowerBound)) * 255);
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

/** Places texture-grid corners using the signed affine, preserving shear and reversed rows. */
function getAffineBitmapBounds(raster: RasterData, mercator: boolean): BitmapBoundingBox {
  const [columnScale, rowShear, originX, columnShear, rowScale, originY] = raster.transform!;
  if (
    !raster.transform!.every(Number.isFinite) ||
    columnScale * rowScale - rowShear * columnShear === 0
  )
    throw new Error('Invalid raster placement affine');
  const shift = raster.pixelRegistration === 'point' ? 0.5 : 0;
  const grid = [
    [-shift, raster.height - shift],
    [-shift, -shift],
    [raster.width - shift, -shift],
    [raster.width - shift, raster.height - shift]
  ];
  const corners = grid.map(([column, row]) => {
    const point: [number, number] = [
      columnScale * column + rowShear * row + originX,
      columnShear * column + rowScale * row + originY
    ];
    return mercator ? unprojectPseudoMercator(point) : point;
  });
  if (rowShear === 0 && columnShear === 0 && columnScale > 0 && rowScale < 0)
    return [corners[0][0], corners[0][1], corners[2][0], corners[2][1]];
  return corners as [[number, number], [number, number], [number, number], [number, number]];
}
