Tile converter / I3S server

# Make converted I3S data available to a client.

I3S Server is a small Node.js HTTP service for serving tile-converter output or SLPK data. It is useful for local development, validation, and controlled deployments where the data is already prepared.

[Tile converter module](https://loaders.gl/next/docs/modules/tile-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter.md)[Tile Converter CLI](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter.md)[I3S format](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)

Serve the prepared dataset

## Convert once, serve the layer through a normal endpoint.

The server sits after conversion: the converter creates the I3S resources, then the HTTP service exposes them to an I3S-aware client or local visualization workflow.

01

Prepare

Convert a supported 3D Tiles dataset into I3S output.

02

Choose

Serve an output directory or an SLPK container.

03

Configure

Set ports, layer paths, HTTPS, and debug logging.

04

Connect

Point an I3S source or viewer at the running service.

Detailed guide

## I3S Server reference

The detailed guide covers installation, conversion prerequisites, server configuration, output paths, and local serving examples.

![From-v4.0](https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square)[![npm version](https://badge.fury.io/js/%40loaders.gl%2Ftile-converter.svg)](https://badge.fury.io/js/%40loaders.gl%2Ftile-converter)

I3S Server is a NodeJS HTTP service built on top of [Express](https://expressjs.com). It can serve I3S data from output path of tile-converter or from SLPK file container.

## Installation[​](#installation "Direct link to Installation")

The i3s-server is published as a part of `@loaders.gl/tile-converter` library.

Create a new folder:

```
mkdir tmp

cd tmp
```

Install `@loaders.gl/tile-converter` package:

```
npm i @loaders.gl/tile-converter
```

## Serve the output data of `tile-converter`[​](#serve-the-output-data-of-tile-converter "Direct link to serve-the-output-data-of-tile-converter")

Convert 3DTiles tileset to I3S:

```
npx tile-converter --install-dependencies

npx tile-converter --input-type 3DTILES --tileset /path/to/tileset.json --name NewTileset
```

### Start HTTP server[​](#start-http-server "Direct link to Start HTTP server")

```
PORT=8080 HTTPS_PORT=4443 I3sLayerPath="./data/NewTileset.slpk" DEBUG=i3s-server:* npx i3s-server
```

#### The layer should be available on URLs[​](#the-layer-should-be-available-on-urls "Direct link to The layer should be available on URLs")

* `http://localhost:8080/SceneServer/layers/0`
* `https://localhost:4443/SceneServer/layers/0`

#### Open in ArcGIS[​](#open-in-arcgis "Direct link to Open in ArcGIS")

`https://www.arcgis.com/home/webscene/viewer.html?url=http://localhost:8080/SceneServer`

#### Open in I3S Explorer[​](#open-in-i3s-explorer "Direct link to Open in I3S Explorer")

`https://i3s.loaders.gl/viewer?tileset=http://localhost:8080/SceneServer/layers/0`

## ENV variables[​](#env-variables "Direct link to ENV variables")

* `I3sLayerPath` - path to resulting SLPK file.
* `PORT` - HTTP port. Eg for `PORT = 8080 npx i3s-server` the server will work on host `http://localhost:8080/...`. Default value is `80`;
* `HTTPS_PORT` - HTTPS port. Eg for `PORT = 4443 npx i3s-server` the server will work on host `https://localhost:4443/...`. Default value is `443`
