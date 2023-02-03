// Copyright 2022 Foursquare Labs, Inc. All Rights Reserved.

import {Layer, CompositeLayer, CompositeLayerProps, UpdateParameters, DefaultProps} from '@deck.gl/core/typed';
import {BitmapLayer} from '@deck.gl/layers/typed';
import {WMSService} from '@loaders.gl/wms';
import type {_ImageSourceMetadata as ImageSourceMetadata} from '@loaders.gl/wms';
import {_ImageSource as ImageSource, _AdHocImageService as AdHocImageService} from '@loaders.gl/wms';

export type ImageryLayerProps = CompositeLayerProps<string> & {
  service: string | ImageSource;
  serviceType?: 'wms' | 'template';
  layers: string[];
  onMetadataLoadStart: () => void;
  onMetadataLoadComplete: (metadata: ImageSourceMetadata) => void;
  onImageLoadStart: () => void;
  onImageLoadComplete: () => void;
};

type ImageryLayerState = {
  imageSource: ImageSource;
  bitmapLayer: BitmapLayer;
  metadata: ImageSourceMetadata;
};


const defaultProps: ImageryLayerProps = {
  id: 'imagery-layer',
  // TODO - we shouldn't have a random default
  service: undefined!,
  serviceType: 'wms',
  layers: undefined!,
  onMetadataLoadStart: () => {},
  onMetadataLoadComplete: () => {},
  onImageLoadStart: () => {}, 
  onImageLoadComplete: () => {}
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
    if (changeFlags.propsChanged && props.service !== oldProps.service) {
      console.log('update props', changeFlags.viewportChanged);

      const state = this.state as ImageryLayerState;
      state.imageSource = createImageSource(this.props);
      this._initializeImageSource();
      debounce(() => this.buildBitmapLayer('props changed'), 0);

    } else if (changeFlags.viewportChanged) {
      console.log('update viewport', changeFlags.viewportChanged);

      debounce(() => this.buildBitmapLayer('state changed'));

    }
  }

  /*override*/ renderLayers(): Layer {
    console.log('renderlayers');
    // TODO - which bitmap layer is rendered should depend on the current viewport
    // Currently Studio only uses one viewport
    const state = this.state as ImageryLayerState;
    return state.bitmapLayer;
  }

  async buildBitmapLayer(reason: string): Promise<void> {
    // const viewports = deckInstance.getViewports();
    const viewports = this.context.deck?.getViewports() || [];
    if (viewports.length <= 0) {
      return;
    }

    const viewport = viewports[0];
    const bounds = viewport.getBounds();
    const {width, height} = viewport;

    this.props.onImageLoadStart();

    // TODO - need types on the layer state
    const state = this.state as ImageryLayerState;
    const imageSource = state.imageSource;

    let image;
    
    try {
      image = await imageSource.getImage({width, height, bbox: bounds, layers: this.props.layers});
    } catch (error) {
      this.context.onError?.(error, this);
      // throw error;
    }
    
    this.props.onImageLoadComplete();

    const layer = new BitmapLayer({
      ...this.getSubLayerProps({id: 'bitmap'}),
      bounds,
      image,
      pickable: true, // TODO inherited?
      onHover: (info) => {
        console.log('hover in bitmap layer', info);
      },
      onClick: (info) => {
        const {bitmap, layer} = info;
        console.log('click in bitmap layer', info);
        if (bitmap) {
          const x = bitmap.pixel[0];
          const y = bitmap.pixel[1];
          debounce(async () => {
            const featureInfo = await imageSource.getFeatureInfo({
              layers: this.props.layers,
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

    state.bitmapLayer = layer;
    this.setNeedsRedraw();
  }

  // HELPERS

  /** Run a getMetadata on the image service */
  async _initializeImageSource(): Promise<void> {
    this.props.onMetadataLoadStart();
    const state = this.state as ImageryLayerState;
    try {
      state.metadata = await state.imageSource.getMetadata();
      // technically we should get the latest layer after an async operation in case props have changed
      // Although the response might no longer be expected
      this.getCurrentLayer()?.props.onMetadataLoadComplete(state.metadata);
    } catch (error) {
      console.error(error);
    }
  }
}

/** Creates an image service if appropriate */
function createImageSource(props: ImageryLayerProps): ImageSource {
  if (typeof props.service === 'string') {
    switch (props.serviceType) {
      case 'template':
        return new AdHocImageService({templateUrl: props.service});
      case 'wms':
      default: // currently only wms service supported
        return new WMSService({serviceUrl: props.service})
    }
  } else {
    return props.service;
  }
}



let timeoutId;
function debounce(fn: Function, ms = 500): void {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => fn(), ms);
}
