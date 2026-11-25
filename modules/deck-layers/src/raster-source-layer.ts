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
import {projectionEngine, type CRSConverter} from '@math.gl/geospatial/projection';
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

/** A deck.gl CRS definition and its prepared conversion between source units and WGS84. */
type ProjectedRasterCRS = {
  /** CRS identifier passed to the source and bitmap layers. */
  identifier: string;
  /** Synchronous conversions for viewport sampling and raster coordinates. */
  converter: CRSConverter;
};

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
  /** Prepared projected CRS, null when unavailable, or undefined while resolving. */
  projectedCRS: ProjectedRasterCRS | null | undefined;
  /** True when the projected source does not overlap the current viewport, so no request is due. */
  projectedSourceOffscreen?: boolean;
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
 * Geospatial rasters render in MapView or GlobeView, including sources with a supported projected
 * CRS. Sources without geospatial bounds render as a pixel-coordinate plane in OrthographicView.
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
      projectedCRS: null,
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
    return (
      Boolean(this.state?.projectedSourceOffscreen || this.state?.rasterSet?.isLoaded) &&
      super.isLoaded
    );
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
    let reportsMetadataProjectionError = false;
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
      let metadataProjection: Promise<void> | undefined;
      const unsubscribeRasterSetEvents = rasterSet.subscribe({
        onLoadingStateChange: isLoading => getLayer().props.onLoadingStateChange?.(isLoading),
        onMetadataLoad: metadata => {
          metadataProjection = getLayer().handleMetadataLoad(metadata);
        },
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
        await getLayer().handleMetadataLoad(metadata);
      } else {
        await rasterSet.loadMetadata();
        reportsMetadataProjectionError = Boolean(metadataProjection);
        await metadataProjection;
      }
    } catch (error) {
      if (resolutionId === this.state.resolutionId) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        const layer = getLayer();
        if (reportsMetadataProjectionError) {
          layer.props.onMetadataLoadError?.(normalizedError);
        }
        layer.props.onSourceError?.(normalizedError);
        layer.raiseError(normalizedError, 'resolving raster source');
      }
    }
  }

  /** Stores metadata and starts the first viewport request once projection is available. */
  private handleMetadataLoad(metadata: RasterSourceMetadata): Promise<void> | undefined {
    const {resolutionId} = this.state;
    const identifier = getCoordinateReferenceSystemIdentifier(metadata.crs);
    const needsProjection = identifier && !isBuiltInRasterCRS(identifier);
    this.setState({metadata, projectedCRS: needsProjection ? undefined : null});
    this.props.onMetadataLoad?.(metadata);
    if (resolutionId !== this.state.resolutionId) {
      return undefined;
    }
    if (needsProjection) {
      return this.resolveProjectedCRS(identifier);
    }
    this.requestRaster(this.context.viewport, 0, metadata);
    return undefined;
  }

  /** Prepares the source CRS once and resumes requests on the latest layer and viewport. */
  private async resolveProjectedCRS(identifier: string): Promise<void> {
    const {resolutionId, rasterSet} = this.state;
    const descriptor = await projectionEngine.getCRS(identifier).catch(() => null);
    const layer = (this.getCurrentLayer() as this | null) ?? this;
    if (resolutionId !== layer.state.resolutionId || rasterSet !== layer.state.rasterSet) {
      return;
    }
    const projectedCRS =
      descriptor?.coordinateFrame === 'projected'
        ? {identifier, converter: descriptor.converter.WGS84}
        : null;
    layer.setState({projectedCRS});
    layer.requestRaster(layer.context.viewport, 0);
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
    const {projectedCRS} = this.state;
    if (rendering === 'gpu' && raster.bandCount === 1) {
      const placement =
        bitmapLayerProps?.bounds && bitmapLayerProps.coordinateSystem !== undefined
          ? {bounds: bitmapLayerProps.bounds, coordinateSystem: bitmapLayerProps.coordinateSystem}
          : getRasterBitmapPlacement(raster, parameters, metadata, projectedCRS);
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
      const renderResult = createRasterRenderResult(
        request,
        metadata,
        colorizeRaster,
        projectedCRS
      );
      this.setState({renderResult, gpuResult: null});
    }
  }

  /** Requests the current viewport with source-specific parameter overrides. */
  private requestRaster(
    viewport: Viewport,
    debounceTime = this.props.debounceTime,
    metadata = this.state.metadata
  ): void {
    const {rasterSet, projectedCRS} = this.state;
    if (!rasterSet || !metadata || !viewport || projectedCRS === undefined) {
      return;
    }
    const {getRasterParameters, maxTextureSize} = this.props;
    const rasterViewport =
      projectedCRS && viewport.isGeospatial && !getRasterParameters
        ? createProjectedRasterViewport(viewport, metadata, projectedCRS, maxTextureSize)
        : createRasterViewport(viewport, metadata, maxTextureSize, Boolean(getRasterParameters));
    if (!rasterViewport) {
      // Nothing visible to request: report the layer as loaded instead of waiting forever.
      if (!this.state.projectedSourceOffscreen) {
        this.setState({projectedSourceOffscreen: true});
      }
      return;
    }
    if (this.state.projectedSourceOffscreen) {
      this.setState({projectedSourceOffscreen: false});
    }
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
      projectedCRS: null,
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
  metadata: RasterSourceMetadata,
  projectedCRS?: ProjectedRasterCRS | null
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
  const placement = getRasterBitmapPlacement(raster, parameters, metadata, projectedCRS);
  const image = colorizeRasterData(rasterWithBandMetadata);
  return {
    ...placement,
    // deck.gl v10 reads the texture dimensions from the image payload for mipmap allocation.
    image:
      projectedCRS &&
      placement.coordinateSystem === projectedCRS.identifier &&
      typeof ImageData !== 'undefined'
        ? new ImageData(image.data as Uint8ClampedArray<ArrayBuffer>, image.width, image.height)
        : image
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
  metadata: RasterSourceMetadata,
  projectedCRS?: ProjectedRasterCRS | null
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
  let coordinateSystem: CoordinateSystem = rasterCoordinateReferenceSystem ? 'lnglat' : 'cartesian';
  if (rasterCoordinateReferenceSystem && !isBuiltInRasterCRS(rasterCoordinateReferenceSystem)) {
    if (rasterCoordinateReferenceSystem !== projectedCRS?.identifier) {
      throw new Error(
        `RasterSourceLayer requires explicit bounds and coordinateSystem for an unsupported source CRS (${rasterCoordinateReferenceSystem}).`
      );
    }
    coordinateSystem = rasterCoordinateReferenceSystem;
  }
  const mercator = rasterCoordinateReferenceSystem === 'EPSG:3857';
  const bounds = raster.transform
    ? getAffineBitmapBounds(raster, mercator)
    : mercator
      ? unprojectPseudoMercatorBounds(rasterBounds!)
      : flattenBounds(rasterBounds!);
  return {bounds, coordinateSystem};
}

/** Applies custom raster colorization while retaining inferred placement defaults. */
export function createRasterRenderResult(
  request: RasterSetRequest,
  metadata: RasterSourceMetadata,
  colorizeRaster?: RasterSourceLayerProps['colorizeRaster'],
  projectedCRS?: ProjectedRasterCRS | null
): RasterRenderResult {
  const customRenderResult = colorizeRaster?.(request.raster, {metadata, request});
  if (customRenderResult?.bounds && customRenderResult.coordinateSystem !== undefined)
    return customRenderResult;
  const defaultRenderResult = createDefaultRasterRenderResult(
    request.raster,
    request.parameters,
    metadata,
    projectedCRS
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
      (!coordinateReferenceSystem || !isBuiltInRasterCRS(coordinateReferenceSystem)) &&
      !allowCustomProjection
    ) {
      throw new Error(
        `RasterSourceLayer cannot infer viewport reprojection for ${
          coordinateReferenceSystem || 'the declared CRS'
        }. Provide getRasterParameters() to request bounds in the source CRS.`
      );
    }
  }

  return createRasterViewportForBounds(viewport, bounds, coordinateReferenceSystem, maxTextureSize);
}

