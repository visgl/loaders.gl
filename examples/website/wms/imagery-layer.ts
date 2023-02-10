// Copyright 2022 Foursquare Labs, Inc. All Rights Reserved.

import {Layer, CompositeLayer, CompositeLayerProps, UpdateParameters, DefaultProps} from '@deck.gl/core/typed';
import {BitmapLayer} from '@deck.gl/layers/typed';
import {WMSService} from '@loaders.gl/wms';
import type {_ImageSourceMetadata as ImageSourceMetadata} from '@loaders.gl/wms';
import {_ImageSource as ImageSource, _AdHocImageService as AdHocImageService} from '@loaders.gl/wms';

export type ImageryLayerProps = CompositeLayerProps<string | ImageSource> & {
  serviceType?: 'wms' | 'template';
  layers: string[];
  onMetadataLoadStart: () => void;
  onMetadataLoadComplete: (metadata: ImageSourceMetadata) => void;
  onMetadataLoadError: (error: Error) => void;
  onImageLoadStart: (requestId: unknown) => void;
  onImageLoadComplete: (requestId: unknown) => void;
  onImageLoadError: (requestId: unknown, error: Error) => void;
};

type ImageryLayerState = {
  imageSource: ImageSource;
  bitmapLayer: BitmapLayer;
  metadata: ImageSourceMetadata;
};

const defaultProps: ImageryLayerProps = {
  id: 'imagery-layer',
  data: undefined!,
  serviceType: 'wms',
  layers: undefined!,
  onMetadataLoadStart: () => {},
  onMetadataLoadComplete: () => {},
  onMetadataLoadError: (error: Error) => console.error(error),
  onImageLoadStart: () => {}, 
  onImageLoadComplete: () => {},
  onImageLoadError: (requestId: unknown, error: Error) => console.error(error, requestId)
};

/**
 * The layer is used in Hex Tile layer in order to properly discard invisible elements during animation
 */
export class ImageryLayer extends CompositeLayer<ImageryLayerProps> {
  static layerName = 'ImageryLayer';
  static defaultProps: DefaultProps<ImageryLayerProps> = defaultProps;

  /** We want resize events etc */
  /*override*/ shouldUpdateState(): boolean {
    return true;
  }

  /*override*/ initializeState(): void {
  }
  
  /*override*/ updateState({changeFlags, props, oldProps}: UpdateParameters<this>): void {
    const state = this.state as ImageryLayerState;

    if (changeFlags.propsChanged) {
      console.log('update props');

    const dataChanged =
      changeFlags.dataChanged ||
      (changeFlags.updateTriggersChanged &&
        (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged));


      // Check if data source has changed
      if (dataChanged) {
        state.imageSource = createImageSource(this.props);
        this._loadMetadata();
        debounce(() => this.loadImage('props changed'), 0);
      }

      // Some sublayer props may have changed
    }
    
    if (changeFlags.viewportChanged) {
      console.log('update viewport');
      debounce(() => this.loadImage('viewport changed'));
    }

    const propsChanged = changeFlags.propsOrDataChanged || changeFlags.updateTriggersChanged;
  }
  
  /*override*/ renderLayers(): Layer {
    console.log('renderlayers');

    // TODO - which bitmap layer is rendered should depend on the current viewport
    // Currently Studio only uses one viewport
    const state = this.state as ImageryLayerState;
    const {imageSource} = this.state;
    const {bounds, image, width, height} = this.state;

    return new BitmapLayer({
      ...this.getSubLayerProps({id: 'bitmap'}),
      bounds,
      image,
      pickable: true, // TODO inherited?
      onHover: (info) => console.log('hover in bitmap layer', info),
      onClick: (info) => {
        const {bitmap, layer} = info;
        console.log('click in bitmap layer', info);
        if (bitmap) {
          const x = bitmap.pixel[0];
          const y = bitmap.pixel[1];
          debounce(async () => {
            const featureInfo = await imageSource.getFeatureInfo({
              layers: this.props.layers,
              // todo image width may get out of sync with viewport width
              width,
              height,
              bbox: bounds,
              query_layers: this.props.layers,
              x,
              y,
              info_format: 'text/plain'
            })
            console.log(featureInfo);
          }, 0);
        }
      }
    });
  }

  /** Load an image */
  async loadImage(reason: string): Promise<void> {
    // const viewports = deckInstance.getViewports();
    const viewports = this.context.deck?.getViewports() || [];
    if (viewports.length <= 0) {
      return;
    }

    const viewport = viewports[0];
    const bounds = viewport.getBounds();
    const {width, height} = viewport;

    const state = this.state as ImageryLayerState;

    let requestId = getRequestId();

    try {
      this.props.onImageLoadStart(requestId);
      const image = await state.imageSource.getImage({width, height, bbox: bounds, layers: this.props.layers});
      this.getCurrentLayer()?.props.onImageLoadComplete(requestId);
      this.setNeedsRedraw();
    } catch (error) {
      this.context.onError?.(error, this);
      this.getCurrentLayer()?.props.onImageLoadError(requestId, error);
    }    
  }

  // HELPERS

  /** Run a getMetadata on the image service */
  async _loadMetadata(): Promise<void> {
    this.props.onMetadataLoadStart();
    const state = this.state as ImageryLayerState;
    try {
      state.metadata = await state.imageSource.getMetadata();
      // technically we should get the latest layer after an async operation in case props have changed
      // Although the response might no longer be expected
      this.getCurrentLayer()?.props.onMetadataLoadComplete(state.metadata);
    } catch (error) {
      this.getCurrentLayer()?.props.onMetadataLoadError(error);
    }
  }
}

/** Creates an image service if appropriate */
function createImageSource(props: ImageryLayerProps): ImageSource {
  if (typeof props.data === 'string') {
    switch (props.serviceType) {
      case 'template':
        return new AdHocImageService({templateUrl: props.data});
      case 'wms':
      default: // currently only wms service supported
        return new WMSService({serviceUrl: props.data})
    }
  }
  if (props.data instanceof ImageSource) {
    return props.data;
  }
  throw new Error('data props is not a valid image source');
}

let nextRequestId: number = 0;

/** Global counter for issuing unique request ids */
function getRequestId() {
  return nextRequestId++;
}

let timeoutId;

/** Runs an action in the future, cancels it if the new action is issued before it executes */
function debounce(fn: Function, ms = 500): void {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => fn(), ms);
}
