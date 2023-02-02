// Copyright 2022 Foursquare Labs, Inc. All Rights Reserved.

import {Layer, CompositeLayer, CompositeLayerProps, UpdateParameters, DefaultProps, LayerProps} from '@deck.gl/core/typed';
import {BitmapLayer} from '@deck.gl/layers/typed';
import {WMSService, WMSCapabilities} from '@loaders.gl/wms';

export type ImageryLayerProps = CompositeLayerProps<string> & {
  serviceUrl: string;
  layers: string[];
  onCapabilitiesLoadStart: () => void;
  onCapabilitiesLoadComplete: (capabilities: WMSCapabilities) => void;
  onImageLoadStart: () => void;
  onImageLoadComplete: () => void;
};

const defaultProps: ImageryLayerProps = {
  id: 'imagery-layer',
  // TODO - we shouldn't have a random default
  serviceUrl: `https://ows.terrestris.de/osm/service`,
  layers: ['OSM-WMS'],
  onCapabilitiesLoadStart: () => {},
  onCapabilitiesLoadComplete: () => {},
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
    // Request capabilities
    this.state.imageService = new WMSService({url: this.props.serviceUrl});
  }

  /*override*/ updateState({changeFlags, props, oldProps}: UpdateParameters<this>): void {
    if (changeFlags.propsChanged && props.serviceUrl !== oldProps.serviceUrl) {
      console.log('update props', changeFlags.viewportChanged);

      this.state.imageService = new WMSService({url: this.props.serviceUrl});
      this.props.onCapabilitiesLoadStart();
      this.state.imageService.getCapabilities().then(capabilities => {
        this.state.capabilities = capabilities;
        this.props.onCapabilitiesLoadComplete(capabilities);
      });
      // this.buildBitmapLayer('props changed')

    } else if (changeFlags.viewportChanged) {
      console.log('update viewport', changeFlags.viewportChanged);

      debounce(() => this.buildBitmapLayer('state changed'));

    }
  }

  /*override*/ renderLayers(): Layer {
    console.log('renderlayers');
    // TODO - which bitmap layer is rendered should depend on the current viewport
    // Currently Studio only uses one viewport
    return this.state.bitmapLayer;
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
    const imageService = this.state.imageService as WMSService;

    let image;
    
    try {
      image = await imageService.getMap({width, height, bbox: bounds, layers: this.props.layers});
    } catch (error) {
      this.context.onError?.(error, this);
      // throw error;
    }
    
    this.props.onImageLoadComplete();

    const layer = new BitmapLayer({
      ...this.getSubLayerProps({id: 'bitmap'}),
      bounds,
      image,
      loaders: imageService.loaders,
      onClick: ({bitmap, layer}) => {
        if (bitmap) {
          const x = bitmap.pixel[0];
          const y = bitmap.pixel[1];
          debounce(async () => {
            const featureInfo = await imageService.getFeatureInfo({
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

    this.state.bitmapLayer = layer;
    this.setNeedsRedraw();
  }
}

let timeoutId;
function debounce(fn: Function, ms = 500): void {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => fn(), ms);
}

