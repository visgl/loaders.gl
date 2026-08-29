---
title: I3S Server
description: Serve converted I3S output or SLPK data through the tile-converter HTTP service.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tile converter / I3S server"
  title="Make converted I3S data available to a client."
  description="I3S Server is a small Node.js HTTP service for serving tile-converter output or SLPK data. It is useful for local development, validation, and controlled deployments where the data is already prepared."
  tone="mint"
  meta={['Node.js HTTP service', 'Converted I3S output', 'SLPK input']}
  links={[
    {label: 'Tile converter module', to: '/docs/modules/tile-converter'},
    {label: 'Tile Converter CLI', to: '/docs/modules/tile-converter/cli-reference/tile-converter'},
    {label: 'I3S format', to: '/docs/modules/i3s/formats/i3s'}
  ]}
/>

<DocOrientation
  eyebrow="Serve the prepared dataset"
  title="Convert once, serve the layer through a normal endpoint."
  description="The server sits after conversion: the converter creates the I3S resources, then the HTTP service exposes them to an I3S-aware client or local visualization workflow."
  tone="mint"
  items={[
    {label: 'Prepare', value: 'Convert a supported 3D Tiles dataset into I3S output.'},
    {label: 'Choose', value: 'Serve an output directory or an SLPK container.'},
    {label: 'Configure', value: 'Set ports, layer paths, HTTPS, and debug logging.'},
    {label: 'Connect', value: 'Point an I3S source or viewer at the running service.'}
  ]}
/>

<ReferenceBoundary
  title="I3S Server reference"
  description="The detailed guide covers installation, conversion prerequisites, server configuration, output paths, and local serving examples."
  tone="mint"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
  <a href="https://badge.fury.io/js/%40loaders.gl%2Ftile-converter">
    <img src="https://badge.fury.io/js/%40loaders.gl%2Ftile-converter.svg" alt="npm version" height="18" />
  </a>
</p>

I3S Server is a NodeJS HTTP service built on top of [Express](https://expressjs.com). It can serve I3S data from output path of tile-converter or from SLPK file container.

## Installation

The i3s-server is published as a part of `@loaders.gl/tile-converter` library.

Create a new folder:

```bash
mkdir tmp
cd tmp
```

Install `@loaders.gl/tile-converter` package:

```bash
npm i @loaders.gl/tile-converter
```

## Serve the output data of `tile-converter`

Convert 3DTiles tileset to I3S:

```bash
npx tile-converter --install-dependencies
npx tile-converter --input-type 3DTILES --tileset /path/to/tileset.json --name NewTileset
```

### Start HTTP server

```bash
PORT=8080 HTTPS_PORT=4443 I3sLayerPath="./data/NewTileset.slpk" DEBUG=i3s-server:* npx i3s-server
```

#### The layer should be available on URLs

- `http://localhost:8080/SceneServer/layers/0`
- `https://localhost:4443/SceneServer/layers/0`

#### Open in ArcGIS

`https://www.arcgis.com/home/webscene/viewer.html?url=http://localhost:8080/SceneServer`

#### Open in I3S Explorer

`https://i3s.loaders.gl/viewer?tileset=http://localhost:8080/SceneServer/layers/0`

## ENV variables

- `I3sLayerPath` - path to resulting SLPK file.
- `PORT` - HTTP port. Eg for `PORT = 8080 npx i3s-server` the server will work on host `http://localhost:8080/...`. Default value is `80`;
- `HTTPS_PORT` - HTTPS port. Eg for `PORT = 4443 npx i3s-server` the server will work on host `https://localhost:4443/...`. Default value is `443`
