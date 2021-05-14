# I3SConverter class

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `I3SConverter` class converts a 3D Tiles tileset to I3S layer.

## Usage

```js
import {I3SConverter} from '@loaders.gl/tile-converter';

const converter = new I3SConverter();
const tilesetJson = await converter.convert({
  inputUrl: TILESET_URL,
  outputPath: 'data',
  tilesetName: 'BatchedColors'
});

// The converted tiles are written to the specified output path
const rootTileJson = await fs.readFile('data/BatchedColors/layers/0/nodes/root/index.json', 'utf8');
```

## Methods

### constructor()

Constructs a new `I3SConverter` instance.

### convert(options: object): object

Converts a tileset to I3S format

- `options.inputUrl` the url to read the tileset from
- `options.outputPath` the output filename
- `options.tilesetName` the output name of the tileset
- `options.maxDepth` The max tree depth of conversion
- `options.slpk` Whether the resulting layer be saved as "\*.slpk" package
- `options.sevenZipExe` Windows only. The path of 7-zip archiver tool for creating "\*.slpk" file
- `options.egmFilePath` location of \*.pgm file to convert heights from ellipsoidal to gravity-related format. A model file can be loaded from GeographicLib https://geographiclib.sourceforge.io/html/geoid.html
- `options.token` ION token of input tileset
- `options.draco` Whether the converter create DRACO compressed geometry in path "layers/0/nodes/xxx/geometries/1" along with non-compressed geometry in path "layers/0/nodes/xxx/geometries/0"
- `options.validate` Enable Validation

### Validation

By specifying the `--validate` parameter, the tile-converter will perform checks on the tileset data. The following checks are performed:

- Bounding volume validation
- Refinement type validation
