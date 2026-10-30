# References and credits

loaders.gl brings together work by many people: original loaders and integration code,
carefully adapted parsers, independently maintained codecs, open specifications, and
sample data generously shared for testing and examples. We thank the authors and
communities who make this possible. Their work deserves recognition wherever it
continues to be used, including after a dependency is removed, a parser is rewritten,
or packages are consolidated.

This page credits implementation, ideas, technical advice, standards and data as
separate contributions. The package inventories below identify retained source and
applicable notices. An algorithm reference or a compatible API does not by itself
mean that an upstream implementation was copied.

## Package source inventory

The links below lead to the `THIRD-PARTY-NOTICES.md` shipped with each published
package. They describe adaptations, separately installed libraries and retained
license locations. Original vis.gl code uses the MIT license; adapted portions
retain their own terms. These inventories cover loaders.gl's direct implementation
lineage, rather than every transitive npm dependency.

| Package | Sources and contributions |
| --- | --- |
| [arcgis](https://github.com/visgl/loaders.gl/blob/master/modules/arcgis/THIRD-PARTY-NOTICES.md) | ArcGIS REST specifications; separately installed LERC. |
| [archives](https://github.com/visgl/loaders.gl/blob/master/modules/archives/THIRD-PARTY-NOTICES.md) | T. Jameson Little’s tar-js; original ZIP and indexed archive APIs. |
| [compression](https://github.com/visgl/loaders.gl/blob/master/modules/compression/THIRD-PARTY-NOTICES.md) | Arjun Barrett’s fflate; Pierre Curto’s LZ4; optional codec providers. |
| [config](https://github.com/visgl/loaders.gl/blob/master/modules/config/THIRD-PARTY-NOTICES.md) | Original YAML/TOML parsing against community specifications. |
| [core](https://github.com/visgl/loaders.gl/blob/master/modules/core/THIRD-PARTY-NOTICES.md) | Apache Arrow; Mapbox earcut; Kyle Barron’s GeoArrow work; Karl Cheng’s binary-gltf-utils; Axel Rauschmayer’s async queue; Vsevolod Strukchinsky’s require-from-string; LASzip; Christian Schwarz’s wkx/TWKB; original scans. |
| [crypto](https://github.com/visgl/loaders.gl/blob/master/modules/crypto/THIRD-PARTY-NOTICES.md) | Brian Todd Button’s md5-wasm; jsdom abab; CRC32 inspiration from wqli78; hash integration. |
| [draco](https://github.com/visgl/loaders.gl/blob/master/modules/draco/THIRD-PARTY-NOTICES.md) | Google Draco 1.5.7 runtimes and adapted Web IDL types. |
| [geospatial](https://github.com/visgl/loaders.gl/blob/master/modules/geospatial/THIRD-PARTY-NOTICES.md) | Björn Harrtell’s FlatGeobuf; SQL.js/SQLite; original shapefile parsing. Christian Schwarz’s wkx/TWKB; historical Mapbox wellknown; current math.gl codecs. |
| [graphs](https://github.com/visgl/loaders.gl/blob/master/modules/graphs/THIRD-PARTY-NOTICES.md) | Original graph loaders; fast-xml-parser and Apache Arrow. |
| [images](https://github.com/visgl/loaders.gl/blob/master/modules/images/THIRD-PARTY-NOTICES.md) | Karl Cheng’s binary image utilities; Sindre Sorhus and file-type contributors. |
| [ogc](https://github.com/visgl/loaders.gl/blob/master/modules/ogc/THIRD-PARTY-NOTICES.md) | OGC specifications; Thomas Robinson’s comparison utility; separate OpenLayers fixtures. |
| [pointclouds](https://github.com/visgl/loaders.gl/blob/master/modules/pointclouds/THIRD-PARTY-NOTICES.md) | Uday Verma and Howard Butler’s Plasio; laz-perf, laz-rs and rapidlasso’s LASzip. Filipe Caixeta, Mugen87 and three.js PCDLoader contributors. Wei Meng and three.js PLYLoader contributors. |
| [raster](https://github.com/visgl/loaders.gl/blob/master/modules/raster/THIRD-PARTY-NOTICES.md) | geotiff.js; Esri’s LERC; Vladimir Agafonkin’s MARTINI; Michael Fogleman and Vladimir Agafonkin’s Delatin; HERE’s quantized-mesh-decoder. |
| [scene](https://github.com/visgl/loaders.gl/blob/master/modules/scene/THIRD-PARTY-NOTICES.md) | Original scene loaders; Pixar and OpenUSD format work. Benjamin Wasty’s gltf-loader-ts types; Arseny Kapoulkine’s meshoptimizer. Ricardo Cabello (mrdoob) and three.js OBJLoader contributors. |
| [scientific](https://github.com/visgl/loaders.gl/blob/master/modules/scientific/THIRD-PARTY-NOTICES.md) | cheminfo/netcdfjs; Michaël Zasso’s IOBuffer; zarrita.js and zarr.js. |
| [services](https://github.com/visgl/loaders.gl/blob/master/modules/services/THIRD-PARTY-NOTICES.md) | Original service abstractions and adapters; provider specifications. |
| [splats](https://github.com/visgl/loaders.gl/blob/master/modules/splats/THIRD-PARTY-NOTICES.md) | Original splat loaders; community format and research foundations. |
| [sql](https://github.com/visgl/loaders.gl/blob/master/modules/sql/THIRD-PARTY-NOTICES.md) | DuckDB runtimes; Apache Arrow; original source adapters. |
| [tables](https://github.com/visgl/loaders.gl/blob/master/modules/tables/THIRD-PARTY-NOTICES.md) | Matthew Holt’s PapaParse; Nuno Job and Isaac Schlueter’s Clarinet; ironSource’s parquetjs/parquets; Hyperparam’s hyparquet; parquet-wasm and SheetJS; historical BSON fixtures; advice from Paul Taylor. |
| [textures](https://github.com/visgl/loaders.gl/blob/master/modules/textures/THIRD-PARTY-NOTICES.md) | Tarek Sherif’s PicoGL; Binomial’s Basis Universal; Crunch; Tim van Scherpenzeel’s texture-compressor. |
| [tiles](https://github.com/visgl/loaders.gl/blob/master/modules/tiles/THIRD-PARTY-NOTICES.md) | Mapbox vector-tile-js; Vladimir Agafonkin’s geojson-vt; Anand Thakker’s vt-pbf; Protomaps PMTiles and MapLibre MLT. |
| [tiles-3d](https://github.com/visgl/loaders.gl/blob/master/modules/tiles-3d/THIRD-PARTY-NOTICES.md) | CesiumJS ports and collaboration; Markus Schütz’s Potree; Connor Manning’s copc.js lineage; Esri I3S and converter contributions. |
| [traces](https://github.com/visgl/loaders.gl/blob/master/modules/traces/THIRD-PARTY-NOTICES.md) | Trace format communities; Buf protobuf runtime; original parsers. |
| [video](https://github.com/visgl/loaders.gl/blob/master/modules/video/THIRD-PARTY-NOTICES.md) | Yahoo gifshot; Anthony Dekker’s NeuQuant; Kevin Weiner and Thibault Imbert. |
| [xml](https://github.com/visgl/loaders.gl/blob/master/modules/xml/THIRD-PARTY-NOTICES.md) | Isaac Schlueter’s sax-js through Maxim Mazurok’s sax-ts; fast-xml-parser. |

The separately published [tile-converter application](https://github.com/visgl/loaders.gl/blob/master/apps/tile-converter/THIRD-PARTY-NOTICES.md)
also includes a notice inventory crediting Esri’s development contribution, loaders.gl
foundations, and application libraries.

Some format documentation retains historical module names such as CSV, MVT and
Potree. The inventory follows their current package owners. Source provenance
follows the code across these moves. Private `deck-layers` integration code also
builds on the separately installed deck.gl and luma.gl projects.

## Tables, streaming parsers and scientific arrays

- **Matthew Holt and PapaParse contributors** developed
  [PapaParse](https://github.com/mholt/PapaParse), the foundation of the adapted CSV
  parser. loaders.gl's streaming and table interfaces build on that work; they do
  not replace its authorship. The source records the original 5.0.0-beta.0 fork.
- **Nuno Job, Isaac Z. Schlueter and Clarinet contributors** supplied
  [Clarinet](https://github.com/dscape/clarinet), the streaming JSON parser retained
  with its BSD notice. This parser supports incremental processing of large JSON
  and GeoJSON documents.
- **ironSource and the parquetjs/parquets contributors** supplied the original
  [parquetjs](https://github.com/ironSource/parquetjs) and
  [parquets](https://github.com/kbajalc/parquets) implementation.
  **Hyperparam contributors** supplied [hyparquet](https://github.com/hyparam/hyparquet)
  delta-decoder adaptations. **Kyle Barron and parquet-wasm contributors** supply
  the optional [parquet-wasm](https://github.com/kylebarron/parquet-wasm) backend.
  The [parquet-go](https://github.com/xitongsys/parquet-go) project inspired earlier
  documentation; that reference is separate from the JavaScript parser's MIT license.
- **Apache Arrow contributors** develop the columnar memory format, IPC format and
  [Arrow JavaScript](https://github.com/apache/arrow-js) implementation that make
  cross-library table exchange possible. Some Arrow-like type definitions were
  adapted from ArrowJS and retain Apache-2.0 terms. **Paul Taylor at Graphistry**
  provided extensive technical advice for loaders.gl's Arrow integration.
- **Kyle Barron’s [GeoArrow work](https://github.com/geoarrow/geoarrow-js)** inspired
  loaders.gl’s GeoArrow integration and its geospatial Arrow conversion and
  processing APIs. We thank Kyle for helping establish these foundations.
- **MongoDB's [js-bson contributors](https://github.com/mongodb/js-bson)** supplied historical BSON fixtures and the serializer used for wire-reference tests. BSON decoding and encoding are now implemented natively.
- **SheetJS contributors** supply the optional [spreadsheet](https://github.com/SheetJS/sheetjs) implementation.
- **cheminfo/netcdfjs contributors** supplied the adapted
  [NetCDF parser](https://github.com/cheminfo/netcdfjs).
  **Michaël Zasso and IOBuffer contributors** supplied the
  [binary buffer reader](https://github.com/image-js/iobuffer) used by that parser.
- **Trevor Manz and zarrita.js contributors**, **Gerrit Zuidhof and zarr.js
  contributors**, and the **Zarr and OME communities** supply
  [zarrita.js](https://github.com/manzt/zarrita.js),
  [zarr.js](https://github.com/gzuidhof/zarr.js), and the array and multiscale
  conventions used by the scientific sources.
- **Isaac Z. Schlueter and sax-js contributors**, through **Maxim Mazurok's sax-ts
  TypeScript fork**, supplied the retained SAX parser. **Natural Intelligence and
  fast-xml-parser contributors** supply the alternate XML implementation.

## Geospatial formats, vector tiles and terrain

- **Vladimir Agafonkin and Mapbox contributors** supplied
  [vector-tile-js](https://github.com/mapbox/vector-tile-js),
  [geojson-vt](https://github.com/mapbox/geojson-vt), and
  [earcut](https://github.com/mapbox/earcut). These implementations underpin retained
  MVT decoding, vector tiling and triangulation code. **Anand Thakker's
  [vt-pbf](https://github.com/mapbox/vt-pbf)** supplied adapted vector-tile writing.
- **Björn Harrtell and FlatGeobuf contributors** supplied the adapted
  [FlatGeobuf](https://github.com/flatgeobuf/flatgeobuf) reader. Its BSD-2-Clause
  notice remains with the retained code.
- **Christian Schwarz's [wkx](https://github.com/cschwarz/wkx)** supplied geometry
  serialization lineage, including retained TWKB code. **Mapbox's
  [wellknown](https://github.com/mapbox/wellknown)** supplied historical WKT parsing.
  Current WKT/WKB/CRS codecs use math.gl; moving or replacing implementations does
  not erase the provenance of code that remains.
- **Brandon Liu and the Protomaps community** develop
  [PMTiles](https://github.com/protomaps/PMTiles). **MapLibre contributors** develop
  [MapLibre Tile](https://github.com/maplibre/maplibre-tile-spec). Their separately
  installed readers supply the corresponding tile integrations.
- **Fabian Schindler and geotiff.js contributors** supply
  [geotiff.js](https://github.com/geotiffjs/geotiff.js), used for compatibility
  decoding alongside loaders.gl's numeric TIFF core. **Esri's LERC contributors**
  supply [LERC](https://github.com/Esri/lerc) raster compression implementations.
- **Vladimir Agafonkin's [MARTINI](https://github.com/mapbox/martini)** and
  **Michael Fogleman and Vladimir Agafonkin's [Delatin](https://github.com/mapbox/delatin)**
  supply terrain mesh reconstruction. **HERE Europe B.V.** supplied the
  [quantized-mesh-decoder](https://github.com/heremaps/quantized-mesh-decoder)
  implementation adapted for quantized terrain.
- **SQL.js and SQLite contributors** supply the database implementation used by
  GeoPackage adapters. **DuckDB contributors** supply the independently installed
  database runtimes used by SQL sources.

## Meshes, point clouds and 3D tiles

- **Ricardo Cabello (mrdoob) and the three.js community** supplied the OBJ parser
  foundation. **Wei Meng** supplied the PLY loader foundation; **Filipe Caixeta**
  and **Mugen87** are credited in the adapted PCD loader. We retain these individual
  credits alongside the [three.js](https://github.com/mrdoob/three.js) MIT notice.
- **Uday Verma and Howard Butler's [Plasio](https://github.com/verma/plasio)** supplied
  the LAS/LAZ parser lineage. **Hobu and laz-perf contributors**, **laz-rs
  contributors**, and **Martin Isenburg, rapidlasso and LASzip contributors**
  developed important LAZ implementations and algorithms. The embedded laz-rs-wasm manifest also credits **Thomas Montaigu** and
  **Chris Lee**. Backend choices and newer TypeScript work are described separately from retained adaptations.
- **Markus Schütz and Potree contributors** supplied the
  [Potree](https://github.com/potree/potree) point-cloud loader lineage.
  **Connor Manning's [copc.js](https://github.com/connormanning/copc.js)** informed
  the original COPC module. Its current primary reader is implemented in loaders.gl.
- **CesiumJS contributors and the Cesium engineering team** supplied adapted 3D
  Tiles utilities and collaborated on the original integration. Cesium-derived
  tileset traversal, collection and bounding-volume helpers retain Apache-2.0
  provenance even where their interfaces have changed.
- **Esri and its engineering collaborators** publish I3S and LEPCC specifications
  and reference implementations. Esri funded and contributed the tile-converter
  development effort. The current I3S integration and converters also represent
  substantial original loaders.gl work.
- **Benjamin Wasty's [gltf-loader-ts](https://github.com/bwasty/gltf-loader-ts)**
  supplied adapted glTF schema types. **Arseny Kapoulkine and meshoptimizer
  contributors** supply the vendored [meshopt decoder](https://github.com/zeux/meshoptimizer).
  **Google Draco contributors** supply geometry compression implementations and
  the Web IDL underlying the adapted Draco types.

## Images, textures, compression and archives

- **Karl Cheng's [binary-gltf-utils](https://github.com/Qantas94Heavy/binary-gltf-utils)** supplied binary-image inspection and data-URI
  decoding foundations. **Sindre Sorhus and file-type contributors** supplied
  adapted ISO BMFF detection code.
- **Tarek Sherif's [PicoGL](https://github.com/tsherif/picogl.js)** supplied
  compressed-texture parsing foundations. **Binomial and Basis Universal
  contributors** supply the encoder/transcoder used by Basis and KTX2 integrations.
  The checked-in runtime inventories record pinned versions and checksums.
- **Tim van Scherpenzeel's
  [texture-compressor](https://github.com/TimvanScherpenzeel/texture-compressor)**
  supplies the application-installed command-line tool used by the compressed
  texture writer. The retained Crunch runtime carries a Zlib SPDX identifier;
  the [attribution audit](https://github.com/visgl/loaders.gl/blob/master/dev-docs/attribution-audit.md)
  records the unresolved historical provenance.
- **Arjun Barrett's [fflate](https://github.com/101arrowz/fflate)** supplies retained
  DEFLATE/GZIP/ZLIB code. **Pierre Curto** supplied the adapted LZ4 implementation.
  Google’s retained JavaScript Brotli decoder is credited separately from optional
  Brotli backends. The compression adapters also thank the maintainers of compress-utils, Brotli,
  fzstd, hysnappy, lz4js, pako, snappyjs and zstd-codec for independently maintained
  codecs.
- **T. Jameson Little's [tar-js](https://github.com/beatgammit/tar-js)** supplied
  retained TAR construction helpers. Historical ZIP loaders wrapped JSZip; the
  current archives implementation uses loaders.gl's archive and compression APIs.
- **Yahoo's gifshot contributors**, **Anthony Dekker** (NeuQuant), **Kevin Weiner**
  (Java implementation), and **Thibault Imbert** (the ActionScript
  version) are credited in the retained GIF encoding source.
- **Axel Rauschmayer's async-iter-demo** and **Vsevolod Strukchinsky's
  require-from-string** supplied small but valuable utility foundations retained
  in the core package.

## Utility foundations

- **Brian Todd Button** supplied md5-wasm, the foundation of the retained MD5
  implementation and adapter. **jsdom’s abab contributors** supplied the base64
  decoding foundation. **wqli78’s CRC32 gist** is cited in source as inspiration.
- **Gozala** supplied historical web-file and web-blob polyfills. **GitHub’s fetch contributors**
  supplied the Headers polyfill; **Anthum, Inc.** supplied fetch-progress-indicators.
  **BTOdell** supplied path-resolve, and **Jesse Tane** supplied hex-transcoder.
- **Joshua Bell and text-encoding contributors**, and the **WHATWG Encoding Standard
  community**, supplied encoding algorithms, polyfill code and encoding indexes.
  The package inventory distinguishes the public-domain dedication from the
  standard-derived material.
- **derhuerst and parse-gml-polygon contributors** supplied GML polygon
  parsing. **taketwo’s three-pcd-loader** supplied the separate LZF decompressor
  lineage. **Kepler.gl contributors** supplied indexed tilestats attribute handling.

## Specifications and research

We thank the people who design, document and maintain interoperable formats:
**Khronos** (glTF and KTX), **OGC** (including 3D Tiles, GeoPackage and service
standards), **Esri** (I3S and ArcGIS), **ASPRS** (LAS), the **Apache Arrow, Parquet
and ORC communities**, **GeoArrow and GeoParquet contributors**, **STAC contributors**,
**Zarr and OME-NGFF communities**, **WMO** (GRIB), **CF metadata contributors**,
**Pixar and the OpenUSD community**, and the
**Chrome Trace Event and Perfetto communities**.

Specifications, research publications, implementation source, and conformance
fixtures are separate contributions. Format documentation links the applicable
standards and papers. Supporting a format does not imply certification or that
the standards organization's reference implementation is bundled. math.gl supplies
many shared spatial algorithms; its own
[references and credits](https://github.com/visgl/math.gl/blob/master/docs/references-and-credits.md)
identify the underlying mathematical and implementation lineage.

## Datasets, imagery, fixtures and examples

Sample data is essential to reliable parsers. A code license does not grant rights
to all datasets, models, imagery or service content shown in examples. Retain each
asset's own authorship, terms and modifications when reusing it.

| Material | Credits and provenance |
| --- | --- |
| glTF sample models | [Fixture inventory](https://github.com/visgl/loaders.gl/blob/master/modules/scene/test/gltf/data/README.md), including Khronos sample models and the separately licensed Damaged Helmet asset. |
| 3D Tiles samples | [Cesium-origin fixtures and exceptions](https://github.com/visgl/loaders.gl/blob/master/modules/tiles-3d/test/3d-tiles/data/README.md). |
| Parquet and GeoParquet | [Apache parquet-testing fixtures, generated benchmark data and pinned GeoParquet example](https://github.com/visgl/loaders.gl/blob/master/modules/tables/test/parquet/data/README.md). |
| Terrain imagery | [Mapbox Terrain RGB, Mapzen terrain and Cesium terrain fixtures](https://github.com/visgl/loaders.gl/blob/master/modules/raster/test/terrain/data/README.md). |
| NetCDF samples | [NSF Unidata sample-file sources](https://github.com/visgl/loaders.gl/blob/master/modules/scientific/test/netcdf/data/README.md). |
| Shapefile interoperability | [Fixture provenance](https://github.com/visgl/loaders.gl/blob/master/modules/geospatial/test/shapefile/data/README.md) and retained shapefile-js fixture license. |
| OGC services | [WMS fixture inventory](https://github.com/visgl/loaders.gl/blob/master/modules/ogc/test/wms/data/README.md), including OpenLayers-origin material. |
| Format logos | [Official artwork sources](https://github.com/visgl/loaders.gl/blob/master/docs/images/logos/README.md); project marks retain their owners' terms. |
| Supporter logos | [Artwork provenance](https://github.com/visgl/loaders.gl/blob/master/website/static/images/supporters/README.md). |

Additional fixture inventories live beside each module's test data. Examples that
fetch data from services also depend on the provider's terms and attribution
requirements. These links identify the recorded provenance; they are not a blanket
permission to redistribute everything in the repository.

## People, collaboration and organizational support

loaders.gl grew from the vis.gl visualization ecosystem. We thank every
[contributor](https://github.com/visgl/loaders.gl/graphs/contributors), including
upstream authors whose names may not appear in this repository's commit history.
The [maintainer and governance information](https://github.com/visgl/loaders.gl/blob/master/CONTRIBUTING.md)
records ongoing stewardship.

Organizations recognized in the project's supporter gallery include **Uber**,
**Foursquare**, **CARTO**, **Action Engine** and **Esri**. We also acknowledge the
technical collaboration of **Cesium** and **Graphistry** described above. Code,
funding, engineering advice, specification work and long-term maintenance all
contribute to the project; these acknowledgements do not imply endorsement.

## Maintaining provenance

When adding or updating an adaptation:

1. Preserve upstream authors, copyright headers, full licenses and applicable
   NOTICE files. Record the source URL, version or commit, and material changes.
2. Update the owning package's notice index and this page. Historical ports with
   unknown versions should say so; a current upstream release is not evidence of
   the version originally copied.
3. Include the notices and license texts in published packages and retain them
   when redistributing generated bundles and workers.
4. Credit datasets separately, including the asset creator, source, version,
   license and transformations; record checksums for pinned binary assets.
5. Run `yarn check-attributions`, inspect package contents, and build the website.
   The check catches missing indexes, broken local notice links and omitted
   package files; it cannot determine whether attribution is historically complete.

If a credit is incomplete or incorrect, please
[open an issue](https://github.com/visgl/loaders.gl/issues) with the source or history
we should consult. We welcome corrections and fuller acknowledgements.