/** Maps screen samples into the source CRS and fits square pixels within the texture budget. */
function createProjectedRasterViewport(
  viewport: Viewport,
  metadata: RasterSourceMetadata,
  {identifier, converter}: ProjectedRasterCRS,
  maxTextureSize = 1024
): RasterViewport | null {
  const bounds = getProjectedViewportBounds(viewport, converter, metadata.boundingBox);
  if (!bounds) {
    return null;
  }

  const rasterViewport = createRasterViewportForBounds(
    viewport,
    bounds,
    identifier,
    maxTextureSize
  );
  const width = bounds[1][0] - bounds[0][0];
  const height = bounds[1][1] - bounds[0][1];
  const unitsPerPixel = Math.max(width / rasterViewport.width, height / rasterViewport.height);
  return {
    ...rasterViewport,
    width: Math.max(1, Math.round(width / unitsPerPixel)),
    height: Math.max(1, Math.round(height / unitsPerPixel)),
    project: coordinates => viewport.project(converter.to(coordinates)),
    unprojectPosition: position => {
      const [sourceX, sourceY, elevation] = converter.from(viewport.unprojectPosition(position));
      return [sourceX, sourceY, elevation];
    }
  };
}

/** A screen position and its source coordinates when it maps to visible ground. */
type ProjectedViewportSample = {
  /** Position in viewport pixels. */
  screenPosition: [number, number];
  /** Position in the source CRS, or null for a rejected sample. */
  sourcePosition: [number, number] | null;
};

