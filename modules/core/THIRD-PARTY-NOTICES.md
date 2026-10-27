# @loaders.gl/core: sources and credits

[Apache Arrow](https://github.com/apache/arrow-js) supplies the structure adapted by the Arrow-like type definitions in [schema-utils](./src/schema-utils/lib/table/arrow-api). Arrow is also a separately installed dependency. Apache-2.0 terms are included in [Apache-2.0](./third-party-licenses/Apache-2.0).

Karl Cheng's [binary-gltf-utils](https://github.com/Qantas94Heavy/binary-gltf-utils) (MIT, Copyright (c) 2016-17 Karl Cheng) supplied historical data-URI decoding. Vsevolod Strukchinsky's require-from-string is credited in [require-utils.node.ts](./src/polyfills/load-library/require-utils.node.ts). Axel Rauschmayer's async-iter-demo is the source of [async-queue.ts](./src/schema-utils/lib/utils/async-queue.ts). These MIT contributions are covered by the retained copyright notices and [MIT terms](./third-party-licenses/retained-MIT-LICENSE).

Legacy LAZ item algorithms adapt LASzip by rapidlasso GmbH: [Apache-2.0 license](./src/loader-utils/lib/laz/LASZIP-LICENSE) and [notice](./src/loader-utils/lib/laz/LASZIP-NOTICE). math.gl, probe.gl and Zod are separately installed foundations.

Gozala’s web-file and web-blob supplied historical File/Blob polyfills, recorded as MIT-licensed in their original source headers. GitHub’s fetch supplied the historical Headers polyfill: [MIT terms](./third-party-licenses/fetch-LICENSE). Anthum, Inc. supplied [fetch-progress-indicators](./src/lib/progress/fetch-progress.ts): [MIT terms](./third-party-licenses/fetch-progress-LICENSE). BTOdell’s path-resolve supplied [path resolution](./src/loader-utils/lib/path-utils/path.ts): [MIT terms](./third-party-licenses/path-resolve-LICENSE). Jesse Tane’s hex-transcoder supplied [hex conversion](./src/loader-utils/lib/binary-utils/hex-transcoder.ts), with MIT provenance recorded in the source.

Joshua Bell and text-encoding contributors supplied the [text-encoding polyfill and indexes](./src/polyfills/text-encoder), pinned in source comments to b4e5bc26e26e51f56e3daa9f13138c79f49d3c34: [upstream public-domain dedication and Encoding Standard reference](./third-party-licenses/text-encoding-LICENSE). The encoding indexes derive from WHATWG’s Encoding Standard; those data credits are distinct from original vis.gl code.

[triangulate-wkb.ts](./src/arrow-geometry/triangulate-wkb.ts) adapts Mapbox earcut (ISC, Copyright (c) 2016 Mapbox), adding outline/hole area inputs. The full ISC notice is retained in that source file.

Apache Arrow and math.gl are separately installed libraries. Their authors supply the columnar data and geometry foundations used by the adapters.

GeoArrow conversion and processing code is developed by vis.gl contributors using separately installed Apache Arrow and math.gl. The [GeoArrow community](https://geoarrow.org/) defines the geometry extension types and layouts used for interoperability.

Scan planning, predicate handling and federation are developed by vis.gl contributors. Separately installed Apache Arrow supplies the table representation. Source providers retain their own implementation and data credits.

Kyle Barron’s [GeoArrow work](https://github.com/geoarrow/geoarrow-js) inspired loaders.gl’s GeoArrow integration, conversion and processing work. We thank Kyle for this influence on loaders.gl’s geospatial Arrow support.

Christian Schwarz's wkx supplies retained TWKB adaptation in [src/twkb](./src/wkt/twkb): [full MIT license](./third-party-licenses/wkx-LICENSE).

Historical WKT parsing adapted Mapbox wellknown (ISC); current WKT/WKB/CRS codecs delegate to separately installed math.gl. Retained code and its notices follow their owning implementation even after package consolidation.

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
