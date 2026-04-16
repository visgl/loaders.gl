# @loaders.gl/zarr

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders for the Zarr format.

## Exports

- `loadZarr()` and `ZarrPixelSource` for the existing pixel-pyramid API
- `OMEZarrSourceLoader` / `OMEZarrImageSource` for `createDataSource()` and `load()`
- `loadZarrConsolidatedMetadata()` for probing consolidated Zarr roots

## OME-Zarr SourceLoader

`OMEZarrSourceLoader` is the first source-loader abstraction in this module. It is image-first:

- it opens OME-Zarr image or label groups
- it normalizes multiscale metadata
- it reads 2D planes through `getRaster()`
- it requires consolidated metadata by default (`zarr.json`, `.zmetadata`, or `zmetadata`)

```ts
import {createDataSource} from '@loaders.gl/core';
import {OMEZarrSourceLoader} from '@loaders.gl/zarr';

const source = createDataSource('https://example.com/image.zarr', [OMEZarrSourceLoader], {
  omezarr: {}
});

const metadata = await source.getMetadata();
const raster = await source.getRaster({channels: [0, 1, 2]});
```

## Example: SpatialData-style root browsing

This mirrors the split used in SpatialData.js: first browse consolidated metadata at the store root, then open an image group with the source loader.

```ts
import {createDataSource} from '@loaders.gl/core';
import {loadZarrConsolidatedMetadata, OMEZarrSourceLoader} from '@loaders.gl/zarr';

const rootUrl = 'https://example.com/spatialdata.zarr';
const consolidated = await loadZarrConsolidatedMetadata(rootUrl);

console.log(consolidated.topLevelGroups);
// ['images', 'labels', 'points', 'shapes', 'tables']

const imageSource = createDataSource(rootUrl, [OMEZarrSourceLoader], {
  zarr: {
    path: 'images/example-image'
  },
  omezarr: {}
});

const imageMetadata = await imageSource.getMetadata();
```

For documentation please visit the [website](https://loaders.gl).
