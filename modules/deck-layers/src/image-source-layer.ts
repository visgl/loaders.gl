// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type Layer,
  type LayerContext,
  type UpdateParameters,
  type Viewport,
  COORDINATE_SYSTEM,
  _deepEqual as deepEqual
} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import {createDataSource} from '@loaders.gl/core';
import type {
  DataSourceOptions,
  GetImageParameters,
  ImageSource,
  ImageSourceMetadata,
  Loader,
  SourceLoader
} from '@loaders.gl/loader-utils';
import {isSourceLoader} from '@loaders.gl/loader-utils';
import {ImageSet, type ImageSetRequest} from '@loaders.gl/tiles';
import {projectWGS84ToPseudoMercator} from './image-source-layer/utils';
import {
  finalizeOwnedSource,
  getFirstSourceLayerName,
  resolveVisualSource,
  type ResolvedVisualSource
} from './source-layer-utils';

type ImageSourceLayerData = string | Blob | ImageSource;

/** Props for {@link ImageSourceLayer}. */
export type ImageSourceLayerProps = Omit<CompositeLayerProps, 'data' | 'loaders'> & {
  /** URL/blob input or a fully constructed loaders.gl image source. */
  data: ImageSourceLayerData;
  /** Optional source type hint when resolving URL/blob inputs. */
  serviceType?: 'wms' | 'auto';
  /** Layers forwarded to `getImage`. */
  layers?: string[] | 'auto';
  /** Output CRS for the requested image. */
  srs?: 'EPSG:4326' | 'EPSG:3857' | 'auto';
  /** Debounce interval applied before viewport image requests are issued. */
  debounceTime?: number;
  /** Source factories used to auto-create image sources from URL/blob inputs. */
  sources?: Readonly<SourceLoader[]>;
  /** Parser loaders and SourceLoaders used to resolve URL/blob inputs. */
  loaders?: ReadonlyArray<Loader | SourceLoader>;
  /** Options forwarded to `createDataSource` when `sources` are supplied. */
  sourceOptions?: DataSourceOptions;
  /** Called when metadata resolves successfully. */
  onMetadataLoad?: (metadata: ImageSourceMetadata) => void;
  /** Called when metadata loading fails. */
  onMetadataLoadError?: (error: Error) => void;
  /** Called when an image request is issued. */
  onImageLoadStart?: (requestId: number) => void;
  /** Called when an image request resolves and becomes current. */
  onImageLoad?: (requestId: number) => void;
  /** Called when an image request fails. */
  onImageLoadError?: (requestId: number, error: Error) => void;
  /** Called when metadata/image loading starts or stops. */
  onLoadingStateChange?: (isLoading: boolean) => void;
  /** Called when URL/Blob source resolution fails. */
  onSourceError?: (error: Error) => void;
};

type ImageSourceLayerState = {
  resolvedData: ImageSource | null;
  resolvedSource: ResolvedVisualSource | null;
  resolvedLayers: string[];
  imageSet: ImageSet | null;
  unsubscribeImageSetEvents: (() => void) | null;
};

const defaultProps: DefaultProps<ImageSourceLayerProps> = {
  id: 'image-source-layer',
  data: '',
  serviceType: 'auto',
  srs: 'auto',
  debounceTime: 200,
  layers: 'auto',
  sources: {type: 'array', compare: false, value: []},
  loaders: {type: 'array', compare: false, value: []},
  sourceOptions: {type: 'object', compare: false, value: {}},
  onMetadataLoad: {type: 'function', value: () => {}},
  onMetadataLoadError: {
    type: 'function',
    // eslint-disable-next-line no-console
    value: console.error
  },
  onImageLoadStart: {type: 'function', value: () => {}},
  onImageLoad: {type: 'function', value: () => {}},
  onImageLoadError: {
    type: 'function',
    compare: false,
    value: (requestId: number, error: Error) => {
      // eslint-disable-next-line no-console
      console.error(error, requestId);
    }
  },
  onLoadingStateChange: {type: 'function', value: () => {}},
  onSourceError: {type: 'function', value: () => {}}
};

/**
 * Internal deck.gl layer that renders loaders.gl image sources through a shared image manager.
 *
 * This class is exported for internal repository use and examples, and is not documented
 * beyond these TSDoc comments.
 */
