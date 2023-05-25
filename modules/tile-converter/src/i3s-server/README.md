# I3S server

The http server run on NodeJS ExpressJS framework.
The server provides I3S Rest endpoints per specification https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3Dobject_ReadMe.md#http-api-overview-17

## Usage

### Serve 3DTiles to I3S converted dataset

- Convert data set from 3DTiles to I3S without `--slpk` option
- Serve output folder `I3sLayerPath="./data/BatchedTextured" DEBUG=i3s-server:* npx i3s-server`

### Serve SLPK

- Serve slpk file `I3sLayerPath="../datasets/Rancho_Mesh_mesh_v17_1.slpk" DEBUG=i3s-server:* npx i3s-server`

## ENV variables

- `I3sLayerPath` - path to converted data or SLPK file.
