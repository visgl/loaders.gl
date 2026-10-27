# @loaders.gl/tiles: sources and credits

Mapbox vector-tile-js supplies the adapted MVT reader: [full BSD-3-Clause license](./src/mvt/lib/vector-tile/LICENSE.txt). Vladimir Agafonkin's geojson-vt supplies vector tiling: [full ISC license](./src/mvt/lib/vector-tiler/LICENSE).

Anand Thakker's vt-pbf supplies adapted MVT writing in [src/mvt/lib/mapbox-vt-pbf](./src/mvt/lib/mapbox-vt-pbf) and [write-mvt-to-pbf.ts](./src/mvt/lib/mvt-pbf/write-mvt-to-pbf.ts): [full MIT terms](./third-party-licenses/vt-pbf-LICENSE).

Protomaps PMTiles, MapLibre MLT, pbf, math.gl, Apache Arrow, probe.gl and Zod are separately installed dependencies. Brandon Liu and the Protomaps community, MapLibre contributors, and the upstream codec authors deserve credit for these foundations.

Kepler.gl contributors supplied indexed-attribute handling retained in [parse-tilejson.ts](./src/mvt/lib/parse-tilejson.ts): [MIT terms](./third-party-licenses/kepler-LICENSE).

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
