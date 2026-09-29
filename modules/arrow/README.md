# @loaders.gl/arrow

This module contains a table loader for the Apache Arrow format.

[loaders.gl](https://loaders.gl/docs) is a collection of loaders for big data visualizations.

For documentation please visit the [website](https://loaders.gl).

## Geometry utilities

Import the shared WKB and GeoArrow builders and WKB triangulation helpers from the geometry subpath:

```ts
import {GeoArrowBuilder, WKBBuilder, triangulateWKB} from '@loaders.gl/arrow/geometry';
```

These utilities are also used by GIS-aware loaders to construct Arrow geometry columns without
depending on GIS conversion APIs.
