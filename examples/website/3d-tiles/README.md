This is a standalone deck.gl app for exploring 3D Tiles and I3S with loaders.gl. It includes a
GPU "Tile Fold" deformation and an authored camera sequence.

The deformation is inspired by David Ronai's exceptional
[Dreamfold](https://dreamfold.netlify.app/) experiment. Dreamfold's
[MIT-licensed source](https://github.com/Makio64/dreamfold) explains the cylindrical bend and the
streaming challenges in depth.

### Usage

Copy the content of this folder to your project.

```bash
# install dependencies
yarn
# bundle and serve the app with Vite
yarn start
```

### Load a local dataset

Copy the dataset to `data` under `loaders.gl` root directory.
Start the application and pass the path to your local dataset as url parameter.

`localhost:8080/?tileset=data/<mytiles>/tileset.json`