/** Samples a 9×9 screen grid, refines validity boundaries, and clips to the source extent. */
function getProjectedViewportBounds(
  viewport: Viewport,
  converter: CRSConverter,
  sourceBounds?: RasterBoundingBox
): RasterBoundingBox | null {
  let minimumX = Infinity;
  let minimumY = Infinity;
  let maximumX = -Infinity;
  let maximumY = -Infinity;
  const steps = 8;
  const screenTolerance = 0.5;

  /** Maps a screen sample to the source CRS when it round-trips in front of the camera. */
  function sampleScreenPosition(screenPosition: [number, number]): [number, number] | null {
    const [longitude, latitude] = viewport.unproject(screenPosition);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return null;
    }
    const groundPosition = [longitude, latitude];
    const [commonX, commonY, commonZ] = viewport.projectPosition(groundPosition);
    const matrix = viewport.viewProjectionMatrix;
    // Perspective division can map a behind-camera point back to the same pixel.
    const clipSpaceW =
      matrix[3] * commonX + matrix[7] * commonY + matrix[11] * commonZ + matrix[15];
    if (!Number.isFinite(clipSpaceW) || clipSpaceW <= 0) {
      return null;
    }
    const [projectedX, projectedY] = viewport.project(groundPosition);
    const screenError = Math.hypot(projectedX - screenPosition[0], projectedY - screenPosition[1]);
    if (!Number.isFinite(screenError) || screenError > screenTolerance) {
      return null;
    }
    try {
      const [sourceX, sourceY] = converter.from(groundPosition);
      return Number.isFinite(sourceX) && Number.isFinite(sourceY) ? [sourceX, sourceY] : null;
    } catch {
      // Some projection kernels throw for points outside their domain.
      return null;
    }
  }

  /** Expands the bounds to include a source position. */
  function includeSourcePosition([sourceX, sourceY]: [number, number]): void {
    minimumX = Math.min(minimumX, sourceX);
    minimumY = Math.min(minimumY, sourceY);
    maximumX = Math.max(maximumX, sourceX);
    maximumY = Math.max(maximumY, sourceY);
  }

  /** Bisects a mixed-validity interval and includes the valid endpoint nearest the boundary. */
  function refineBoundary(first: ProjectedViewportSample, second: ProjectedViewportSample): void {
    const validSample = first.sourcePosition ? first : second;
    const rejectedSample = validSample === first ? second : first;
    let sourcePosition = validSample.sourcePosition;
    if (!sourcePosition || rejectedSample.sourcePosition) {
      return;
    }

    let validPosition = validSample.screenPosition;
    let rejectedPosition = rejectedSample.screenPosition;
    for (let iteration = 0; iteration < 12; iteration++) {
      const deltaX = rejectedPosition[0] - validPosition[0];
      const deltaY = rejectedPosition[1] - validPosition[1];
      if (Math.hypot(deltaX, deltaY) < screenTolerance) {
        break;
      }
      const midpoint: [number, number] = [
        validPosition[0] + deltaX / 2,
        validPosition[1] + deltaY / 2
      ];
      const midpointSourcePosition = sampleScreenPosition(midpoint);
      if (midpointSourcePosition) {
        validPosition = midpoint;
        sourcePosition = midpointSourcePosition;
      } else {
        rejectedPosition = midpoint;
      }
    }
    includeSourcePosition(sourcePosition);
  }

  let previousRow: ProjectedViewportSample[] = [];
  for (let row = 0; row <= steps; row++) {
    const currentRow: ProjectedViewportSample[] = [];
    for (let column = 0; column <= steps; column++) {
      const screenPosition: [number, number] = [
        (viewport.width * column) / steps,
        (viewport.height * row) / steps
      ];
      const sourcePosition = sampleScreenPosition(screenPosition);
      const sample = {screenPosition, sourcePosition};
      if (sourcePosition) {
        includeSourcePosition(sourcePosition);
      }
      if (column > 0) {
        refineBoundary(currentRow[column - 1], sample);
      }
      if (row > 0) {
        refineBoundary(previousRow[column], sample);
      }
      currentRow.push(sample);
    }
    previousRow = currentRow;
  }
  if (sourceBounds) {
    minimumX = Math.max(minimumX, sourceBounds[0][0]);
    minimumY = Math.max(minimumY, sourceBounds[0][1]);
    maximumX = Math.min(maximumX, sourceBounds[1][0]);
    maximumY = Math.min(maximumY, sourceBounds[1][1]);
  }
  return minimumX < maximumX && minimumY < maximumY
    ? [
        [minimumX, minimumY],
        [maximumX, maximumY]
      ]
    : null;
}

/** Identifies the CRS values with established request and placement paths. */
function isBuiltInRasterCRS(identifier: string): boolean {
  return identifier === 'EPSG:3857' || /^(EPSG:4326|CRS:84|OGC:CRS84)$/i.test(identifier);
}

/** Builds a source viewport using computed bounds and the device pixel budget. */
function createRasterViewportForBounds(
  viewport: Viewport,
  bounds: RasterBoundingBox | undefined,
  coordinateReferenceSystem: string | undefined,
  maxTextureSize: number
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
    getBounds: bounds ? () => flattenBounds(bounds) : undefined,
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
