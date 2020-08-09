# I3SConverter class

The `I3SConverter` class converts a 3D Tiles tileset.

## Usage

```js
import {I3SConverter} from '@loaders.gl/cli';

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
