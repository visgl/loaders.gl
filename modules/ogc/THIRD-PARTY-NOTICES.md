# @loaders.gl/ogc: sources and credits

OGC service adapters are developed by vis.gl contributors against the OGC service specifications. [deep-strict-equal.ts](./src/wms/lib/parsers/gml/deep-strict-equal.ts) retains Thomas Robinson's 2009 MIT notice and full terms for adapted assertion comparison code.

OpenLayers-origin fixtures are credited in the repository test data. Those fixtures are separate from production runtime code. math.gl and lerc are separately installed dependencies.

derhuerst’s parse-gml-polygon supplies adapted [GML polygon parsing](./src/wms/lib/parsers/gml/parse-gml.ts): [ISC terms](./third-party-licenses/parse-gml-polygon-LICENSE).

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
