# ArcGIS Feature Server

ArcGIS Feature Server endpoints expose vector feature layers through the ArcGIS REST API.

## loaders.gl Support

loaders.gl provides `ArcGISFeatureServerSourceLoader` as an experimental vector source loader for
ArcGIS `FeatureServer` layer endpoints. It can load layer metadata and query GeoJSON features for a
viewport.

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/services';

const source = createDataSource(url, [ArcGISFeatureServerSourceLoader], {
  core: {type: 'arcgis-feature-server'}
});

const metadata = await source.getMetadata();
const features = await source.getFeatures({
  layers: '0',
  boundingBox: [
    [-86, 36],
    [-84, 39]
  ]
});
```

## Example

- [ArcGIS Feature Server example](/examples/tiles/arcgis-feature-server)

## References

- [ArcGIS REST API Feature Service](https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm)
