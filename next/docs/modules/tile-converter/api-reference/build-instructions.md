Tile converter / development

# Run the converter from the source tree.

Use these instructions when a repository branch contains a fix or capability that is not in the published package yet. Build the modules and workers, then choose the v5 CLI or legacy v4 workflow. The legacy workflow includes its elevation-model installer.

[Tile converter module](https://loaders.gl/next/docs/modules/tile-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter.md)[CLI reference](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter.md)[Bundle script](https://loaders.gl/next/docs/modules/tile-converter/api-reference/tile-converter-bundle.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/api-reference/tile-converter-bundle.md)

Source-tree workflow

## Build the exact converter version you need.

A source build is useful for testing current branch changes or a local patch. Keep the conversion depth bounded when working with a large remote dataset, then validate the generated output with the I3S server or a viewer.

01

Checkout

Clone the repository and select the branch to test.

02

Build

Install dependencies and build the required modules.

03

Prepare

Install or disable the Earth Gravity Model dependency.

04

Convert

Run a bounded conversion and inspect the generated dataset.

Detailed guide

## Build and run details

The detailed guide lists repository setup, build commands, elevation-model options, conversion examples, and local I3S serving steps.

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

Following steps are for running converter right on a repository branch. It might be helpful if latest changes from any repository branch are needed. E.g. if latest `master` branch has some important updates in `tile-converter` module or other module that `tile converter` module depends on, a user can run it. It doesn't need to wait for new release.

1. Using [yarn](https://yarnpkg.com/getting-started/install) instead of npm is recommended because it is general practice in vis.gl repos;

2. Clone the repository

```
git clone git@github.com:visgl/loaders.gl.git

cd loaders.gl
```

3. Install dependencies and build modules and workers

```
yarn install

yarn build

yarn build-workers
```

The Node.js Basis decoder and KTX2 encoder workers are CommonJS `.cjs` bundles. Run `yarn build-workers` again after rebuilding modules, which clears their output directories. Run `yarn test-tile-converter` to check the converter with local fixtures.

## Run the v5 CLI[​](#run-the-v5-cli "Direct link to Run the v5 CLI")

The repository build exposes the Node CLI directly:

```
node apps/tile-converter/bin/converter-v5.js inspect ./tileset.json

node apps/tile-converter/bin/converter-v5.js validate ./tileset.json --resource tile-root-content-0

node apps/tile-converter/bin/converter-v5.js convert ./tileset.json --resource tile-root-content-0 --output ./converted.3tz
```

Use content IDs reported by inspection. Add `--preserve-hierarchy` only when explicitly selecting every binary content within the qualified hierarchy limits. V5 does not use the legacy dependency installer; CRS and height preparation are explicit. See the [v5 CLI guide](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter-v5.md).

## Run the legacy v4 converter[​](#run-the-legacy-v4-converter "Direct link to Run the legacy v4 converter")

4. Install default Earth Gravity Model dependency:

```
npx tile-converter --install-dependencies
```

The dependency installer downloads workers and runtime libraries from the matching package version. If a download fails, the error includes the resource URL and HTTP status to help diagnose unavailable artifacts.

You can use custom Earth Gravity Model or disable it using `--egm` option.

5. [Convert some tileset](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter.md) Examples:

```
npx tile-converter --input-type 3dtiles --tileset ./modules/tiles-3d/test/3d-tiles/data/Batched/BatchedTextured/tileset.json --name BatchedTextured

npx tile-converter --input-type 3dtiles --tileset https://assets.ion.cesium.com/29328/tileset.json --name CairoLayer --max-depth 10
```

Notice "--max-depth" option. It means that the converter will load and convert only first 'n' (10 in example) levels of tiles. Use it for big tilesets when full conversion could take a lot of time. If you want to convert all the tileset, omit this option.

6. I3S layers can be used only as http service. There is local server to handle i3s layer

After conversion there are new i3s layers in output (default: "data") directory. Run it with the local web server:

```
I3sLayerPath="./data/CairoLayer" DEBUG=i3s-server:* npx i3s-server
```

7. Show converted layer on a map.

```
open https://loaders.gl/examples/i3s?url=http://localhost/SceneServer/layers/0
```

### Advanced[​](#advanced "Direct link to Advanced")

A. To show converted layer in a locally built loaders.gl example.

Run the front-end application from examples

```
cd examples/website/i3s

yarn

MapboxAccessToken=<TOKEN> yarn start-local
```

B. To run a custom layer in a web-browser manually

```
http://localhost:8080/?url=http://localhost/layers/0
```
