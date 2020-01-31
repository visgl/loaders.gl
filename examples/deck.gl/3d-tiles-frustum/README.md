This is a standalone web app using `@loaders.gl/3d-tiles`.

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
Start the application and pass the path to your local dataset as url parameter.

`localhost:8080/?tileset=data/<mytiles>/tileset.json`
