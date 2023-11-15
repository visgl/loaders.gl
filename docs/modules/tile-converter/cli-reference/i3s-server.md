# I3S Server

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

Convert 3DTiles tileset to I3S without `--slpk` option:

```bash
npx tile-converter --install-dependencies
npx tile-converter --input-type 3DTILES --tileset /path/to/tileset.json --name NewTileset
```

### Start HTTP server
```bash
PORT=8080 HTTPS_PORT=4443 I3sLayerPath="./data" DEBUG=i3s-server:* npx i3s-server
```

#### The layer should be available on URLs
- `http://localhost:8080/NewTileset/SceneServer/layers/0`
- `https://localhost:4443/NewTileset/SceneServer/layers/0`

#### Open in ArcGIS

`https://www.arcgis.com/home/webscene/viewer.html?url=http://localhost:8080/NewTileset/SceneServer`

#### Open in I3S Explorer

`https://i3s.loaders.gl/viewer?tileset=http://localhost:8080/NewTileset/SceneServer/layers/0`

## Serve SLPK

Example for path `../datasets/Rancho_Mesh_mesh_v17_1.slpk`:

### Start the server

```bash
PORT=8080 HTTPS_PORT=4443 I3sLayerPath="../datasets/Rancho_Mesh_mesh_v17_1.slpk" DEBUG=i3s-server:* npx i3s-server
```
#### The layer should be available on URLs

- `http://localhost:8080/SceneServer/layers/0/...`
- `https://localhost:4443/SceneServer/layers/0/...`

#### Open in ArcGIS

`https://www.arcgis.com/home/webscene/viewer.html?url=http://localhost:8080/SceneServer`

#### Open in I3S Explorer

`https://i3s.loaders.gl/viewer?tileset=http://localhost:8080/SceneServer/layers/0`

## ENV variables

- `I3sLayerPath` - path to converted data or SLPK file.
- `PORT` - HTTP port. Eg for `PORT = 8080 npx i3s-server` the server will work on host `http://localhost:8080/...`. Default value is `80`;
- `HTTPS_PORT` - HTTPS port. Eg for `PORT = 4443 npx i3s-server` the server will work on host `https://localhost:4443/...`. Default value is `443`