# Attribution audit

## Scope

Reviewed all 33 non-private modules against their source headers, adjacent licenses,
format documentation, package manifests, runtime inventories and fixture READMEs.
The central page follows current package ownership, including consolidated tables,
geospatial, raster, scientific, archives, core, tiles and tiles-3d implementations.
Private deck-layers is acknowledged separately. This is a direct-source inventory,
not a complete transitive software bill of materials.

## Package checklist

- [x] arcgis: source/dependency classification and packaged notice index.
- [x] archives: source/dependency classification and packaged notice index.
- [x] arrow-geometry: source/dependency classification and packaged notice index.
- [x] compression: source/dependency classification and packaged notice index.
- [x] config: source/dependency classification and packaged notice index.
- [x] core: source/dependency classification and packaged notice index.
- [x] crypto: source/dependency classification and packaged notice index.
- [x] draco: source/dependency classification and packaged notice index.
- [x] geoarrow: source/dependency classification and packaged notice index.
- [x] geospatial: source/dependency classification and packaged notice index.
- [x] gltf: source/dependency classification and packaged notice index.
- [x] graphs: source/dependency classification and packaged notice index.
- [x] images: source/dependency classification and packaged notice index.
- [x] las: source/dependency classification and packaged notice index.
- [x] obj: source/dependency classification and packaged notice index.
- [x] ogc: source/dependency classification and packaged notice index.
- [x] pcd: source/dependency classification and packaged notice index.
- [x] ply: source/dependency classification and packaged notice index.
- [x] raster: source/dependency classification and packaged notice index.
- [x] scan: source/dependency classification and packaged notice index.
- [x] scene: source/dependency classification and packaged notice index.
- [x] scientific: source/dependency classification and packaged notice index.
- [x] services: source/dependency classification and packaged notice index.
- [x] splats: source/dependency classification and packaged notice index.
- [x] sql: source/dependency classification and packaged notice index.
- [x] tables: source/dependency classification and packaged notice index.
- [x] textures: source/dependency classification and packaged notice index.
- [x] tiles: source/dependency classification and packaged notice index.
- [x] tiles-3d: source/dependency classification and packaged notice index.
- [x] traces: source/dependency classification and packaged notice index.
- [x] video: source/dependency classification and packaged notice index.
- [x] wkt: source/dependency classification and packaged notice index.
- [x] xml: source/dependency classification and packaged notice index.

- [x] apps/tile-converter: separate application publication, Esri contribution and dependency notices.

## Evidence and corrections

- Each package notice links retained sources, full local terms or pinned runtime
  inventories. Original source headers and existing upstream notices are preserved.
- Added package-local full terms where retained ports previously pointed only to
  upstream URLs, including PapaParse, three.js, tar-js, wkx, IOBuffer, PicoGL,
  vt-pbf, hyparquet and gltf-loader-ts. Existing source copyright lines remain.
- Copied upstream license texts are acknowledgements, not evidence of the revision
  originally ported. Pinned versions are stated only where existing source/runtime
  inventories identify them (PapaParse, fflate, Draco, meshoptimizer, MARTINI, Basis).
- Corrected the Parquet overview's blanket Apache-2.0 statement: retained JS code
  is MIT; optional backends have independent terms. Recorded the historical JSZip
  lineage separately from the current native ZIP implementation.
- Data and example licenses are separate from code licenses. Fixture README links
  identify recorded sources; they do not assert that every asset is redistributable.

## Historical provenance gaps

- Many old ports lack an exact original upstream commit. The indexes say this
  explicitly instead of assigning a current upstream version to historical code.
- The historical Crunch JavaScript asset has a Zlib SPDX identifier but no recovered
  full adjacent notice or exact upstream build revision. The current Binomial Crunch
  fork has different public-domain terms, so its license was not substituted.
  Recover the original artifact/source and notices before replacing that runtime.
- laz-rs-wasm 0.1.0 records collaborators Thomas Montaigu and Chris Lee in its
  embedded package manifest but does not record a build commit or full license.
  The LAS inventory credits the backend; exact binary-build provenance still needs
  recovery. These gaps are not represented as newly verified licensing.
- The embedded legacy laz-perf source has an Apache-2.0 SPDX identifier and an
  older comment saying LGPL. The npm laz-perf backend declares Apache-2.0, but
  that does not establish the exact embedded build’s terms. Recover its source
  revision and reconcile the historical comment before replacing that asset.

- Other historical utility ports identify upstream projects but not exact source
  revisions: Gozala web-file/web-blob, hex-transcoder and taketwo’s LZF decompressor.
  Some full historical notices remain to be recovered. The source comments are
  credited without assigning invented copyright years. The retained abab comment
  says BSD-3-Clause while newer upstream releases use W3C terms; the newer license
  was not substituted for an unidentified historical version.

## Maintenance and validation

Run yarn check-attributions for module coverage, local notice links and files
allowlists. Inspect packed contents to confirm package LICENSE, indexes and local
license targets survive packaging. Bundlers may omit comments; consumers copying
standalone workers/bundles must retain their owning package's applicable notices.
Website build checks navigation and Markdown rendering. Existing runtime tests
remain the behavior gate; this change does not alter parser implementations.
