# I3SLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.1-blue.svg?style=flat-square" alt="From-v2.1" />
</p>

> The `I3SLoader` is experimental. Currently only support I3S `MeshPyramids` data format.

A loader for loading an [Indexed 3d Scene (I3S) layer](https://github.com/Esri/i3s-spec), and its geometries and textures data.

| Loader         | Characteristic                                      |
| -------------- | --------------------------------------------------- |
| File Format    | [I3S Layer](https://github.com/Esri/i3s-spec)       |
| File Type      | Json, Binary                                        |
| File Extension | `.json` (layer), `.bin` (geometries)                |
| File Format    | [i3s](https://www.opengeospatial.org/standards/i3s) |
| Data Format    | [Data formats](#data-formats)                       |
| Supported APIs | `load`, `parse`                                     |

## Terms

The terms and concepts used in `i3s` module have the corresponding parts [I3S Spec](https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md).

- `tileset`: I3S Indexed 3D Layer File.
- `tile`: I3S node file.
- `tileContent`: I3S node content: geometries, textures, etc.

## Usage

As an I3S tileset contains multiple file formats, `I3SLoader` is needed to be explicitly specified when using [`load`](https://loaders.gl/modules/core/docs/api-reference/load) function.

**Load I3S tileset and render with [deck.gl](https://deck.gl/#/)**

A simple react app umodules/3d-tiles/src/tiles-3d-loader.jsses `I3SLoader` to load [San Francisco Buildings](https://www.arcgis.com/home/item.html?id=d3344ba99c3f4efaa909ccfbcc052ed5), render with [deck.gl's](https://deck.gl/) [`Tile3Dlayer`](https://deck.gl/#/documentation/deckgl-api-reference/layers/tile-3d-layer) and dynamically load/unload tiles based on current viewport and adjust the level of details when zooming in and out.

<table style="border: 0;" align="center">
  <tbody>
    <img style="max-height:200px" src="https://raw.github.com/visgl/deck.gl-data/master/images/whats-new/esri-i3s.gif" />
  </tbody>
</table>

[Example Codesandbox](https://codesandbox.io/s/i3sloadersgldeckgl-34dfp)

```js
import React, {Component} from 'react';

import {StaticMap} from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {I3SLoader} from '@loaders.gl/i3s';

// How to get mapbox token https://docs.mapbox.com/help/how-mapbox-works/access-tokens/
const MAPBOX_TOKEN = ''; // add your Mapbox token here

const INITIAL_VIEW_STATE = {
  longitude: -120,
  latitude: 34,
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 85,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {viewState: INITIAL_VIEW_STATE};
  }

  _onTilesetLoad(tileset) {
    // update viewport to the tileset center
    const {zoom, cartographicCenter} = tileset;
    const [longitude, latitude] = cartographicCenter;

    const viewState = {
      ...this.state.viewState,
      zoom: zoom + 2.5,
      longitude,
      latitude
    };

    this.setState({viewState});
  }

  render() {
    const {viewState} = this.state;

    // construct Tile3DLayer to render I3S tileset
    const layer = new Tile3DLayer({
      id: 'tile-3d-layer',
      // Tileset entry point: Indexed 3D layer file url
      data: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
      loader: I3SLoader,
      onTilesetLoad: this._onTilesetLoad.bind(this)
    });

    return (
      <DeckGL
        layers={[layer]}
        viewState={viewState}
        controller={{type: MapController}}
        onViewStateChange={({viewState}) => {
          // update viewState when interacting with map
          this.setState({viewState});
        }}
      >
        <StaticMap
          mapStyle={'mapbox://styles/mapbox/dark-v9'}
          mapboxApiAccessToken={MAPBOX_TOKEN}
          preventStyleDiffing
        />
      </DeckGL>
    );
  }
}
```

A more complex example could be found [here](https://github.com/visgl/loaders.gl/tree/master/examples/deck.gl/i3s), checkout website [examples](https://loaders.gl/examples/i3s).

**Basic API Usage**

Basic API usage is illustrated in the following snippet. Create a `Tileset3D` instance, point it a valid tileset URL, set up callbacks, and keep feeding in new camera positions:

```js
import {load} from '@loaders.gl/core';
import {I3SLoader} from '@loaders.gl/i3s';
import {Tileset3D} from '@loaders.gl/tiles';
import {WebMercatorViewport} from '@deck.gl/core';

const tileseturl =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';

const tileset = await load(tileseturl, I3SLoader);

const tileset3d = new Tileset3D(tilesetJson, {
  onTileLoad: tile => console.log(tile)
});

// initial viewport
// viewport should be deck.gl WebMercatorViewport instance
const viewport = new WebMercatorViewport({latitude, longitude, zoom, ...})
tileset3d.update(viewport);

// Viewport changes (pan zoom etc)
tileset3d.update(viewport);

// Visible tiles
const visibleTiles = tileset3d.tiles.filter(tile => tile.selected);

// Note that visibleTiles will likely not immediately include all tiles
// tiles will keep loading and file `onTileLoad` callbacks
```

## Options

| Option                              | Type             | Default | Description                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.i3s.isTileset`             | `Bool` or `auto` | `auto`  | Whether to load `Tileset` (Layer 3D Index) file. If `auto`, will decide if follow `ArcGIS` tile layers' url convention                                                                                                                                                                                                          |
| `options.i3s.isTileHeader`          | `Bool` or `auto` | `auto`  | Whether to load `TileHeader`(node) file. If `auto`, will decide if follow `argis` url convention                                                                                                                                                                                                                                |
| `options.i3s.loadContent`           | `Bool`           | `true`  | Whether to load tile content (geometries, texture, etc.). Note: I3S dataset, each tile node has separate urls pointing to tile metadata and its actual tile payload. If `loadContent` is true, i3s loader will make a request to fetch the content fiile and decoded to the format as specified in [Tile Object](#tile-object). |
| `options.i3s.tileset`               | `Object`         | `null`  | `Tileset` object loaded by I3SLoader or follow the data format specified in [Tileset Object](#tileset-object). It is required when loading i3s geometry content                                                                                                                                                                 |
| `options.i3s.tile`                  | `Object`         | `null`  | `Tile` object loaded by I3SLoader or follow the data format [Tile Object](#tile-object). It is required when loading i3s geometry content                                                                                                                                                                                       |
| `options.i3s.useDracoGeometry`      | `Bool`           | `true`  | Use 'Draco' compressed geometry to show if applicable                                                                                                                                                                                                                                                                           |
| `options.i3s.useCompressedTextures` | `Bool`           | `true`  | Use "Compressed textures" (_.dds or _.ktx) if available and supported by GPU                                                                                                                                                                                                                                                    |

## Data formats

Loaded data conforms to the 3D Tiles loader category specification with the following exceptions.

### Tileset Object

The following fields are guaranteed. Additionally, the loaded tileset object will contain all the data fetched from the provided url.

| Field            | Type     | Contents                                                                                                                                                                                                                                                                         |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | `String` | Value is `i3s`. Indicates the returned object is an `i3s` tileset.                                                                                                                                                                                                               |
| `lodMetricType`  | `String` | Root's level of detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support `maxScreenThreshold` for now. Check I3S [lodSelection](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md) for more details. |
| `lodMetricValue` | `Number` | Root's level of detail (LoD) metric value.                                                                                                                                                                                                                                       |

### Tile Object

The following fields are guaranteed. Additionally, the loaded tile object will contain all the data fetched from the provided url.

| Field            | Type     | Contents                                                                                                                                                                                                                                                                                 |
| ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `String` | Identifier of the tile, unique in a tileset                                                                                                                                                                                                                                              |
| `refine`         | `String` | Refinement type of the tile, currently only support `REPLACE`                                                                                                                                                                                                                            |
| `type`           | `String` | Type of the tile, value is `mesh` (currently only support [I3S MeshPyramids](https://github.com/Esri/i3s-spec)                                                                                                                                                                           |
| `url`            | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `contentUrl`     | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `featureUrl`     | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `textureUrl`     | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `boundingVolume` | `Object` | A bounding volume in Cartesian coordinates converted from i3s node's [`mbs`](https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md) that encloses a tile or its content. Exactly one box, region, or sphere property is required. |
| `lodMetricType`  | `String` | Level of Detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support `maxScreenThreshold` for now. Check I3S [lodSelection](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md) for more details.                |
| `lodMetricValue` | `String` | Level of Detail (LoD) metric value.                                                                                                                                                                                                                                                      |
| `content`        | `String` | The actual payload of the tile or the url point to the actual payload. If `option.loadContent` is enabled, content will be populated with the loaded value following the Tile Content section                                                                                            |

### Tile Content

After content is loaded, the following fields are guaranteed. But different tiles may have different extra content fields.

| Field                | Type         | Contents                                                                                                                                |
| -------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `cartesianOrigin`    | `Number[3]`  | "Center" of tile geometry in WGS84 fixed frame coordinates                                                                              |
| `cartographicOrigin` | `Number[3]`  | "Origin" in lng/lat (center of tile's bounding volume)                                                                                  |
| `modelMatrix`        | `Number[16]` | Transforms tile geometry positions to fixed frame coordinates                                                                           |
| `vertexCount`        | `Number`     | Transforms tile geometry positions to fixed frame coordinates                                                                           |
| `attributes`         | `Object`     | Each attribute follows luma.gl [accessor](https://github.com/visgl/luma.gl/blob/master/docs/api-reference/webgl/accessor.md) properties |
| `texture`            | `Object`     | Loaded texture by [`loaders.gl/image`](https://loaders.gl/modules/images/docs/api-reference/image-loader)                               |
| `featureData`        | `Object`     | Loaded feature data for parsing the geometies (Will be deprecated in 2.x)                                                               |

`attributes` contains following fields

| Field                  | Type     | Contents                          |
| ---------------------- | -------- | --------------------------------- |
| `attributes.positions` | `Object` | `{value, type, size, normalized}` |
| `attributes.normals`   | `Object` | `{value, type, size, normalized}` |
| `attributes.colors`    | `Object` | `{value, type, size, normalized}` |
| `attributes.texCoords` | `Object` | `{value, type, size, normalized}` |
