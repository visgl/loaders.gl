# PMTilesSource

The `PMTilesSource` reads individual tiles from a PMTiles archive file.

| Loader                | Characteristic                                |
| --------------------- | ----------------------------------------------- |
| File Extension        | `.pmtiles`                                      |
| File Type             | Binary Archive                                  |
| File Format           | [PMTiles](/docs/modules/pmtiles/format/pmtiles) |
| Data Format           | Metadata                                        |
| Decoder Type          | Asynchronous                                     |
| Worker Thread Support | No                                              |
| Streaming Support     | No                                              |

## Usage

```typescript
import {PMTilesSource} from '@loaders.gl/pmtiles';
import {load} from '@loaders.gl/core';

const data = await load(url, PMTilesSource, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
