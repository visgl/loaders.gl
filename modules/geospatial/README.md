# @loaders.gl/geospatial

Proof of concept for [RFC #4248](https://github.com/visgl/loaders.gl/issues/4248).

This package owns the KML, Shapefile, FlatGeobuf, and GeoPackage implementations. Its root exports metadata-only loaders, writer APIs, and shared types. Import a format subpath for its parser-bearing loader. Existing format packages forward to this package.

See [the POC guide](../../docs/developer-guide/grouped-packages.md) for examples, compatibility limits, and dependency tradeoffs.

SQL.js is an optional peer dependency. Install `sql.js` explicitly when using GeoPackage loaders or sources (`npm install @loaders.gl/geospatial sql.js`). KML, Shapefile, and FlatGeobuf do not require it. The `geopackage.sqlJsCDN` option controls WASM asset resolution.

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).
