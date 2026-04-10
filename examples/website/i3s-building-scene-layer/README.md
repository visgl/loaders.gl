This is a standalone web app using `@loaders.gl/i3s-tiles`.

### Usage

Copy the content of this folder to your project.

```bash
# install dependencies
yarn
# bundle and serve the app with webpack
yarn start-local  # or yarn start
```

### Load a dataset from a tiling server

After starting the app, which served at `http://localhost:8080` by default, you can load the tileset from browser url

`http://localhost:8080/?url=https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0`

If you need a token to access your tileset, you can pass it from the url
`http://localhost:8080/?url=<url>&token=<access-token>`
