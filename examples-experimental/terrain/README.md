# terrain

Render image-encoded terrain with loaders.gl and deck.gl.

Supported formats: Mapbox Terrain-RGB, PNG.

This an example of using the `TerrainLoader`
on [deck.gl](http://deck.gl) website.

### Usage

Copy the content of this folder to your project. 

This examples uses mapbox as a terrain source. To load the terrain tiles, you need a [Mapbox access token](https://docs.mapbox.com/help/how-mapbox-works/access-tokens/). You can either set an environment variable:	

```bash	
export MapboxAccessToken=<mapbox_access_token>	
```	

Or set `MAPBOX_TOKEN` directly in `app.js`.

```bash
# install dependencies
npm install
# or
yarn
# bundle and serve the app with webpack
npm start
```

### Data format

Mapbox's [terrain API](https://docs.mapbox.com/help/troubleshooting/access-elevation-data/#mapbox-terrain-rgb) encodes elevation data in raster tiles.

To use other data sources, check out
the [documentation of TerrainLayer](https://deck.gl/docs/api-reference/geo-layers/terrain-layer).

Use Node.js 20.19+ or 22.12+. Run `npm install --legacy-peer-deps` and `npm start` in this directory. The current published loader beta has peer ranges that conflict with its matching dependencies. Use `npm run build` for a production build.

Set `VITE_MAPBOX_ACCESS_TOKEN` to a Mapbox access token for terrain imagery.
