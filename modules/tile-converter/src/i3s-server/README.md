# I3S server

The http server run on NodeJS ExpressJS framework.
The server provides I3S Rest endpoints per specification https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3Dobject_ReadMe.md#http-api-overview-17

## Usage

### Serve 3DTiles to I3S converted dataset

- Convert data set from 3DTiles to I3S without `--slpk` option
- Serve output folder

Example for path `./data/BatchTextured/SceneServer/layers/0/...`:

#### Start the server

```bash
PORT=8080 HTTPS_PORT=4443 I3sLayerPath="./data" DEBUG=i3s-server:* npx i3s-server
```
#### Check the layer availability

The layer should be available on URLs:

- `http://localhost:8080/BatchTextured/SceneServer/layers/0/...`
- `https://localhost:4443/BatchTextured/SceneServer/layers/0/...`

#### Open in ArcGIS

`https://www.arcgis.com/home/webscene/viewer.html?url=http://localhost:8080/BatchTextured/SceneServer/layers/0/`

#### Open in I3S Explorer

`https://i3s.loaders.gl/viewer?tileset=http://localhost:8080/BatchTextured/SceneServer/layers/0`

### Serve SLPK

Example for path `../datasets/Rancho_Mesh_mesh_v17_1.slpk`:

#### Start the server

```bash
PORT=8080 HTTPS_PORT=4443 I3sLayerPath="../datasets/Rancho_Mesh_mesh_v17_1.slpk" DEBUG=i3s-server:* npx i3s-server
```
#### Check the layer availability

The layer should be available on URLs:

- `http://localhost:8080/SceneServer/layers/0/...`
- `https://localhost:4443/SceneServer/layers/0/...`

#### Open in ArcGIS

`https://www.arcgis.com/home/webscene/viewer.html?url=http://localhost:8080/SceneServer`

#### Open in I3S Explorer

`https://i3s.loaders.gl/viewer?tileset=http://localhost:8080/SceneServer/layers/0`

## ENV variables

- `I3sLayerPath` - path to converted data or SLPK file.
- `PORT` - HTTP port. Eg for `PORT = 8080 npx i3s-server` the server will work on host `http://localhost:8080/...`. Default value is `80`;
- `HTTPS_PORT` - HTTPS port. Eg for `PORT = 4443 npx i3s-server` the server will work on host `https://localhost:4443/...`. Default value is `443`
