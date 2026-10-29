Tile converter API / output

# Prepare I3S data for a 3D Tiles pipeline.

Tiles3DConverter translates an I3S layer into a 3D Tiles dataset, including hierarchy, content, optional compression, textures, and converted height references according to the selected options.

[Tile converter module](https://loaders.gl/next/docs/modules/tile-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter.md)[I3S converter](https://loaders.gl/next/docs/modules/tile-converter/api-reference/i3s-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/api-reference/i3s-converter.md)[3D Tiles runtime](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md)

Conversion path

## Read a tiled source. Write a compatible dataset.

The converter keeps conversion settings explicit because output size, material handling, compression, depth, and bounding volumes affect both the generated files and the runtime behavior downstream.

01

Input

An I3S layer URL or supported local source.

02

Translate

Convert hierarchy and tile content into 3D Tiles resources.

03

Optimize

Choose depth, Draco, texture, material, and volume options.

04

Output

A 3D Tiles dataset written to the selected output path.

Detailed guide

## Tiles3DConverter reference

The detailed reference covers construction, conversion options, output layout, height conversion, compression, and material handling.

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

The `Tiles3DConverter` class converts an I3S layer. It converts between the OGC I3S formats and the 3D Tiles.

## Usage[​](#usage "Direct link to Usage")

```
import {Tiles3DConverter} from '@loaders.gl/tile-converter';



const TILESET_URL =

  'https://tiles.arcgis.com/tiles/u0sSNqDXr7puKJrF/arcgis/rest/services/Frankfurt2017_v17/SceneServer/layers/0';



const converter = new Tiles3DConverter();

await converter.convert({

  inputUrl: TILESET_URL,

  outputPath: 'data',

  tilesetName: 'Frankfurt',

  maxDepth: 2

});
```

The converted tiles are written to the specified output path.

## Methods[​](#methods "Direct link to Methods")

### constructor()[​](#constructor "Direct link to constructor()")

Constructs a new `Tiles3DConverter` instance.

### convert(options: object): object[​](#convertoptions-object-object "Direct link to convert(options: object): object")

Converts a tileset to 3DTiles format

* `options.inputUrl` the url to read the tileset from. Required
* `options.outputPath` the output path
* `options.tilesetName` the output name of the tileset
* `options.egmFilePath` location of \*.pgm file to convert heights from ellipsoidal to gravity-related format
* `options.maxDepth` The max tree depth of conversion
