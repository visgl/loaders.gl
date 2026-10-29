I3S recipe · interaction

![](/next/images/format-logos/ogc-mark.svg)OGCI3S

# Pick an object, then inspect its data.

Connect a click in a rendered I3S 3D Object layer to the feature id and attributes behind it. The recipe separates the visual highlight from the metadata request so each part stays easy to reuse.

[I3S module](https://loaders.gl/next/docs/modules/tiles-3d/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s.md)[Tile3DLayer](https://deck.gl/docs/api-reference/geo-layers/tile-3d-layer)

<!-- -->

[ ↗](https://deck.gl/docs/api-reference/geo-layers/tile-3d-layer)[I3S examples](https://loaders.gl/next/examples/i3s-arcgis)

<!-- -->

[ ↗](https://loaders.gl/next/examples/i3s-arcgis)

⛶⛶ Explore fullscreen

What this recipe demonstrates

## Make a rendered feature addressable.

Picking is a two-step interaction: the tile layer reports which feature was hit, then the I3S helpers can load the corresponding attributes for an inspector, tooltip, or selection panel.

01

Interactive scope

Supported for I3S 3D Object layers.

02

Visual state

Use pickable and highlightedObjectIndex to show selection.

03

Metadata

Call loadFeatureAttributes with the selected object and index.

04

Not universal

Integrated Mesh layers do not expose individual objects in this way.

Detailed guide

## Picking and attribute-loading details

The sections below show the deck.gl event wiring, highlighted-object state, and the follow-up attribute request.

At the example above you can click any interesting object to get it highlighted and show selected object attributes data. Objects picking can be implemented for `3DObject` layer type only, it's not applicable for `IntegratedMesh` layer type. Please find source code of the example [here](https://github.com/visgl/loaders.gl/tree/master/examples/website/i3s-picking)

## Selected object highlighting[​](#selected-object-highlighting "Direct link to Selected object highlighting")

To get selected object highlighted it needs to set prop `pickable` of the `Tile3DLayer` to `true` and prop `highlightedObjectIndex` to value of index of the selected object. Please take a look at the short codesnippet below:

```
import DeckGL from '@deck.gl/react';

import {Tile3DLayer} from '@deck.gl/geo-layers';

import Map from 'react-map-gl';

import maplibregl from 'maplibre-gl';



const [highlightedObjectIndex, setHighlightedObjectIndex] = useState(-1);



function renderLayers() {

  const loadOptions = {i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}};

  const layers = new Tile3DLayer({

    data: tilesetURL,

    loader: I3SLoader,

    onTilesetLoad: onTilesetLoadHandler,

    loadOptions,

    pickable: true,

    highlightedObjectIndex

  });

  return layers;

}



<DeckGL

  initialViewState={viewState}

  layers={renderLayers()}

  controller={true}

  onClick={(info) => setHighlightedObjectIndex(info.index)}

>

  <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} />

</DeckGL>;
```

## Selected object attributes loading[​](#selected-object-attributes-loading "Direct link to Selected object attributes loading")

To get attributes data for the selected object it needs to invoke `loadFeatureAttributes` with the selected object and object's index as a params.

```
import DeckGL from '@deck.gl/react';

import {Tile3DLayer} from '@deck.gl/geo-layers';

import Map from 'react-map-gl';

import maplibregl from 'maplibre-gl';

import {loadFeatureAttributes} from '@loaders.gl/tiles-3d/i3s';



const [highlightedObjectIndex, setHighlightedObjectIndex] = useState(-1);



function onClickHandler(info) {

  setHighlightedObjectIndex(info.index);

  loadFeatureAttributes(info.object, info.index).then((result) => {

    setAttributesObject(result);

  });

}



function renderLayers() {

  const loadOptions = {i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}};

  const layers = new Tile3DLayer({

    data: tilesetURL,

    loader: I3SLoader,

    onTilesetLoad: onTilesetLoadHandler,

    loadOptions,

    pickable: true,

    highlightedObjectIndex

  });

  return layers;

}



<DeckGL

  initialViewState={viewState}

  layers={renderLayers()}

  controller={true}

  onClick={onClickHandler}

>

  <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} />

</DeckGL>;
```

Here is an example of the result returned by `loadFeatureAttributes`:

```
{

    "OBJECTID": "709688",

    "BIN": "1088469",

    "DOITT_ID": "1114961",

    "SOURCE_ID": "21510003972",

    "FID": "709688",

    "NAME": "Tower 1 World Trade Ctr",

    "BBL": "1000580001",

    "CNSTRCT_YR": "2009",

    "LSTMODDATE": "1/1/2015",

    "LSTSTATYPE": "Constructed",

    "HEIGHTROOF": "1408.377901",

    "FTRCODE": "5100",

    "SUBFTRCODE": "510000",

    "GROUNDELEV": "5",

    "NUM_FLOORS": "104",

    "BUILT_CODE": ""

}
```
