This is a standalone web app using `@loaders.gl/i3s-tiles`.

### Usage

Copy the content of this folder to your project.

```bash
# install dependencies
yarn
# bundle and serve the app with webpack
yarn start-local  # or yarn start
```

### Load a local dataset

Copy the dataset to `data` under `loaders.gl` root directory.

`localhost:8080` - render with `deck.gl`
`localhost:8080/?cesium=true` - render with `deck.gl` and `cesium` side by side
