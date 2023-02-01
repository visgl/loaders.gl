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

- `options.inputUrl: string` the url to read the tileset from
- `options.outputPath: string` the output filename
- `options.tilesetName: string` the output name of the tileset
- `options.maxDepth: number` The max tree depth of conversion
- `options.slpk: boolean` Whether the resulting layer be saved as "\*.slpk" package
- `options.sevenZipExe: string` Windows only option. The path of 7-zip archiver tool for creating "\*.slpk" file
- `options.egmFilePath: string` location of \*.pgm file to convert heights from ellipsoidal to gravity-related format. A model file can be loaded from GeographicLib https://geographiclib.sourceforge.io/html/geoid.html
- `options.token: string` ION token of input tileset
- `options.draco: boolean` Default: `true`. Whether the converter creates DRACO compressed geometry in path "layers/0/nodes/xxx/geometries/1" along with non-compressed geometry in path "layers/0/nodes/xxx/geometries/0"
- `options.mergeMaterials: boolean` Default: `true`. Whether the converter should try to merge PBR materials. If `true`, the converter will try to merge PBR materials, joining textures in an atlas. This operation allows to create one I3S node for one 3DTiles tile. If one material has a texture but another doesn't have, materials are not merged and the 3DTiles tile will be splitted into 2 I3S nodes.
- `options.generateTextures: boolean` Whether the converter should generate additional texture of another format. For non-compressed source texture format (JPG, PNG) the converter creates additional KTX2 texture. For compressed source texture (KTX2) the converter creates additional JPG texture. To encode and decode KTX2 [Basis Universal Supercompressed GPU Texture Codec](https://github.com/BinomialLLC/basis_universal) is used.
- `options.generateBoundingVolumes: boolean` Whether the converter generate new bounding volumes from the mesh vertices. The default behavior is convertion bounding volumes (box, sphere or region) from 3DTiles tileset data. If this option is set `true` the converter will ignore source bounding volume and generate new bounding volume (oriented bounding box and minimal bounding sphere) from the geometry POSITION attribute.
- `options.instantNodeWriting: boolean` Whether the converter should keep JSON resources ([3DNodeIndexDocuments](https://github.com/Esri/i3s-spec/blob/master/docs/1.8/3DNodeIndexDocument.cmn.md) and [nodePages](https://github.com/Esri/i3s-spec/blob/master/docs/1.8/nodePage.cmn.md)) on disk during conversion. The default behavior is the converter keeps JSON resources in memory till the end of conversion. Those resources need to be updated during conversion (adding child nodes and neighbor nodes). If this option is set `true` the converter will keep JSON resources on disk all the time. Use this option for large datasets when the nodes tree is large and "memory overflow" error occurs. Instant node writing saves memory usage in cost of conversion speed (>2 times slower).
- `options.validate` Enable Validation

### Validation

By specifying the `--validate` parameter, the tile-converter will perform checks on the tileset data. The following checks are performed:

- Bounding volume validation
- Refinement type validation
