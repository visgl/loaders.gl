# Tile-converter create and push docker image

## Create Docker image

### Go to the root project folder
```
cd loaders.gl project
```
### Select branch to create docker image (release-x.x.x or some commit from master branch for alpha release)
```
git chekout release-x.x.x
```
### Build the project
```
yarn bootstrap
```

### Create docker images for latest and needed release (for aplha releases use node 14 in Dockerfile)
```
  sudo docker build -t visgl/tile-converter:latest -f modules/tile-converter/Dockerfile .
  sudo docker build -t visgl/tile-converter:vX.X.X -f modules/tile-converter/Dockerfile .
```
### Docker Login (Dockerhub: https://hub.docker.com/repository/docker/visgl/tile-converter/general)
```
sudo docker login
```

### Push docker images to the Dockerhub
```
sudo docker push visgl/tile-converter:latest
sudo docker push visgl/tile-converter:vX.X.X
```
# Tile-converter pull and run docker image

### Pull docker image from Dockerhub
```
docker pull visgl/tile-converter:version
```

### Run Tile-converter
```
docker run --rm -v /path/to/output_folder:/loaders-bundle/data visgl/tile-converter --input-type 3dtiles --token ...  --tileset ...  --name ... --output data --max-depth 3
```

#### Description of arguments:
- **--rm**              Remove container after conversion
- **-v**                Create docker volume, linked to internal data folder
- **visgl/tile-converter:version**           Image name
- Converter options (described here: modules/tile-converter/docs/cli-reference/tile-converter.md)
