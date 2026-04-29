import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';

# ArcGIS Image Server

<WmsDocsTabs active="arcgis-image-server" />

ArcGIS Image Server endpoints expose raster imagery and image services through the ArcGIS REST API.

## loaders.gl Support

loaders.gl provides `_ArcGISImageServerSourceLoader` as an experimental image source loader for
ArcGIS `ImageServer` endpoints. It can load service metadata and request exported images for a
viewport.

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {_ArcGISImageServerSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(url, [_ArcGISImageServerSourceLoader], {
  core: {type: 'arcgis-image-server'}
});

const metadata = await source.getMetadata();
const image = await source.getImage({
  layers: '0',
  boundingBox: [
    [-124, 32],
    [-114, 42]
  ],
  width: 1024,
  height: 768
});
```

## Example

- [ArcGIS Image Server example](/examples/tiles/arcgis-image-server)

## References

- [ArcGIS REST API Image Service](https://developers.arcgis.com/rest/services-reference/enterprise/image-service.htm)
