# SLPK extractor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
  <a href="https://badge.fury.io/js/%40loaders.gl%2Ftile-converter">
    <img src="https://badge.fury.io/js/%40loaders.gl%2Ftile-converter.svg" alt="npm version" height="18" />
  </a>
</p>

SLPK extractor is utility that helps to extract slpk to a dataset that can be served via i3s-server

## Installation

The slpk-extractor is published as a part of `@loaders.gl/tile-converter` 

Create a new folder:

```bash
mkdir tmp
cd tmp
```

Install `@loaders.gl/tile-converter` package:

```bash
npm i @loaders.gl/tile-converter
```

## Extraction

Extract .slpk to the `./data` folder:

```bash
npx slpk-extractor --tileset="./path/to/the/file.slpk" --output="./data"
```
Then you can start serving dataset

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
