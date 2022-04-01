## Tile converter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
  <a href="https://badge.fury.io/js/%40loaders.gl%2Ftile-converter">
    <img src="https://badge.fury.io/js/%40loaders.gl%2Ftile-converter.svg" alt="npm version" height="18" />
  </a>
  <a href="https://hub.docker.com/r/visgl/tile-converter/tags">
    <img alt="Dockerhub" src="https://img.shields.io/docker/v/visgl/tile-converter?label=dockerhub" />
  </a>
</p>

The `tile-converter` is a command line utility (CLI) for two-way batch conversion between [I3S](https://www.ogc.org/standards/i3s) and [3D Tiles](https://www.ogc.org/standards/3DTiles), both an OGC community standard. It can load tilesets to be converted directly from an URL or file based formats.

## Installation

The tile-converter is published as an npm module and as a docker image.

Installing `@loaders.gl/tile-converter` from npm makes the `tile-converter` command line tool available. It can be run using `npx`.

```bash
$ npm i @loaders.gl/tile-converter
```

```bash
$ npx tile-converter --install-dependencies
```

```bash
$ npx tile-converter --input-type <I3S | 3DTILES> --tileset <tileset> --name <tileset name> [--output <output folder>] [--draco] [--max-depth 4] [--slpk] [--7zExe <path/to/7z.exe>] [--token <ION token>] [--egm <pat/to/*.pgm>]
```

```bash
$ npx tile-converter --help
```

Alternatively, to download the `tile-converter` docker image, run:

```bash
$ docker pull visgl/tile-converter
```

## Supported Platforms

Works only on NodeJS.

## Options

| Option                    | 3DTiles to I3S conversion | I3S to 3DTiles conversion | Description                                                                                                                                                                                                                                          |
| ------------------------- | ------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| install-dependencies      |                           |                           | Run the script for installing dependencies. Run this options separate from others. Now "\*.pgm" file installation is implemented                                                                                                                     |
| input-type                | \*                        | \*                        | "I3S" - for I3S to 3DTiles conversion, "3DTILES" for 3DTiles to I3S conversion                                                                                                                                                                       |
| tileset                   | \*                        | \*                        | "tileset.json" file (3DTiles) / "http://..../SceneServer/layers/0" resource (I3S)                                                                                                                                                                    |
| output                    | \*                        | \*                        | Output folder. This folder will be created by converter if doesn't exist. It is relative to the converter path. Default: "data" folder                                                                                                               |
| name                      | \*                        | \*                        | Tileset name. This option is used for naming in resulting json resouces and for resulting path/\*.slpk file naming                                                                                                                                   |
| max-depth                 | \*                        | \*                        | Maximal depth of the hierarchical tiles tree traversal, default: infinite                                                                                                                                                                            |
| slpk                      | \*                        |                           | Whether the converter generates \*.slpk (Scene Layer Package) I3S output file                                                                                                                                                                        |
| 7zExe                     | \*                        |                           | location of 7z.exe archiver to create slpk on Windows OS, default: "C:\\Program Files\\7-Zip\\7z.exe"                                                                                                                                                |
| egm                       | \*                        | \*                        | location of the Earth Gravity Model (\*.pgm) file to convert heights from ellipsoidal to gravity-related format, default: "./deps/egm2008-5.pgm". A model file can be loaded from GeographicLib https://geographiclib.sourceforge.io/html/geoid.html |
| token                     | \*                        |                           | Token for Cesium ION tileset authentication.                                                                                                                                                                                                         |
| no-draco                  | \*                        |                           | Disable draco compression for geometry. Default: not set                                                                                                                                                                                             |
| generate-textures         | \*                        |                           | Enable KTX2 textures generation if only one of (JPG, PNG) texture is provided or generate JPG texture if only KTX2 is provided                                                                                                                       |
| generate-bounding-volumes | \*                        |                           | Will generate obb and mbs bounding volumes from geometry                                                                                                                                                                                             |
| help                      | \*                        | \*                        | Show the converter tool options list        
| validate                      | \*                        |                         |<ul style="padding-left: 14px"> <li>Perform counting of all tiles and tiles with "ADD" type of refinement </li> <li>Check whether a particular child node fits into the parent one or not. If not, warn about it </li></ul>                                                                                                                                                                                                                            |

## Running local server to handle i3s layer.

After conversion there are new i3s layers in output ("data" in example) directory.

Run it with the local web server from project directory:

```bash
$ I3sLayerPath="./data/CairoLayer" DEBUG=i3s-server:* npx i3s-server
```

## Docker image

The tile converter is available as a docker image in the [visgl/tile-converter](https://hub.docker.com/r/visgl/tile-converter/tags) dockerhub repo.

To download the tile-converter docker image, run:

```bash
$ docker pull visgl/tile-converter
```

To use converter run:

```bash
$ docker run
  -v /path/to/output_folder:/loaders-bundle/data \
  --rm \
  visgl/tile-converter \
  --input-type ... \
  --token ... \
  --tileset ... \
  --name ... \
  --output ... \
  --max-depth ...
```

Docker run arguments:

-v - Create docker volume, linked to internal data folder

--rm - Remove container after conversion

visgl/tile-converter - Image name

To build your own tile-converter docker image:

- Clone [loaders.gl](https://github.com/visgl/loaders.gl) project.
- In root folder of the project run:

```bash
  $ yarn bootstrap
  $ docker build -t [docker_image_name] -f modules/tile-converter/Dockerfile .
```

- Push docker image to your docker hub

## Show converted layer on a map.

open https://loaders.gl/examples/i3s?url=http://localhost/SceneServer/layers/0
