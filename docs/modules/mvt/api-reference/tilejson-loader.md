---
title: TileJSONLoader
description: Read tile service metadata and merge it with tilestats information.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="MVT module · metadata loader"
  title="TileJSONLoader"
  description="Read TileJSON and tilestats metadata into one typed description of a tile service, including layers, fields, bounds, and tile URL information."
  tone="blue"
  meta={['From v4.0', 'TileJSON', 'Metadata only']}
  links={[
    {label: 'TileJSON format', to: '/docs/modules/mvt/formats/tilejson'},
    {label: 'MVT source', to: '/docs/modules/mvt/api-reference/mvt-source-loader'},
    {label: 'MVT module', to: '/docs/modules/mvt'}
  ]}
/>

<DocOrientation
  eyebrow="What it returns"
  title="Understand a tile service before requesting tiles."
  description="TileJSONLoader combines the service-level document with optional tilestats metadata so applications can inspect available layers and fields before they build a map or source."
  tone="blue"
  items={[
    {label: 'Input', value: 'TileJSON and optional tilestats'},
    {label: 'Output', value: 'Normalized typed metadata'},
    {label: 'Includes', value: 'Layers, fields, bounds, and tile URLs'},
    {label: 'Mode', value: 'Synchronous metadata parsing'}
  ]}
/>

<ReferenceBoundary
  title="TileJSONLoader reference"
  description="The sections below document the format metadata, usage, returned data, and options."
  tone="blue"
/>

The `TileJSONLoader` parses metadata from a TileJSON / tilestats file. It merges layer and field information from both tilestats and TileJSON and returns a strongly typed data structure.

| Loader                | Characteristic                                 |
| --------------------- | ---------------------------------------------- |
| File Extension        | `.json`                                        |
| File Type             | Text                                           |
| File Format           | [TileJSON](/docs/modules/mvt/formats/tilejson) |
| Data Format           | TileJSON                                       |
| Decoder Type          | Synchronous                                    |
| Worker Thread Support | No                                             |
| Streaming Support     | No                                             |

## Usage

```typescript
import {TileJSONLoader} from '@loaders.gl/mvt';
import {load} from '@loaders.gl/core';

const tileJSON = await load(url, TileJSONLoader, options);
```

## Data Format

See [TileJSON format](/docs/modules/mvt/formats/tilejson).

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

|
