# PMTilesLoader

The `PMTilesLoader` parses header/metadata from a pmtiles archive

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.pmtiles`                                        |
| File Type             | Binary/Text                                   |
| File Format           | [PLY](http://paulbourke.net/dataformats/ply/) |
| Data Format           | [Mesh](/docs/specifications/category-mesh)  |
| Decoder Type          | Synchronous                                   |
| Worker Thread Support | Yes                                           |
| Streaming Support     | No                                            |

## Usage

```typescript
import {PMTilesLoader} from '@loaders.gl/ply';
import {load} from '@loaders.gl/core';

const data = await load(url, PMTilesLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
