---
title: Tiles3DConverter
description: Convert I3S datasets into 3D Tiles output through the tile-converter JavaScript API.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tile converter API / output"
  title="Prepare I3S data for a 3D Tiles pipeline."
  description="Tiles3DConverter translates an I3S layer into a 3D Tiles dataset, including hierarchy, content, optional compression, textures, and converted height references according to the selected options."
  tone="orange"
  meta={['I3S → 3D Tiles', 'Node.js API', 'Dataset preparation']}
  links={[
    {label: 'Tile converter module', to: '/docs/modules/tile-converter'},
    {label: 'I3S converter', to: '/docs/modules/tile-converter/api-reference/i3s-converter'},
    {label: '3D Tiles runtime', to: '/docs/modules/3d-tiles'}
  ]}
/>

<DocOrientation
  eyebrow="Conversion path"
  title="Read a tiled source. Write a compatible dataset."
  description="The converter keeps conversion settings explicit because output size, material handling, compression, depth, and bounding volumes affect both the generated files and the runtime behavior downstream."
  tone="orange"
  items={[
    {label: 'Input', value: 'An I3S layer URL or supported local source.'},
    {label: 'Translate', value: 'Convert hierarchy and tile content into 3D Tiles resources.'},
    {label: 'Optimize', value: 'Choose depth, Draco, texture, material, and volume options.'},
    {label: 'Output', value: 'A 3D Tiles dataset written to the selected output path.'}
  ]}
/>

<ReferenceBoundary
  title="Tiles3DConverter reference"
  description="The detailed reference covers construction, conversion options, output layout, height conversion, compression, and material handling."
  tone="orange"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `Tiles3DConverter` class converts an I3S layer. It converts between the OGC I3S formats and the 3D Tiles.

## Usage

```typescript
import {Tiles3DConverter} from '@loaders.gl/tile-converter';

const TILESET_URL =
  'https://tiles.arcgis.com/tiles/u0sSNqDXr7puKJrF/arcgis/rest/services/Frankfurt2017_v17/SceneServer/layers/0';

const converter = new Tiles3DConverter();
await converter.convert({
  inputUrl: TILESET_URL,
  outputPath: 'data',
  tilesetName: 'Frankfurt',
  maxDepth: 2
});
```

The converted tiles are written to the specified output path.

## Methods

### constructor()

Constructs a new `Tiles3DConverter` instance.

### convert(options: object): object

Converts a tileset to 3DTiles format

- `options.inputUrl` the url to read the tileset from. Required
- `options.outputPath` the output path
- `options.tilesetName` the output name of the tileset
- `options.egmFilePath` location of \*.pgm file to convert heights from ellipsoidal to gravity-related format
- `options.maxDepth` The max tree depth of conversion
