# @loaders.gl/raster: sources and credits

Fabian Schindler and [geotiff.js contributors](https://github.com/geotiffjs/geotiff.js) supply the separately installed compatibility decoder. The current numeric TIFF core is developed in loaders.gl; comments identify compatibility references.

Vladimir Agafonkin's MARTINI 0.2.0 is vendored unchanged: [source/version/hash](./src/terrain/libs/README.md), [ISC license](./src/terrain/libs/martini-LICENSE). Michael Fogleman and Vladimir Agafonkin's Delatin is adapted in [src/terrain/lib/delatin](./src/terrain/lib/delatin); [full ISC terms](./third-party-licenses/delatin-LICENSE).

HERE Europe B.V.'s quantized-mesh-decoder supplies [decode-quantized-mesh.ts](./src/terrain/lib/decode-quantized-mesh.ts), including full MIT terms. Esri's LERC supplies retained decoder code with its [Apache-2.0 license](./src/lerc/libs/lerc/LICENSE); the separately installed lerc package is another runtime integration.

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
