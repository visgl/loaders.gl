---
title: Arrow geometry module
---

# Arrow geometry builders

`@loaders.gl/arrow-geometry` builds Arrow-compatible geometry arrays and
triangulates WKB geometry. It supplies shared construction primitives to other
loaders.gl modules.

```bash
npm install @loaders.gl/arrow-geometry
```

| API | Purpose |
| --- | --- |
| `GeoArrowBuilder` | Writes native GeoArrow geometry with configurable dimensions and coordinate layout. |
| `WKBBuilder` | Writes WKB geometry arrays with associated Arrow-compatible buffers. |
| `triangulateWKB` | Triangulates polygonal WKB geometry. |

Applications that need table conversion, validation, coordinate transforms, or
spatial indexing should start with [GeoArrow processing](/docs/modules/geoarrow).
Loader authors should use the public helpers exposed by
[`@loaders.gl/gis`](/docs/modules/gis) for constructing returned geometry columns.
