# Tiles3DConverter class

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `Tiles3DConverter` class converts an I3S layer. It converts between the OGC I3S formats and the 3D Tiles.

## Usage

```js
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

## Methods

### constructor()

Constructs a new `Tiles3DConverter` instance.

### convert(options: object): object

Converts a tileset to 3DTiles format

- `options.inputUrl` the url to read the tileset from. Required
- `options.outputPath` the output path
- `options.tilesetName` the output name of the tileset
- `options.egmFilePath` location of \*.pgm file to convert heights from ellipsoidal to gravity-related format
- `options.maxDepth` The max tree depth of conversion
