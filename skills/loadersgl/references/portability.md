# Runtime and geospatial boundaries

Browser-capable behavior is verified in Chromium. Use Node for genuine Node APIs;
avoid top-level Node-only imports in shared source. `fetchFile` handles browser and
Node input without requiring arbitrary direct filesystem imports.

Match browser package replacements to emitted files: source `.ts` and matching
`dist` `.js` paths must point to an existing browser shim or `false`.

For geospatial output, inspect CRS, axis order and returned geometry representation.
Do not assume projected coordinates are longitude/latitude or silently reproject
without inspecting the source contract. `gis` owns the minimal helpers loaders need
for returned geometries, including `geoarrow.wkb` columns. `geoarrow` owns richer
application conversion and processing APIs. Loaders must not import `geoarrow`.
