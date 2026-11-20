# Tile-converter create and push docker image

## Create the legacy v4 Docker image

The repository Dockerfile still bundles v4, not the default v5 npm command.

### Go to the root project folder

```bash
cd loaders.gl
```

### Select branch to create docker image (x.x-release or some commit from master branch for alpha release)

```bash
git checkout x.x-release
```

### Build the project

```bash
yarn install
yarn build
yarn workspace @loaders.gl/tile-converter build-converter-bundle
```

### Create docker images for latest and needed release

```bash
  sudo docker build -t visgl/tile-converter:latest -f apps/tile-converter/Dockerfile .
  sudo docker build -t visgl/tile-converter:vX.X.X -f apps/tile-converter/Dockerfile .
```

### Docker Login (Dockerhub: [tile-converter](https://hub.docker.com/repository/docker/visgl/tile-converter/general))

```bash
sudo docker login
```

### Push docker images to the Dockerhub

```bash
sudo docker push visgl/tile-converter:latest
sudo docker push visgl/tile-converter:vX.X.X
```

# Tile-converter pull and run docker image

## Pull docker image from Dockerhub

```bash
docker pull visgl/tile-converter:version
```

## Run Tile-converter

```bash
docker run --rm -v /path/to/output_folder:/loaders-bundle/data -v /path/to/input-tileset:/loaders-bundle/input-data  visgl/tile-converter --input-type 3dtiles --token ...  --tileset input-data/tileset.json  --name ... --output data --max-depth 3
```

### Description of arguments

- **--rm** Remove container after conversion
- **-v** Create docker volume, linked to internal data folder
- **visgl/tile-converter:version** Image name
- Converter options are documented in the [legacy v4 CLI reference](../../docs/modules/tile-converter/cli-reference/tile-converter.md).
