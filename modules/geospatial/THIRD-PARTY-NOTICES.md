# @loaders.gl/geospatial: sources and credits

Björn Harrtell's [FlatGeobuf](https://github.com/flatgeobuf/flatgeobuf) supplies adapted reader code in [src/flatgeobuf](./src/flatgeobuf), under the retained [BSD-2-Clause license](./src/flatgeobuf/LICENSE).

The GeoPackage adapter uses separately installed [SQL.js](https://github.com/sql-js/sql.js), which compiles SQLite to WebAssembly. Shapefile parsing was developed for loaders.gl; the presence of upstream shapefile test fixtures does not mean the production parser was copied from them. math.gl and Apache Arrow provide separately installed geometry and table foundations.

## Scope and maintenance

Original loaders.gl contributions are covered by [LICENSE](./LICENSE). The upstream
notices above apply to their respective portions and do not change those terms.
Source adaptations, separately installed libraries, format definitions and test
data are different contributions. This index is not a transitive dependency
bill of materials. Runtime dependencies can bring additional notices.

Version information is recorded where the repository preserves it. Unpinned
historical ports are identified by retained source and Git history; no upstream
version is inferred from a current dependency. Keep copyright headers, full
terms, source/version information and material modification notes when updating.
Retain this file and the applicable licenses when redistributing bundles or workers.
