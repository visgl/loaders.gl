// Copyright 2022 Foursquare Labs, Inc. All Rights Reserved.

import {Layer, CompositeLayer /*, CompositeLayerProps */} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import {ViewportLoader} from '@loaders.gl/wms';

export type ImageryLayerProps = {
  serviceUrl: string;
};

/**
 * The layer is used in Hex Tile layer in order to properly discard invisible elements during animation
 */
export class ImageryLayer extends CompositeLayer<ImageryLayerProps> {
  static layerName = 'ImageryLayer';

  initializeState(): void {
    this.state.bitmapLayer = this.buildBitmapLayer('initialize');
  }

  updateState(params): void {
    if (params.changeFlags.viewportChanged) {
      this.buildBitmapLayer('state changed');
    }
  }

  renderSubLayers(props: CompositeLayerProps<ImageryLayerProps>): Layer<any> {
    // TODO - which bitmap layer is rendered should depend on the current viewport
    // Currently Studio only uses one viewport
    return this.state.bitmapLayer;
  }

  buildBitmapLayer(reason: string): void {
    // const viewports = deckInstance.getViewports();
    const {viewports} = this.context;
    if (viewports.length < 0) {
      return;
    }

    const viewport = viewports[0];
    const bounds = viewport.getBounds();
    const {width, height} = viewport;

    console.log(reason, {bounds, width, height});

    // TODO: change in the URL `srs=EPSG:4326` to `srs=EPSG:900913`
    // once we can change the TileLayer bounds from lat/lon to web mercator coordinates
    const serviceUrl = this.props.data || `https://ows.terrestris.de/osm/service`;
    // const imageUrl = wmsService ? wmsService.getMapURL({width, height, bounds}) : url;

    const imageUrl = `https://ows.terrestris.de/osm/service?width=${width}&height=${height}&bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}&srs=EPSG:4326&format=image%2Fpng&request=GetMap&service=WMS&styles=&transparent=TRUE&version=1.1.1&layers=OSM-WMS`;

    const layer = new BitmapLayer({
      id: 'WMSImageryLayer',
      bounds,
      image: imageUrl,
      opacity: 0.5
    });
  }
}
