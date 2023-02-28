'use client'

import React, { useState } from 'react';
// @ts-ignore
import DeckGL from '@deck.gl/react/typed';

// Map components

//import getViewState from './view'
//import layers from './layers';

// @ts-ignore
import {TileLayer} from '@deck.gl/geo-layers';
// @ts-ignore
import {BitmapLayer} from '@deck.gl/layers';
import DeckGL from 'deck.gl';

export default function Home({ viewState }) {
  const layer = new TileLayer({
    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
    data: "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",

    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,

    renderSubLayers: (props) => {
      const {
        bbox: { west, south, east, north },
      } = props.tile;

      return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [west, south, east, north],
      });
    },
  });

  return (
    <main>
      <DeckGL
        initialViewState={{
          longitude: -122.45,
          latitude: 37.78,
          zoom: 12,
        }}
        controller={true}
        layers={[layer]}
      />
    </main>
  );
}

export default Home;
