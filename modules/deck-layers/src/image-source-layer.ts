// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type Layer,
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
  Source
} from '@loaders.gl/loader-utils';
import {ImageSet, type ImageSetRequest} from '@loaders.gl/tiles';
import {projectWGS84ToPseudoMercator} from './image-source-layer/utils';

type ImageSourceLayerData = string | Blob | ImageSource;

/** Props for {@link ImageSourceLayer}. */
export type ImageSourceLayerProps = CompositeLayerProps & {
  /** URL/blob input or a fully constructed loaders.gl image source. */
  data: ImageSourceLayerData;
  /** Optional source type hint when resolving URL/blob inputs. */
  serviceType?: 'wms' | 'auto';
  /** Layers forwarded to `getImage`. */
  layers?: string[];
  /** Output CRS for the requested image. */
  srs?: 'EPSG:4326' | 'EPSG:3857' | 'auto';
  /** Debounce interval applied before viewport image requests are issued. */
  debounceTime?: number;
  /** Source factories used to auto-create image sources from URL/blob inputs. */
  sources?: Readonly<Source[]>;
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
};

type ImageSourceLayerState = {
  resolvedData: ImageSource | null;
  imageSet: ImageSet | null;
  unsubscribeImageSetEvents: (() => void) | null;
};

const defaultProps: DefaultProps<ImageSourceLayerProps> = {
  id: 'image-source-layer',
  data: '',
  serviceType: 'auto',
  srs: 'auto',
  debounceTime: 200,
  layers: {type: 'array', compare: true, value: []},
  sources: {type: 'array', compare: false, value: []},
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
  onLoadingStateChange: {type: 'function', value: () => {}}
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
      imageSet: null,
      unsubscribeImageSetEvents: null
    };
  }

  /** Finalizes subscriptions and owned resources. */
  finalizeState(): void {
    this._releaseImageSet();
  }

  /** Keeps the image manager in sync with current props and viewport. */
  updateState({changeFlags, props, oldProps}: UpdateParameters<this>): void {
    const dataChanged =
      changeFlags.dataChanged ||
      props.sources !== oldProps.sources ||
      props.sourceOptions !== oldProps.sourceOptions ||
      props.serviceType !== oldProps.serviceType;

    if (dataChanged) {
      const resolvedData = this._resolveData(props);
      const previousResolvedData = this.state.resolvedData;
      this.setState({resolvedData});

      if (!resolvedData) {
        this._releaseImageSet();
        return;
      }

      const imageSet = this._getOrCreateImageSet(
        resolvedData,
        resolvedData !== previousResolvedData
      );
      imageSet.setOptions({imageSource: resolvedData});
      void imageSet.loadMetadata().catch(() => {});
      this.loadImage(this.context.viewport, 0);
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
      this.loadImage(this.context.viewport, 0);
    } else if (changeFlags.viewportChanged) {
      this.loadImage(this.context.viewport);
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
    const {layers, serviceType} = this.props;
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
  private _resolveData(props: ImageSourceLayerProps): ImageSource | null {
    const {data, sources, sourceOptions} = props;

    if (this._isImageSource(data)) {
      return data;
    }

    if ((typeof data === 'string' || data instanceof Blob) && sources?.length) {
      return createDataSource(data, sources, {
        ...sourceOptions,
        core: {
          ...sourceOptions?.core,
          type: props.serviceType,
          loadOptions: props.loadOptions || sourceOptions?.core?.loadOptions
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
      unsubscribeImageSetEvents: null
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
      layers: this.props.layers || [],
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