export class ImageSourceLayer extends CompositeLayer<ImageSourceLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'ImageSourceLayer';

  /** Default props shared across source-backed image layers. */
  static defaultProps: DefaultProps = defaultProps;

  /** Typed deck.gl state for resolved source and image manager lifecycle. */
  state = null as unknown as ImageSourceLayerState;

  private resolutionId = 0;

  /** Creates an image source layer with mixed parser and source loader support. */
  constructor(props: ImageSourceLayerProps) {
    super(props as any);
  }

  /** Returns true when the current image manager is idle and has a current image. */
  get isLoaded(): boolean {
    return Boolean(this.state?.imageSet?.isLoaded) && super.isLoaded;
  }

  /** Lets deck.gl know that we want viewport change events. */
  shouldUpdateState(): boolean {
    return true;
  }

  /** Initializes state on first render. */
  initializeState(): void {
    this.state = {
      resolvedData: null,
      resolvedSource: null,
      resolvedLayers: [],
      imageSet: null,
      unsubscribeImageSetEvents: null
    };
  }

  /** Finalizes subscriptions and owned resources. */
  finalizeState(context: LayerContext): void {
    this.resolutionId++;
    this._releaseImageSet();
    if (this.state.resolvedSource?.owned) {
      void finalizeOwnedSource(this.state.resolvedSource.source);
    }
    super.finalizeState(context);
  }

  /** Keeps the image manager in sync with current props and viewport. */
  updateState({changeFlags, props, oldProps}: UpdateParameters<this>): void {
    const dataChanged =
      changeFlags.dataChanged ||
      (changeFlags.propsChanged &&
        (props.sources !== oldProps.sources ||
          props.loaders !== oldProps.loaders ||
          props.sourceOptions !== oldProps.sourceOptions ||
          props.serviceType !== oldProps.serviceType));

    if (dataChanged) {
      void this.resolveImageSource(props);
      return;
    }

    if (!this.state.imageSet) {
      return;
    }

    if (
      !deepEqual(props.layers, oldProps.layers, 1) ||
      props.debounceTime !== oldProps.debounceTime ||
      props.srs !== oldProps.srs
    ) {
      this.state.imageSet.setOptions({
        imageSource: this.state.resolvedData,
        debounceTime: props.debounceTime
      });
      if (props.layers !== 'auto' && props.layers !== undefined) {
        this.setState({resolvedLayers: props.layers});
      }
      this.loadImage(this.context.viewport, 0);
    } else if (changeFlags.viewportChanged) {
      this.loadImage(this.context.viewport);
    }
  }

  private async resolveImageSource(props: ImageSourceLayerProps): Promise<void> {
    const resolutionId = ++this.resolutionId;
    const previousSource = this.state.resolvedSource;
    try {
      const resolvedSource = await resolveVisualSource({
        ...props,
        sourceOptions: {
          ...props.sourceOptions,
          core: {
            ...props.sourceOptions?.core,
            type:
              props.serviceType && props.serviceType !== 'auto'
                ? props.serviceType
                : props.sourceOptions?.core?.type
          }
        }
      });
      if (resolvedSource.sourceType !== 'image') {
        if (resolvedSource.owned) {
          await finalizeOwnedSource(resolvedSource.source);
        }
        throw new Error(
          `ImageSourceLayer expected an image source but resolved ${resolvedSource.sourceType}.`
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

      const resolvedData = resolvedSource.source as ImageSource;
      const previousResolvedData = this.state.resolvedData;
      this.setState({resolvedData, resolvedSource});
      const imageSet = this._getOrCreateImageSet(
        resolvedData,
        resolvedData !== previousResolvedData
      );
      imageSet.setOptions({imageSource: resolvedData});
      void imageSet
        .loadMetadata()
        .then(metadata => {
          if (this.state.imageSet !== imageSet) {
            return;
          }
          if (props.layers === 'auto' || props.layers === undefined) {
            const layerName = getFirstSourceLayerName(metadata);
            this.setState({resolvedLayers: layerName ? [layerName] : []});
          }
          this.loadImage(this.context.viewport, 0);
        })
        .catch(() => {});
      if (props.layers !== 'auto' && props.layers !== undefined) {
        this.setState({resolvedLayers: props.layers});
        this.loadImage(this.context.viewport, 0);
      }
    } catch (error) {
      if (resolutionId === this.resolutionId) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        this.props.onSourceError?.(normalizedError);
        this.raiseError(normalizedError, 'resolving image source');
      }
    }
  }

  /** Renders the current accepted image through `BitmapLayer`. */
  renderLayers(): Layer | null {
    const {imageSet} = this.state;
    const currentRequest = imageSet?.currentRequest;

    if (!currentRequest) {
      return null;
    }

    const {
      image,
      parameters: {boundingBox, crs}
    } = currentRequest;
    const bounds = [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]] as [
      number,
      number,
      number,
      number
    ];

    return new BitmapLayer({
      ...this.getSubLayerProps({id: 'bitmap'}),
      _imageCoordinateSystem:
        crs === 'EPSG:4326' ? COORDINATE_SYSTEM.LNGLAT : COORDINATE_SYSTEM.CARTESIAN,
      bounds,
      image
    }) as unknown as Layer;
  }

  /** Forwards WMS feature info requests using the last accepted image request parameters. */
  async getFeatureInfoText(x: number, y: number): Promise<string | null> {
    const imageSet = this.state.imageSet;
    const currentRequest = imageSet?.currentRequest;
    const imageSource = imageSet?.imageSource as ImageSource & {
      getFeatureInfoText?: (parameters: Record<string, unknown>) => Promise<string>;
    };

    if (currentRequest?.parameters && imageSource?.getFeatureInfoText) {
      const {boundingBox, layers, width, height, crs} = currentRequest.parameters;
      return await imageSource.getFeatureInfoText({
        x,
        y,
        width,
        height,
        layers,
        query_layers: Array.isArray(layers) ? layers : [layers],
        boundingBox,
        crs,
        info_format: 'application/vnd.ogc.gml'
      });
    }

    return '';
  }

  /** Builds and issues an image request for the active viewport. */
  loadImage(viewport: Viewport, debounceTime?: number): void {
    const {serviceType} = this.props;
    const layers = this.state.resolvedLayers || normalizeImageLayers(this.props.layers);
    const imageSet = this.state.imageSet;

    if (!imageSet || !viewport) {
      return;
    }

    if (serviceType === 'wms' && layers && layers.length === 0) {
      return;
    }

    const requestParameters = this._getImageParameters(viewport);
    imageSet.requestImage(requestParameters, debounceTime);
  }

  /** Resolves URL/blob inputs to concrete image sources. */
  _resolveData(props: ImageSourceLayerProps): ImageSource | null {
    const {data, sources, sourceOptions, loaders = []} = props;

    if (this._isImageSource(data)) {
      return data;
    }

    const sourceLoaders = Array.from(
      new Set([...(sources || []), ...loaders.filter(isSourceLoader)])
    );
    const parserLoaders = loaders.filter(loader => !isSourceLoader(loader));
    if ((typeof data === 'string' || data instanceof Blob) && sourceLoaders.length) {
      return createDataSource(data, sourceLoaders, {
        ...sourceOptions,
        core: {
          ...sourceOptions?.core,
          type: props.serviceType,
          loadOptions: props.loadOptions || sourceOptions?.core?.loadOptions,
          loaders: [...(sourceOptions?.core?.loaders || []), ...parserLoaders]
        }
      }) as unknown as ImageSource;
    }

    if (data instanceof Blob) {
      throw new Error('ImageSourceLayer requires `sources` to resolve Blob inputs');
    }

    if (typeof data === 'string') {
      throw new Error('ImageSourceLayer requires `sources` to resolve string inputs');
    }

    return null;
  }

  /** Creates or reuses the shared image manager for the current source. */
  private _getOrCreateImageSet(imageSource: ImageSource, sourceChanged: boolean): ImageSet {
    if (!this.state.imageSet || sourceChanged) {
      this._releaseImageSet();

      const imageSet = ImageSet.fromImageSource(imageSource);
      imageSet.setOptions({imageSource, debounceTime: this.props.debounceTime});
      const unsubscribeImageSetEvents = imageSet.subscribe({
        onLoadingStateChange: isLoading => this.props.onLoadingStateChange?.(isLoading),
        onMetadataLoad: metadata => this.props.onMetadataLoad?.(metadata),
        onMetadataLoadError: error => this.props.onMetadataLoadError?.(error),
        onImageLoadStart: requestId => this.props.onImageLoadStart?.(requestId),
        onImageLoad: ({requestId}: ImageSetRequest) => {
          this.props.onImageLoad?.(requestId);
          this.setNeedsUpdate();
        },
        onImageLoadError: (requestId, error) => this.props.onImageLoadError?.(requestId, error),
        onUpdate: () => this.setNeedsUpdate()
      });

      this.setState({imageSet, unsubscribeImageSetEvents});
      return imageSet;
    }

    return this.state.imageSet;
  }

  /** Tears down subscriptions and image manager state. */
  private _releaseImageSet(): void {
    this.state?.unsubscribeImageSetEvents?.();
    this.state?.imageSet?.finalize();
    this.setState?.({
      imageSet: null,
      unsubscribeImageSetEvents: null,
      resolvedLayers: []
    });
  }

  /** Derives image request parameters from the active deck.gl viewport. */
  private _getImageParameters(viewport: Viewport): GetImageParameters {
    const bounds = viewport.getBounds();
    const {width, height} = viewport;
    let resolvedSrs = this.props.srs;

    if (resolvedSrs === 'auto') {
      resolvedSrs = viewport.resolution ? 'EPSG:4326' : 'EPSG:3857';
    }

    const boundingBox: [[number, number], [number, number]] = [
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]]
    ];

    if (resolvedSrs === 'EPSG:3857') {
      boundingBox[0] = projectWGS84ToPseudoMercator([bounds[0], bounds[1]]);
      boundingBox[1] = projectWGS84ToPseudoMercator([bounds[2], bounds[3]]);
    }

    return {
      width,
      height,
      boundingBox,
      layers: this.state?.resolvedLayers || normalizeImageLayers(this.props.layers),
      crs: resolvedSrs
    };
  }

  /** Detects whether a resolved `data` value is a loaders.gl image source. */
  private _isImageSource(value: unknown): value is ImageSource {
    return Boolean(
      value &&
        typeof value === 'object' &&
        'getMetadata' in value &&
        'getImage' in value &&
        !('getTileData' in value)
    );
  }
}

function normalizeImageLayers(layers: string[] | 'auto' | undefined): string[] {
  return Array.isArray(layers) ? layers : [];
}
