# Tile-converter create and push docker image

The [tile-converter release workflow](https://github.com/visgl/loaders.gl/blob/master/.github/workflows/tile-converter-release.yml) builds the npm package and Docker image from `apps/tile-converter`. Use the manual steps below when you need to validate changes locally or publish custom tags.

## Create Docker image

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
yarn bootstrap
```

### Create docker images for latest and needed release (for alpha releases use node 14 in Dockerfile)

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
- Converter options (described here: docs/modules/tile-converter/cli-reference/tile-converter.md)
