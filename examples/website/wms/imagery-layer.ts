// Copyright 2022 Foursquare Labs, Inc. All Rights Reserved.

import {Layer, CompositeLayer, CompositeLayerProps, UpdateParameters, DefaultProps, LayerProps} from '@deck.gl/core/typed';
import {BitmapLayer} from '@deck.gl/layers/typed';
import {WMSService, WMSCapabilities} from '@loaders.gl/wms';

export type ImageryLayerProps = CompositeLayerProps<string> & {
  serviceUrl: string;
  layers: string[];
  onCapabilitiesLoad: (capabilities: WMSCapabilities) => void;
};

const defaultProps: ImageryLayerProps = {
  id: 'imagery-layer',
  // TODO - we shouldn't have a random default
  serviceUrl: `https://ows.terrestris.de/osm/service`,
  layers: ['OSM-WMS'],
  onCapabilitiesLoad: () => {}
};

/**
 * The layer is used in Hex Tile layer in order to properly discard invisible elements during animation
 */
export class ImageryLayer extends CompositeLayer<ImageryLayerProps> {
  static layerName = 'ImageryLayer';
  static defaultProps: DefaultProps<ImageryLayerProps> = defaultProps;

  override shouldUpdateState(): boolean {
    return true;
  }

  override initializeState(): void {
    this.state.imageService = new WMSService({url: this.props.serviceUrl});

    // Request capabilities
    this.state.imageService.getCapabilities().then(capabilities => {
      this.state.capabilities = capabilities;
      document.title = capabilities.title || 'WMS';
      console.log(capabilities);
    });

    // TODO this gets repeated in update layer
    this.buildBitmapLayer('state changed');
  }

  override updateState({changeFlags, props, oldProps}: UpdateParameters<this>): void {
    console.log('updatestate', changeFlags.viewportChanged);
    if (changeFlags.viewportChanged) {
      debounce(() => this.buildBitmapLayer('state changed'));
    }
  }

  override renderLayers(): Layer {
    console.log('renderlayers');
    // TODO - which bitmap layer is rendered should depend on the current viewport
    // Currently Studio only uses one viewport
    return this.state.bitmapLayer;
  }

  async buildBitmapLayer(reason: string): void {
    // const viewports = deckInstance.getViewports();
    const viewports = this.context.deck?.getViewports() || [];
    if (viewports.length <= 0) {
      return;
    }

    const viewport = viewports[0];
    const bounds = viewport.getBounds();
    const {width, height} = viewport;

    console.log(`Loading new bitmap ${reason}`, bounds, width, height);

    // TODO - need types on the layer state
    const imageService = this.state.imageService as WMSService;

    // const imageUrl = `https://ows.terrestris.de/osm/service?width=${width}&height=${height}&bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}&srs=EPSG:4326&format=image%2Fpng&request=GetMap&service=WMS&styles=&transparent=TRUE&version=1.1.1&layers=OSM-WMS`;

    // TODO: change in the URL `srs=EPSG:4326` to `srs=EPSG:900913`
    // once we can change the TileLayer bounds from lat/lon to web mercator coordinates
    const image = await imageService.getMap({width, height, bbox: bounds, layers: this.props.layers});

    console.log(`Creating new bitmap layer`, image);

    const layer = new BitmapLayer({
      id: `${this.props.id}-bitmap`,
      bounds,
      image,
      opacity: 0.5,
      loaders: imageService.loaders
    });

    this.state.bitmapLayer = layer;
    this.setNeedsUpdate();
  }
}

let timeoutId;
function debounce(fn: Function, ms = 500): void {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => fn(), ms);
}

