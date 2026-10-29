I3S recipe · scene attributes

![](/next/images/format-logos/ogc-mark.svg)OGCI3S

# Let the scene data drive the color.

Use feature attributes such as building height to derive colors, labels, or opacity in a rendered I3S scene. The example below makes the relationship visible before the implementation details begin.

[I3S module](https://loaders.gl/next/docs/modules/tiles-3d/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s.md)[I3S format](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)[I3S examples](https://loaders.gl/next/examples/i3s-arcgis)

<!-- -->

[ ↗](https://loaders.gl/next/examples/i3s-arcgis)

⛶⛶ Explore fullscreen

What this recipe demonstrates

## Read metadata once. Turn it into a visual encoding.

I3S associates mesh vertices with feature ids and stores attributes alongside the node resources. An application can use those values to build a color scale while the tile remains in the normal Tile3DLayer pipeline.

01

Choose a field

Read layer fields and attribute storage metadata.

02

Find the range

Load statistics when a stable minimum and maximum are needed.

03

Apply the scale

Map values to colors, opacity, labels, or other effects.

04

Keep traversal

Use the ordinary I3S loader and tile layer lifecycle.

Detailed guide

## Attribute discovery and rendering details

The rest of this recipe covers fields, statistics resources, DataDrivenTile3DLayer integration, and the complete example source.

Please find source code of the example [here](https://github.com/visgl/loaders.gl/tree/master/examples/website/i3s-colorization-by-attributes)

In I3S, a feature represents a real-world object within a node. For example, a building within a 3D object scene layer. Node resources such as geometry buffer and attributes can belong to a feature and can be accessed by an object-ID.

In terms of geometry, every vertex of a mesh is associated with some feature. At the same time, every feature is associated with feature attribute values. For example, there might be `HEIGHT` attribute that stores roof height information about every building.

All that means that it is possible to make some visual effects related to attribute value. It might be text labels, colors, opacity etc.

The complete case of attributes colorization is done in [I3S Explorer](https://i3s.loaders.gl/viewer?tileset=new-york). It is an open source ReactJS application. See source code on [GitHub](https://github.com/visgl/loaders.gl-showcases).

![I3S New York dataset colorized by height roof](/next/assets/images/i3s-new-york-colorize-by-heightroof-fc2b0f1402a6dce50445432ea713df1c.png)

## Find out layer's attributes[​](#find-out-layers-attributes "Direct link to Find out layer's attributes")

It is necessary to pick some attribute to colorize a layer by. So it is necessary to load the layer JSON:

```
import {load} from '@loaders.gl/core';

import {I3SLoader} from '@loaders.gl/tiles-3d/i3s';



const i3sLayer = await load(url, I3SBuildingSceneLayerLoader);
```

List and types of attributes might be taken from [`i3sLayer.fields`](https://github.com/Esri/i3s-spec/blob/master/docs/1.9/field.cmn.md) and [`i3sLayer.attributeStorageInfo`](https://github.com/Esri/i3s-spec/blob/master/docs/1.8/attributeStorageInfo.cmn.md) properties.

## Setup colorization scale[​](#setup-colorization-scale "Direct link to Setup colorization scale")

Attributes colorization capability applies linear color gradient. To create this gradient attribute values range is required.

To get minimum and maximum attribute values [statistics](https://github.com/Esri/i3s-spec/blob/master/docs/1.9/statisticsInfo.cmn.md) can be used. The [statistics info JSON](https://github.com/Esri/i3s-spec/blob/master/docs/1.9/statsInfo.cmn.md) has min and max values. Usage of those values allows setting true attribute values range not clamping extremum values.

As soon as statistics info is stored in separate resources, it has to be loaded in a separate request. Statistics is just a JSON data and can be loaded the following way:

```
import {fetchFile} from '@loaders.gl/core';

import {StatsInfo} from '@loaders.gl/tiles-3d/i3s';



const dataResponse = await fetchFile(`${url}/statistics/f_5/0`);

const data = JSON.parse(await dataResponse.text());

const stats: StatsInfo | null = (data?.stats as StatsInfo) || null;
```

## Use DataDrivenTile3DLayer[​](#use-datadriventile3dlayer "Direct link to Use DataDrivenTile3DLayer")

To colorize an I3S dataset on the fly you have to use `DataDrivenTile3DLayer` from `@deck.gl-community/layers`. First of all you need to add `@deck.gl-community/layers` into the project:

```
yarn add @deck.gl-community/layers
```

Then you can use `DataDrivenTile3DLayer`, `colorizeTile` util function as a prop `customizeColors` of the layer and set prop `colorsByAttribute` with required params (attribute name, min/max values, min/max colors, mode):

```
import Map from 'react-map-gl';

import maplibregl from 'maplibre-gl';

import DeckGL from "@deck.gl/react";

import {DataDrivenTile3DLayer, colorizeTile} from '@deck.gl-community/layers';

import {I3SLoader} from "@loaders.gl/tiles-3d/i3s";



function renderLayers() {

  const loadOptions = {i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}};

  const colorsByAttribute = {

    attributeName,

    minValue: stats.min,

    maxValue: stats.max,

    minColor: [146, 146, 252, 255], // #9292FC

    maxColor: [44, 44, 175, 255], // #2C2CAF

    mode: 'replace'

  }

  const layers = new DataDrivenTile3DLayer({

    data: url,

    loader: I3SLoader,

    onTilesetLoad: onTilesetLoadHandler,

    loadOptions,

    colorsByAttribute,

    customizeColors: colorizeTile

  });



  return layers;

}



<DeckGL initialViewState={viewState} layers={renderLayers()} controller>

  <Map

    reuseMaps

    mapLib={maplibregl}

    mapStyle={style}

  />

</DeckGL>
```

## Colorization mode[​](#colorization-mode "Direct link to Colorization mode")

Attributes colorization capability can work in 2 modes: 'replace' and 'multiply'.

`replace` mode. Attribute-based colors replace geometry vertex colors.

`multiply` mode. Attribute-based colors multiply with geometry vertex colors.

Usage example:

```
function renderLayers() {

  const loadOptions = {i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}};

  const colorsByAttribute = {

    attributeName,

    minValue: stats.min,

    maxValue: stats.max,

    minColor: [146, 146, 252, 255], // #9292FC

    maxColor: [44, 44, 175, 255], // #2C2CAF

    mode: 'multiply' // or 'replace'

  };

  const layers = new DataDrivenTile3DLayer({

    data: url,

    loader: I3SLoader,

    onTilesetLoad: onTilesetLoadHandler,

    loadOptions,

    colorsByAttribute,

    customizeColors: colorizeTile

  });



  return layers;

}
```
