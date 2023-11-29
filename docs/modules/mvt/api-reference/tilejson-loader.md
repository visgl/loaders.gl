# TileJSONLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

The `TileJSONLoader` parses metadata from a [TileJSON / tilestats](/docs/modules/mvt/formats/tilejson.md) file. It merges layer and field information from both tilestats and TileJSON and returns a strongly typed data structure. 


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

## Data Format

See [TileJSON format](/docs/modules/mvt/formats/tilejson.md).

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| 