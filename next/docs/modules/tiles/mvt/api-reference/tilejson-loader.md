MVT module · metadata loader

# TileJSONLoader

Read TileJSON and tilestats metadata into one typed description of a tile service, including layers, fields, bounds, and tile URL information.

[TileJSON format](https://loaders.gl/next/docs/modules/tiles/mvt/formats/tilejson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/formats/tilejson.md)[MVT source](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-source-loader.md)[MVT module](https://loaders.gl/next/docs/modules/tiles/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt.md)

What it returns

## Understand a tile service before requesting tiles.

TileJSONLoader combines the service-level document with optional tilestats metadata so applications can inspect available layers and fields before they build a map or source.

01

Input

TileJSON and optional tilestats

02

Output

Normalized typed metadata

03

Includes

Layers, fields, bounds, and tile URLs

04

Mode

Synchronous metadata parsing

Detailed guide

## TileJSONLoader reference

The sections below document the format metadata, usage, returned data, and options.

The `TileJSONLoader` parses metadata from a TileJSON / tilestats file. It merges layer and field information from both tilestats and TileJSON and returns a strongly typed data structure.

| TileJSONLoader    |                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------- |
| File Extension    | `.json`                                                                             |
| File Type         | Text                                                                                |
| File Format       | [TileJSON](https://loaders.gl/next/docs/modules/tiles/mvt/formats/tilejson.md) |
| Data Format       | TileJSON                                                                            |
| Decoder Type      | Synchronous                                                                         |
| Worker Thread     | ❌ No                                                                               |
| Streaming Support | ❌ No                                                                               |

## Usage[​](#usage "Direct link to Usage")

```
import {TileJSONLoader} from '@loaders.gl/tiles/mvt';

import {load} from '@loaders.gl/core';



const tileJSON = await load(url, TileJSONLoader, options);
```

## Data Format[​](#data-format "Direct link to Data Format")

See [TileJSON format](https://loaders.gl/next/docs/modules/tiles/mvt/formats/tilejson.md).

## Options[​](#options "Direct link to Options")

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

|
