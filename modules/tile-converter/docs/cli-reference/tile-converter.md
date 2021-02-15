## Tile converter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `tile-converter` is a command line utility (CLI) for two-way batch conversion between the OGC 3D Tiles and the I3S formats. It can load the tileset to be converted directly from an URL.

## Installation

```bash
$ npm i @loaders.gl/tile-converter
```

Installing `@loaders.gl/tile-converter` makes the `converter` command line tool available. It can be run using `npx`.

```bash
$ npx tile-converter --install-dependencies
```

```bash
$ npx tile-converter --input-type <I3S | 3DTILES> --tileset <tileset> --name <tileset name> [--output <output folder>] [--draco] [--max-depth 4] [--slpk] [--7zExe <path/to/7z.exe>] [--token <ION token>] [--egm <pat/to/*.pgm>]
```

```bash
$ npx tile-converter --help
```

## Options

| Option               | 3DTiles to I3S conversion | I3S to 3DTiles conversion | Description                                                                                                                                                                                                                                          |
| -------------------- | ------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| install-dependencies |                           |                           | Run the script for installing dependencies. Run this options separate from others. Now "\*.pgm" file installation is implemented                                                                                                                     |
| input-type           | \*                        | \*                        | "I3S" - for I3S to 3DTiles conversion, "3DTILES" for 3DTiles to I3S conversion                                                                                                                                                                       |
| tileset              | \*                        | \*                        | "tileset.json" file (3DTiles) / "http://..../SceneServer/layers/0" resource (I3S)                                                                                                                                                                    |
| output               | \*                        | \*                        | Output folder. This folder will be created by converter if doesn't exist. It is relative to the converter path. Default: "data" folder                                                                                                               |
| name                 | \*                        | \*                        | Tileset name. This option is used for naming in resulting json resouces and for resulting path/\*.slpk file naming                                                                                                                                   |
| max-depth            | \*                        | \*                        | Maximal depth of the hierarchical tiles tree traversal, default: infinite                                                                                                                                                                            |
| slpk                 | \*                        |                           | Whether the converter generate \*.slpk (Scene Layer Packages) I3S output file                                                                                                                                                                        |
| 7zExe                | \*                        |                           | location of 7z.exe archiver to create slpk on Windows OS, default: "C:\\Program Files\\7-Zip\\7z.exe"                                                                                                                                                |
| egm                  | \*                        | \*                        | location of the Earth Gravity Model (\*.pgm) file to convert heights from ellipsoidal to gravity-related format, default: "./deps/egm2008-5.pgm". A model file can be loaded from GeographicLib https://geographiclib.sourceforge.io/html/geoid.html |
| token                | \*                        |                           | Token for Cesium ION tilesets authentication                                                                                                                                                                                                         |
| no-draco             | \*                        |                           | Disable draco compression for geometry. Default: not set                                                                                                                                                                                             |
| help                 | \*                        | \*                        | Show the converter tool options list                                                                                                                                                                                                                 |

## Running local server to handle i3s layer.

After conversion there are new i3s layers in output ("data" in example) directory.

Run it with the local web server from project directory:

```bash
$ I3sLayerPath="./data/CairoLayer" DEBUG=i3s-server:* npx i3s-server
```

## Show converted layer on a map.

open https://loaders.gl/examples/i3s?url=http://localhost/SceneServer/layers/0
