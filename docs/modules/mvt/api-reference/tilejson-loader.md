# TileJSONLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

The `TileJSONLoader` parses header/metadata from a pmtiles archive

| Loader                | Characteristic                                     |
| --------------------- | -------------------------------------------------- |
| File Extension        | `.json`                                            |
| File Type             | Text                                               |
| File Format           | [TileJSON](/docs/modules/mvt/formats/tilejson) |
| Data Format           | TileJSON                                           |
| Decoder Type          | Synchronous                                        |
| Worker Thread Support | No                                                 |
| Streaming Support     | No                                                 |

## Usage

```typescript
import {TileJSONLoader} from '@loaders.gl/pmtiles';
import {load} from '@loaders.gl/core';

const tileJSON = await load(url, TileJSONLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
