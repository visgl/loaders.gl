// loaders.gl, MIT license

import React from 'react';
import {createRoot} from 'react-dom/client';

import DeckGL from '@deck.gl/react/typed';
import {MapView} from '@deck.gl/core/typed';
import {TileLayer} from '@deck.gl/geo-layers/typed';
import {BitmapLayer, GeoJsonLayer} from '@deck.gl/layers/typed';
import {} from '@deck.gl/geo-layers/typed';
import {PMTilesSource} from '@loaders.gl/pmtiles';

const INITIAL_VIEW_STATE = {
  latitude: 47.65,
  longitude: 7,
  zoom: 4.5,
  maxZoom: 20,
  maxPitch: 89,
  bearing: 0
};

const COPYRIGHT_LICENSE_STYLE = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  backgroundColor: 'hsla(0,0%,100%,.5)',
  padding: '0 5px',
  font: '12px/20px Helvetica Neue,Arial,Helvetica,sans-serif'
};

const LINK_STYLE = {
  textDecoration: 'none',
  color: 'rgba(0,0,0,.75)',
  cursor: 'grab'
};

/* global window */
const devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

// export const rasterTileSource = new PMTilesSource({
//   url:"https://r2-public.protomaps.com/protomaps-sample-datasets/terrarium_z9.pmtiles"
//   // tileSize: [512,512]
// });

export const vectorTileSource = new PMTilesSource({
  url: "https://r2-public.protomaps.com/protomaps-sample-datasets/nz-buildings-v3.pmtiles",
  attributions: ["© Land Information New Zealand"],
});

const tileSource = vectorTileSource;

let metadata = await tileSource.metadata;

export default function App({showBorder = false, onTilesLoad = null}) {
  console.log(metadata.name, metadata.attributions?.[0]);
  console.debug(metadata);

  const initialViewState = INITIAL_VIEW_STATE;
  initialViewState.zoom = metadata.centerZoom;
  if (metadata.center[0] !== 0 && metadata.center[1] !== 0) {
    initialViewState.longitude = metadata.center[0];
    initialViewState.latitude = metadata.center[1];
  }

  const tileLayer = new TileLayer({
    getTileData: tileSource.getTileData,
    // Assume the pmtiles file support HTTP/2, so we aren't limited by the browser to a certain number per domain.
    maxRequests: 20,

    pickable: true,
    onViewportLoad: onTilesLoad,
    autoHighlight: showBorder,
    highlightColor: [60, 60, 60, 40],
    minZoom: metadata.minZoom,
    maxZoom: metadata.maxZoom,
    tileSize: 256,
    zoomOffset: devicePixelRatio === 1 ? -1 : 0,
    renderSubLayers
  });

  return (
    <DeckGL
      layers={[tileLayer]}
      views={new MapView({repeat: true})}
      initialViewState={initialViewState}
      controller={true}
      getTooltip={getTooltip}
    >
      <div style={COPYRIGHT_LICENSE_STYLE}>
        {metadata.attributions?.map(attribution => <div key={attribution}>{attribution}</div>)}
      </div>
    </DeckGL>
  );
}

function renderSubLayers(props) {
    const {bbox: {west, south, east, north}} = props.tile;

    switch (metadata.mimeType) {
      case 'application/vnd.mapbox-vector-tile':
        console.log(props.data)
        return new GeoJsonLayer({
          id: `${props.id}-geojson`,
          data: props.data,
          pickable: true,
          getFillColor: [0, 190, 80, 255],
        });

      default:
        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north],
          pickable: true
        });
        // showBorder &&
        //   new PathLayer({
        //     id: `${props.id}-border`,
        //     data: [
        //       [
        //         [west, north],
        //         [west, south],
        //         [east, south],
        //         [east, north],
        //         [west, north]
        //       ]
        //     ],
        //     getPath: d => d,
        //     getColor: [255, 0, 0],
        //     widthMinPixels: 4
        //   })
  }
}

function getTooltip(info) {
  // console.log(info);
  if (info.tile) {
    const {x, y, z} = info.tile.index;
    return `tile: x: ${x}, y: ${y}, z: ${z}`;
  }
  return null;
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
