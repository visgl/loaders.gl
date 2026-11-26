# @loaders.gl/geospatial

Geospatial loaders and writers for vector files, geometry encodings, and satellite orbit elements.

Supported formats: KML, KMZ, GPX, TCX, Shapefile, SHP, SHX, DBF, CPG, PRJ, FlatGeobuf, GeoPackage, WKT, WKT CRS, WKB, TWKB.


Proof of concept for [RFC #4248](https://github.com/visgl/loaders.gl/issues/4248).

This package owns the KML, Shapefile, FlatGeobuf, GeoPackage, and WKT/WKB implementations. Each format subpath exports loader metadata and types. Its bundled subpath exports the parser-bearing loader and writer APIs. Existing format packages forward to this package.

See [the POC guide](../../docs/developer-guide/grouped-packages.md) for examples, compatibility limits, and dependency tradeoffs.

SQL.js is an optional peer dependency. Install `sql.js` explicitly when using GeoPackage loaders or sources (`npm install @loaders.gl/geospatial sql.js`). KML, Shapefile, and FlatGeobuf do not require it. The `geopackage.sqlJsCDN` option controls WASM asset resolution.

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [Attributions and Credits](https://loaders.gl/docs/references-and-credits).
