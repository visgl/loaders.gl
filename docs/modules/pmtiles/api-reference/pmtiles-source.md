# PMTilesSource

The `PMTilesSource` parses simple meshes in the Polygon File Format or the Stanford Triangle Format.

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.ply`                                        |
| File Type             | Binary/Text                                   |
| File Format           | [PLY](http://paulbourke.net/dataformats/ply/) |
| Data Format           | [Mesh](/docs/specifications/category-mesh)  |
| Decoder Type          | Synchronous                                   |
| Worker Thread Support | Yes                                           |
| Streaming Support     | No                                            |

## Usage

```typescript
import {PMTilesSource} from '@loaders.gl/ply';
import {load} from '@loaders.gl/core';

const data = await load(url, PMTilesSource, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
