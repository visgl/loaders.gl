# PMTilesSource 🆕

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

The `PMTilesSource` reads individual tiles from a PMTiles archive file.

| Loader                | Characteristic                                   |
| --------------------- | ------------------------------------------------ |
| File Extension        | `.pmtiles`                                       |
| File Type             | Binary Archive                                   |
| File Format           | [PMTiles](/docs/modules/pmtiles/formats/pmtiles) |
| Data Format           | Metadata                                         |
| Decoder Type          | Asynchronous                                     |
| Worker Thread Support | No                                               |
| Streaming Support     | No                                               |

## Usage

```typescript
import {PMTilesSource} from '@loaders.gl/pmtiles';
import {load} from '@loaders.gl/core';

const source = new PMTilesSource({url});
const tile = await source.getTile(...);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
