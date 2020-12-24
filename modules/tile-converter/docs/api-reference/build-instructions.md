# Build Instructions

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Following steps are for running converter right on a repository branch. It might be helpful if latest changes from any repository branch are needed. E.g. if latest `master` branch has some important updates in `tile-converter` module or other module that `tile converter` module depends on, a user can run it. It doesn't need to wait for new release.

1. Using [yarn](https://yarnpkg.com/getting-started/install) instead of npm is recommended because it is general practice in vis.gl repos;

2. Clone the repository

```
git clone git@github.com:visgl/loaders.gl.git
cd loaders.gl
```

3. Build modules

```
yarn bootstrap
```

4. Install default Earth Gravity Model dependency:

```
npx tile-converter --install-dependencies
```

You can use custom Earth Gravity Model using `--egm` option.

5. [Convert some tileset](modules/tile-converter/docs/cli-reference/tile-converter.md)
   Examples:

```
npx tile-converter --input-type 3dtiles --tileset ./modules/3d-tiles/test/data/Batched/BatchedTextured/tileset.json --name BatchedTextured
npx tile-converter --input-type 3dtiles --tileset https://assets.cesium.com/29328/tileset.json --name CairoLayer --max-depth 10
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

### Advanced

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
