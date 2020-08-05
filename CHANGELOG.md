## loaders.gl v2

## v2.3 Prereleases

#### v2.3.0-alpha.8

    crypto: Add crc32c transform (#882)
    Remove duplicate shapefile worker loader files (#881)
    flatgeobuf: New module for flatgeobuf format (#880)
    Docs: contributing.md cleanup (#878)
    Use template contributing.md (#753)
    crypto: fixes and cleanup (#876)
    Fix name of indices returned from SHPLoader (#875)

#### v2.3.0-alpha.7

- Multipolygon parsing in binary-to-geojson conversion (#848)
- crypto: New module for cryptographic hashing (#874)
- compression: New module (#870)
- las: upgrade the laz-perf script to the last version (#869)
- gis loaders: Binary geospatial support via options.gis.format (#867)
- core: makeResponse utility to unify handling of various input types (#787)
- polyfills: Automatically decompress .gz files under Node (#866)
- mvt: Fork @mapbox/vector-tile (prep for optimized binary loading) (#864)

#### v2.3.0-alpha.6

- core: selectLoader/selectLoaderSync split (#863)
- build(deps): bump lodash from 4.17.15 to 4.17.19 (#858)
- typescript: Enable strict checking (#861)
- mvt: Add result.byteLength (#862)
- mvt: Support binary output format (#860)
- perf: prevent iterating through typed array if using SharedArrayBuffer (#859)

#### v2.3.0-alpha.5

- [Bug/Enhancement] Pass actual resource so inference can be done via getResouceUrlAndType (#857)

#### v2.3.0-alpha.4

- gis: Add multipolygon support (#853)
- core: BrowserFileSystem (#851)
- csv: List options to avoid incorrect warnings (#852)
- core: Reorganize exports (#850)
- core: parseInBatches context passing (#849)

#### v2.3.0-alpha.3

- Shapefile fixes (#847)
- shapefile/gis: integrate binaryToGeoJson (#846)
- shapefile: More fixes (#845)
- gis: Binary to geojson converter (#824)

#### v2.3.0-alpha.2

#### v2.3.0-alpha.1

- ShapefileLoader

## v2.2 Release

#### v2.2.1

- Pin module cross-dependencies
- Bump to probe.gl@3.3.0
- Bump example versions

#### v2.2.0

- Bump to math.gl@3.2.0 (#802)

### 2.2 Prerelease

#### v2.2.0-beta.1

- Fix: expose the jsonpath property in a consistent shape (#798)
- csv: Fix row object format. Configurable default column names. (#797)
- core: Fix metadata batch (#795)
- support unregistered mime types (#794)
- core: Add loader option warnings (#791)
- Add octet-stream to ply loader mimetypes (#793)
- json: Add `jsonpath` field to batches (#792)
- Allow Files/Blobs as an input type (#790)
- Updated token. (#789)
- test: Add node 14 to CI (#788)
- types: All loaders now declare LoaderObject type. Loader mimeTypes fixed (#785)
- examples: Remove DracoLoader imports (no longer needed) (#786)

#### v2.2.0-alpha.3

- polyfill: Improved fetch and Response polyfills (#782)
- json: Initial support for JSONPath syntax to control JSONLoader streaming (#784)
- Experimental TARBuilder (#781)
- WKBLoader (#775)
- core: parseInBatches new metadata option returns additional metadata batch (#780)
- typescript 3.9 fixes, yarn.lock refresh (dependabot alerts) (#778)
- csv: Fix header detect, add `batch.bytesUsed`, add `options.csv.rowFormat` (#774)
- json: Add batch.bytesRead field (#777)
- File reader iterator (#773)

#### v2.2.0-alpha.2

- gltf/tiles: draco loader imported by default (#770)
- examples: Move to website /experimental folders (#771)
- build(deps): bump websocket-extensions from 0.1.3 to 0.1.4 (#769)
- Fix website links (#766)
- docs: Add version numbers to new exports, to let users understand what is available in each version (#763)
- Update gifshot HTML example to use published video script (#761)

#### v2.2.0-alpha.1

- Quantized mesh loader (#729)
- Update What's New (#760)
- WKTWorkerLoader (#732)
- GeoJSON Loader (#733)
- Fix imports in JSONLoader docs (#719)
- video: New experimental module (#755)
- Bump Arrow to 0.17.0 (#758)
- [Discussion] Simplify RequestScheduler API (#672)
- core: selectLoader refresh, no longer experimental (#752)
- core: Add typsecript types (#750)
- Images Category RFC (#745)
- images: module cleanup (#748)
- Support compression in node polyfill (#743)
- imagebitmap as default format. Support parse SVG to imagebitmap (#744)
- 3d-tiles: fix parsing tileset option (#742)
- i3s: skip parsing region data when not available (#739)
- add a doc to compare 3d tiles and i3s spec (#731)
- Fix for Node.js being unable to pull files from non local FS (#741)
- tiles: fix loading tiles after resuming traversal (#736)
- bump dependencies (#735)
- 3d-tiles: restore parsing content url (#734)
- website: fix gatsby config (#728)
- Fix links in ImageLoader docs (#727)
- Update visgl repo links (#726)
- i3s: fix extensions (#721)
- Service URL update for New York City (#720)
- i3s example: enable throttle requests (#713)
- i3s and 3d-tiles: remove json from extensions (#711)
- Sanity check in fetch (#707)
- Fixes to benchmark example (#708)
- add benchmark examples (#706)
- GeoJSON to binary arrays improvements (#703)
- kml: fix parsing coordinate numbers (#705)
- typescript: add initial `.d.ts` type definition files and `tsc` linting (#670)
- tiles and i3s: update docs (#699)
- bump dependencies and fix 3d tiles example (#700)
- GeoJSON to flat binary arrays (#690)
- i3s example: iframe dataset info page (#695)
- polyfills: fix transpiling (#698)
- v2.1 whats new (#697)
- Add boundingBox to mesh category header (#696)
- website: update doc and bring back point cloud example (#692)
- Minor changes in examples plus a spelling fix (#694)
- enable lint for examples and fix linting (#693)

### 2.1 Release

#### v2.1.0-beta.2

- fix lint rules and module dependencies (#689)
- Remove extraneous imports from @loaders.gl/core (#687)
- build(deps): bump acorn from 6.4.0 to 6.4.1 (#686)

#### v2.1.0-beta.1

- basis: disable CDN when running local test (#684)
- mvt: Allow MVT layer filtering and add layer name to properties (#679)
- 3d-tiles: Add CesiumIonLoader to allow resolving authorization in preload (#680)

#### v2.1.0-alpha.8

- tiles: fix dependency versions (#681)
- tiles: fix passing fetch options (#675)
- images: additional bitmap checks (#673)
- Fix RequestScheduler bugs (#671)
- type linting cleanup (#669)
- core: Add `makeChunkIterator`. Improve iterator generator function naming. (#666)
- core: Fix tests on Firefox (ReadableStream detection fix) (#667)
- Bump apache-arrow dependency to v0.16 (from v0.13) (#668)

#### v2.1.0-alpha.7

- [tiles]: fix traversal - select root node when it is visible (#665)

#### v2.1.0-alpha.6

- [i3s]: implement to use tiles module [Part 3](#656)
- [tiles]: Move Tileset and Tile class to @loaders.gl/tiles [Part 2](#654)
- [pointcloud] example: auto-bounds, colors, Richmond flowers PLY (#659)
- [i3s]: I3s featureDataLess traversal pattern (#660)

#### v2.1.0-alpha.5

- [mvt]: Return tile coordinates in 512x512 bounding box when parsing MVT (#646)
- [gltf]: resolve textures in KHR_techniques_webgl (#653)
- [tiles]: moving common components to @loaders.gl/tiles module [Part1](#644)
- [i3s]: Use empirical value to fix the lod (#658)
- [images] Fix parsing svg to data type (#651)
- [i3s] Improved Lod selection criteria for I3S layers (#655)

#### v2.1.0-alpha.4

- Terrain loader (#652)
- Image data (#597)
- Consolidate getTransferList (#648)
- [3d-tiles] Handle GLTF w/ CESIUM_RTC extension (#645)
- Fix website build (#641)
- 3d-tiles and i3s: Add RFC for consolidating 3d tiles decoding (#631)
- Update website to the latest gatsby-theme-ocular (#639)
- 3d-tiles: fix frameNumber for updating traversal (#638)
- images: Add dependency (#637)
- mvt: Fix worker url used in test (#635)

#### v2.1.0-alpha.3

- image: Fix options.imagebitmap on Firefox (#616)
- json: Return wrapper object in streaming parsing (#623)

#### v2.1.0-alpha.2

- MVT loader fixes (#626)
- mvt: Add worker (#625)
- Mapbox Vector Tiles loader (#624)
- core: Fix parse of embedded typedArrays and Buffers (#618)
- json: code cleanup (#622)
- images: remove experimental exports (#620)

#### v2.1.0-alpha.1

- basis: Add tests, improve options handling, clean up demo (#596)
- images: prep diff for image data (#598)
- polyfills: Add @babel/runtime (#594)
- Fix double build (#592)
- core: `load` and `parse` from `Stream`s (#588)
- json: Add benchmark (+ fix existing benchmarks) (#584)
- images: loadImage now calls resolvePath (#587)
- loader-utils: expose RequestScheduler (#586)
- wkt: New loader module for WKT (Well-known text) (#575)

### 2.0 Release

#### v2.0.0-beta.8

- Check response content type to match loader (#570)
- [3d-tiles] Fix bounding volume calculation (#576)

#### v2.0.0-beta.7

- Make 3d-tiles traversal synchronized (#573)
- json: Minor fixes (#572)
- Fix polyfill module typo (#571)
- Improved Lod Selection criteria for I3S layers (#562)
- loader-utils: Move resolvePath from core to loader-utils (#568)

#### v2.0.0-beta.6

- json: New streaming `JSONLoader` (supports GeoJSON) (#383)
- json: Add module placeholder with clarinet fork (#567)
- json: prep diff (#566)
- Bump math.gl and probe.gl (#564)
- Make traversal synchronous and fix the tile-3d-layer example fla… (#563)
- Bump luma.gl and deck.gl (#565)

#### v2.0.0-beta.5

- Fix loader-utils build (#561)

#### v2.0.0-beta.4

- deck.gl v8.0 API audit (#543)

#### v2.0.0-beta.3

- remove unused getImageAsync call (#560)
- Bump and remove experimental packages (#558)
- fix auto loader detection (#559)
- website: Move to `gatsby-theme-ocular` (#545)

#### v2.0.0-beta.2

- Fix gltf image loading (#555)

#### v2.0.0-beta.1

- workers: Add dev-worker scripts (#552)
- Fix loading worker loader from cdn (#553)
- Refactor 3d tile traversal - Part 1 (#540)

#### v2.0.0-alpha.5

- Support customized worker loader url (#551)
- gltf: Remove `gltf.resolveValues` options, better docs (#548)
- glTF: Added option - resolveValue. Creates TypedArray for the accessor (#547)
- improve distanceToTile calculation (#544)
- Create a sphere from map region (#542)
- Fix "loadGLTF" check (#538)
- improve point cloud examples by adding new data and tune screen space error (#530)
- Add i3s parser and example (#499)
- Rename folders, target and update build instructions (#529)
- update 555 market model id (#525)
- add draco compression support (#521)
- add draco lib (#520)
- Fix 3d tiles docs (#519)
- basis example app decodes reference textures (#493)
- basis: add `CompressedTextureLoader` (#498)
- Add georeference for 3d tiles (#512)
- Add cesium point cloud 3D tile format support (#508)
- upgrade rapidjson lib (#507)
- tables: @loaders.gl/experimental => @loaders.gl/tables (#500)
- basis: add docs (#497)
- i3s test data using NYC 3-D Building Model from NYC DoITT (#495)
- i3s server tests (#494)
- i3s: initial module (#492)
- Basis loader works (#490)
- Add basis_transcoder to basis module (#489)
- Fix loading (#488)
- draco: Use library modules to avoid excessive bundling (#473)
- Combined loaders (#486)
- loader-utils: dynamic library loading (#482)
- Load point cloud in CesiumJS with loaders.gl (#485)
- Add potree converter code base (#483)
- Verify loader version compatibility (#471)
- core: depend on loader-utils (#475)
- Introduce libs directories for untranspiled files (#472)
- Move workerUrls to loader-specific options (#463)
- images: Pass through imagebitmap creation options (#464)
- Fix fetching files with passing fetchOptions (#469)
- 3d-tiles: integrate Tileset3D in THREE.js example (#467)
- 3d-tiles: THREE.js example refactor (#465)
- Remove plumbing for inline workers (#456)

#### v2.0.0-alpha.4

#### v2.0.0-alpha.3

#### v2.0.0-alpha.2

- Import workers from url (#453)
- images: Restore HTML image loading to fix glTF example (#462)
- images: loaders for mipmapped images, arrays and cubemaps (#460)
- Add cubemap test images (#461)
- images: Separate "binary image" and "parsed image" APIs (#459)
- v2.0: remove deprecated code (#458)
- Bump luma.gl (#457)

#### v2.0.0-alpha.1

- core: parse url handling fix
- core: Avoid binding context due to transpilation issues (#455)
- use context in worker (#448)
- Extract description from ion metadata (#450)
- glTF image loading (#441)
- Fix parsing draco compressed gltf (#447)
- For v2.0: Image Category Reimagined (#387)
- 3d-tiles: Ensure tile error messages are not hidden (#446)
- gltf: support KHR_materials_unlit extension (#445)
- zip: use async (#443)
- gltf: Extension handling cleanup (#444)
- Enable commented vis code (#442)
- core: Use `context` to resolve loaders in sub-loaders (#426)
- glTF fixes (#440)
- gltf: drop parseSync, options refactor and doc refresh (#437)
- arrow/csv/draco: Update options and docs (#438)
- core: Merge nested options objects (#436)
- Restore worker loader config (#435)
- 3d-tiles: Remove sync parser versions (#430)
- loader-utils: Improved JSON parsing error messages (#428)
- 3d-tiles: Create lib directory (#425)
- gltf: Fix Scenegraph.getTypedArrayForBufferView (#423)
- Fix core module browser config (#422)
- Dedupe loaders (#421)
- potree: Initial parser code for potree format (#349)
- 3d-tiles & gltf: atomic parser, load all linked assets within on… (#417)
- core: add `context` to `parse` methods (#414)
- add basis module (#413)
- Auto resolve DracoLoader for PointCloud tiles (#412)
- ES2018 async debugging improvements (#411)

## loaders.gl v1.0

### 1.3 Release

#### v1.3.0

- 3d-tiles: Example handling (#398)
- 3d-tiles: Use unique string for the key in layerMap (#400)

#### v1.3.0-beta.3

- fix import in csv module (#399)

#### v1.3.0-beta.2

- ocular-dev-tools: 0.0.29 (modernize es6 dist) (#395)
- gltf: Add `options.gltf.parserVersion` (#394)
- 3d-tiles: fix b3dm tile stop rendering issue (#396)
- Worker improvements (#386)
- Docs: improvements for v1.3 (#381)
- core: Add fetch progress tracker (#391)
- core: Fix binary test for typed arrays (#393)
- gltf: example simplifications (#389)
- gltf: Improvements to v2.0 gltf parser (#390)
- gltf: doc improvements (#388)
- bump dependencies versions (#385)

#### v1.3.0-beta.1

- potree: Add test data (#350)
- 3d-tiles: Show attributions for tilesets loaded from ion. (#379)
- core: Worker cleanup (#362)
- 3d-tiles: Simplify tileset example handling (#378)
- 3d-tiles: Transform cleanup (#374)
- Fx tilesets with external tileset.json and b3dm orientation (#373)
- 3d-tiles: small fixes (#370)
- bump version of frameworks (#369)
- math: Update docs (#368)
- 3d-tiles: Quantized position w/ normalized shorts + modelMatrix (#367)
- 3d-tiles: More cleanup (#366)
- 3d-tiles: Add experimental RequestScheduler and throttleRequests option. (#364)
- 3d-tiles: cleanup (#363)
- 3d-tiles: example polish (#360)
- Cleanup Tile3Dlayer (#348)
- 3d-tiles: batch draco partial loading (#359)
- core: selectLoader API Improvements (#358)
- 3d-tiles: Update example image
- 3d-tiles: Minor fixes to example (#355)
- 3d-tiles: add viewport transitions to example (#354)
- Cache fix (#353)
- Revert "example: add viewport transitions to 3d-tiles"
- example: add viewport transitions to 3d-tiles
- WIP: Worker Pools (#347)
- 3d-tiles: Add vricon tilesets. Clean up example index handling. (#352)
- bump probe.gl and math.gl, fix instanced rotation examples (#351)

### 1.2 Release

#### v1.2.2

- 3d-tiles: Support nested tilesets with local url folders (#344)
- Docs: updates for 3d-tiles and categories (#333)
- core: Fixes to `parse` (#345)
- docs: front page update
- core: Add error handling to `parse*` functions (#342)
- core: Name workers for debugger (#339)
- fix bug with read property match of undefined (#340) (#341)
- Fix tranformMatrix regression (#338)
- Add back DracoWorkerLoader (#337)
- 3d-tiles: Align tileset callback names with vis.gl conventions (#336)
- 3d-tiles: Tileset3D options refactor (#334)
- 3d-tiles: Remove irrelevant wip code (#335)
- 3d-tiles: polish (#332)
- Support oct encoded normals (#329)
- Extract transform props from layer to tileset (#330)
- Track Memory Use (#331)
- 3d-tiles: Improved stats (#326)
- 3d-tiles: traverser no longer knows about tileset (#328)
- 3d-tiles: Reorder tileset3d methods (#327)
- fix parsing color (#325)
- Adding call for installing the external tileset (#324)
- 3d-tiles: attribute compression Phase 1 (#321)
- 3d-tiles: move styles to wip (#323)
- 3d-tiles: bump to deck/luma 7.2 (#322)
- 3d-tiles: Move point cloud color parsing into 3d-tiles module (#320)
- try to render i3dm and b3dm examples (#319)
- Fix image loader in FF (#318)
- Reorganize docs (#312)
- 3d-tiles: Ensure we parse JSON when loading nested tilesets (#314)
- 3d-tiles: Land partial port of styles (#311)
- Add additional check for jpeg headers for isImage (#315)

#### v1.2.1

- Fix babel config for already transpiled files (#313)
- Tests and bug fixes for core (#310)

#### v1.2.1

- Tests and bug fixes for core (#310)
- Fix babel config for already transpiled files (#313)

#### v1.2.0

#### v1.2.0-beta.4

- fix loader registration (#308)

#### v1.2.0-beta.3

- [csv] use header option in batch loader (#304)
- Bump to 7.2 beta (#305)
- Add synchronous parsing to CSV loader (#302)
- Website updates for 1.2 (#301)
- @loaders.gl/3d-tiles: Culling (#287)
- Bump lodash.template from 4.4.0 to 4.5.0 (#296)
- Fix widget styling (#300)
- [WIP] Specify math.gl version in wehbsite package (#299)

#### v1.2.0-beta.2

#### v1.2.0-beta.1

- Bump lerna to beta
- Fix for GLTFScenegraph.addBufferView (#298)
- Cleanup old tile.\_content (#295)
- Auto detect zoom level of a tilesert (#293)
- Support ion dataset (#292)
- 3d-tiles: Real distance sse traversal (#283)
- 3d-tiles: Convert camera parameters to WGS84 cartesian (#291)
- 3d-tiles: Ion asset loading fixes (#290)
- fixing typos (#289)
- core: fetch error message helpers (experimental) (#288)
- Fall back to url when loading tileset (#286)
- 3d-tiles: Preliminary ION support (#285)
- Fix transform matrix (#275)
- 3d-tiles: Use WGS84 transform for royal exhibition (#282)
- 3d-tiles: Embedded GLBs now display in ScenegraphLayer (#281)
- CI Tests: Run on Node 8 (#270)
- examples: Run against local deck (#280)
- images: Specify extensions for image loaders (#276)
- core: Binary File Type Detection (#268)
- 3d-tiles: fixing traversal issue (#278)
- 3d-tiles: i3dm parses instance table (#274)
- 3d-tiles: Fix traversal issues (#277)
- 3d-tiles example: Specify tileset source using URL parameter (#272)
- core: Fix extension normalization (#273)

#### v1.2.0-alpha.1

- arrowjs docs: Skeleton of arrow docs from first-principles (#254)
- arrow: Bump apache-arrow to 0.13. Use es5 dist for arrow to unbl… (#271)
- 3d-tiles: i3dm: support external glTF files. tileset: Support data URL tiles. (#265)
- RFCs: Proposals for v2.0 (#269)
- Polyfill fixes (#264)
- Enable update for view changes (#267)
- Screen space error traversal (#243)
- Remove argument passed to TextEncoder that causes console.warn() to be called (#266)
- 3d-tiles: Example fixes (#263)
- 3d-tiles: Partial port of 3D Tile Styles (#262)
- Add default sampler (#260)
- 3d-tiles: Switch to math.gl/geospatial and math.gl/culling (#258)
- Upgrade ocular-dev-tools (#256)
- Derive center from boundingVolume of tiles (#255)
- Fix point cloud examples urls (#251)
- gltf: List loader-utils as a dependency (real fix) (#252)
- gltf: List loader-utils as a dependency (#249)
- Fix parse color (#250)
- Bump lerna version to 1.2.0-alpha.0
- update website homepage (#247)
- Fix SSR (#245)
- Support RoyalExhibitionBuilding example (#239)
- Fix website and bump react-map-gl (#241)
- Fix tests (#242)
- Bump deck and luma (#240)
- 3d-tiles: Make Tile3DLoading async (#238)
- add Tileset3DLayer (#236)

### 1.1 Release

#### v1.1.0

- Bump ocular-dev-tools to publish LICENSE.md (#237)
- core/polyfills: Improved fetch polyfills (#234)
- loader-utils: Copy utility functions from core to loader-utils (#233)
- All modules: Update doc links in module `README.md` files (#231)
- website: Bump ocular-gatsby (#232)

#### v1.1.0-beta.1

- hotfix
- GLTFScenegraph overhaul per review (#230)
- core: load/parse browser `File` objects (#229)
- [WIP] Fix ellipsoid cartesianToCartographic (#228)
- Add math docs (#227)
- upgrade ocular (#226)
- Filter out prebuilts (#225)
- 3d-tiles: Tile3DHeader.loadContent() implemented (#224)
- Ellipsoid class: Cartographic to cartesian conversions (#223)

#### v1.1.0-alpha.1

- Point cloud example - file select/load panel (#221)
- Documentation Pass (#222)
- Tileset improvements. Minimal Tile3DHeader tests pass (#220)
- 3d-tiles example: Display i3dm tile as GLTF Scenegraph (#217)
- GLTF: Refactor post processing (#219)
- @loaders.gl/math: Raw port of 3D tileset math classes (#218)
- 3d-tiles: Call GLTF parser on embedded GLTF in i3dm/b3dm tiles (#216)
- GLTF Module refactor 1.1 (#215)
- @loaders.gl/images: Add getImageMIMEType. Improve docs. (#213)
- Bump ocular-gatsby to fix direct page access
- ArrowJS docs: Add notes about big int (#214)
- Update whats new (#211)
- ArrowJS Developer Guide Cleanup (#210)
- Minor website fixes (#208)
- Node 12 support (#207)
- Minimal Raw port of 3D Tileset (#205)
- @loaders.gl/core: Move node fetch polyfills to @loaders.gl/polyfills (#202)
- @loaders.gl/images: Move node support to @loaders.gl/polyfills (#203)
- @loaders.gl/loader-utils: New module breaking out from core (#204)
- LAS and GLTF working in examples (#201)
- Support draco and fix 3d point cloud examples (#199)
- Use static images (#198)
- Fix dependencies (#193)
- Add drag & drop (#189)
- Fix aliases (#197)
- Arrow website fixes (#196)
- Documentation fixes (#195)
- CNAME
- Update docs
- Update docs
- Add contributing/environment setup docs (#191)
- Disable dropdown in 3d-tiles examples (#192)
- Fix 3d-tile example index file (#190)
- Create CNAME
- Add dropdown for 3d-tiles example and uncomment batchID parsing (#185)
- Make AnimationLoopRunner compatible with v7 luma.gl examples (#188)
- Update gltf example (#187)
- Fix full size (#186)
- Gatsby website: all examples working in website build (#184)
- POLYFILLS: new module (#180)
- fix typo in modules/core/package.json (#183)
- add 3d tiles example (#182)
- 3D Tiles: BatchTable support (#181)
- GLTF: Deprecate GLB builder (#179)
- GLB: Encoder Refactor (#178)
- 3D Tiles: encoder refactor (#177)
- Edge build docs (#176)
- Update arrow docs
- Doc cleanup (#175)
- Port point cloud las example from deck.gl (#173)
- Regenerate docs with prefixes
- Stage main docs
- Stage arrowjs docs
- Switch to publishing gh-pages from master/docs (#172)

### 1.0 Release

#### v1.0.1

- Fix node setup in images module (#171)
- Fix website and example (#170)
- 3d tiles: binary parsers for tiles (#168)

#### v1.0.0

- Bump ocular-gatsby (#167)
- Move bundle.js into src (keep module roots clean) (#169)
- Centralize node support (#162)
- Bump luma (#141)
- GLB Parser start on arbitrary byteOffset (#163)
- Move the no longer maintained text-encoder module into core (#161)
- Minor cleanup (#159)
- Fill in some arrow docs (#158)
- Working example (#157)
- Remove arraybuffer-loader (#156)
- Add gltf example and integrate into website (#155)
- @loaders.gl/images - module refactor (#152)
- Fix Draco loader attribute types (#154)
- Add scripts (#153)

#### v1.0.0-alpha.4

- Port three.js obj loader (#150)
- Website upgrades (#149)
- tree shaking (#151)
- Support for multiple extensions (#146)
- API clean up before 1.0 (#147)
- fix reading binary ply (#144)
- Reorganize into lib folder (#143)
- New 3d-tiles module (#142)
- DracoLoader cleanup (#140)

#### v1.0.0-alpha.3

- Upgrade ocular-dev-tools and fix lint (#139)
- fix webpack errors when bundling las (#138)
- fix ply loader (#137)

#### v1.0.0-alpha.2

- Fix load-file/parse-file auto loader selection with unit tests (#135)

#### v1.0.0-alpha.1

- Fix load-file bug and add unit test (#134)
- Fix broken GLB Parser getBuffer() (#133)
- Directory structure cleanup (#131)
- Use fetchFile instead of readFile (#132)
- Add loader registry (#129)
- Remove gltf attribute name map (#130)
- Core loader updates (#128)
- Add `ArrowTableBatch` class. Tests for streaming CSV->Arrow `RecordBatch` async iterator (#127)
- Add CSVLoader (fork of papaparse) (#125)
- Remove duplicated code and address comments (#126)
- API and test cleanup (#124)
- Add parser support for KHR_lights_punctual glTF extension (#123)
- Pass on the Vector docs (#122)
- Run lint/prettier after dev tools upgrade (#121)
- Arrow docs update (#120)
- Replace custom test runner with @luma.gl/test-utils (#117)
- Run lint on docs (#116)
- Replace dev scripts with ocular-dev-tools (#115)

## loaders.gl Beta

#### v0.8.1

- Fix glTF loader issues after refactor (#114)
- Update lerna publish script to allow version selection

#### v0.8.0

- GLTF Draco Integration Improvements (#113)
- GLTF API improvements (#112)
- Implement `fetchFile`, consolidate loading (#111)
- Support loadImage on a worker thread (#110)
- Safe svg loading (#109)
- Arrow API docs (#108)
- PLY streaming (#105)
- Fix chunk headers in GLB file writer (#107)
- PLYLoader refactor (Prep for streaming) (#106)

#### v0.7.2

- Load glTF Embedded or multi-file (#104)

#### v0.7.1

#### v0.7.0

- Arrow batch loader (#96)
- Fix gltf/glbdump publish (#103)
- Initial support for loading from streams (#101)
- Support SVG with loadImage (#98)
- Fix missing "regenerator" support in workers (#100)
- add publishConfig to arrow & images modules (#99)
- Doc cleanup pass, prep for v1.0 (#97)
- add babel-runtime to loaders/core
- Start using ES2018 syntax, AsyncIterators, alias system to load from webpack dev server (#95)

#### v0.6.2

- Use "self" instead of "window" to work in WebWorkers (#92)
- Fix addImage() on GLTFBuilder (#91)
- Fix calls to GLBParser and pass data in parse method (#90)

#### v0.6.1

- New @loaders.gl/images module (#86)
- Move core-node to experimental (#87)
- New module @loaders.gl/zip (#88)
- Documentation pass (#89)
- Add worker loaders for mesh modules (#84)
- Add driver functions for "writer objects" (encodeFile, writeFile, saveFile) (#85)
- Core directory cleanup (#83)
- Add ocular-gatsby based website (#82)
- Add KMLasGeoJsonLoader (#81)
- Add basic node support to core module (#78)
- Improve log handling (#80)
- Move all tests to modules (#79)
- @loaders.gl/arrow - Loader for Apache Arrow (columnar tables) (#75)
- Make tests use `parseFileSync` instead of raw loader objects (#77)
- Moving tests into module folders (#76)
- Make sure all loaders output consistent format (#74)
- [POC] parse PLY with worker (#55)
- Render test with new probe.gl API (#67)
- Fix CI failure (#73)

#### v0.5.4

- glTF: fix options and export gltf-type-utils (#72)

#### v0.5.3

- WIP: GLBBuilder: Small API adjustments (#69)
- glTF: move buffers to buffer views (#71)
- Document Uber glTF extension strings (#68)
- implement GLBParser.getImageAsync (#62)
- `loadImage` fixes (#70)
- Update RFC directory

#### v0.5.2

- Fix GLTFBuilder & GLTFParser compressed point cloud handling (#56)
- glTF: fix texture loading enumSamplerParameter (#61)
- More cleanup (#64)
- Las module render test (#52)
- Bring in selected luma.gl IO functions, reorganize. (#59)
- Fix las module (#51)
- Doc improvements (#60)
- Remove rootPath as it is unused (#54)
- Fix PCD docs typo (#53)

#### v0.5.1

- Fix glTF and GLB parser buffer and image issues (#49)
- glTF Fix for #46 and #47 (#48)

#### v0.5.0

- fix eslint issues
- Add Draco point cloud benchmarks (#44)
- add point cloud render tests (#43)
- GLTF cleanup (#42)
- Fixes/improvements to glbdump (#41)
- Fix draco encode/decode (#40)
- Fix render tests (#39)
- Partial test case improvements for Draco decoder (#37)
- Copy loaders.gl RFC from luma.gl (#38)

#### v0.4.8

- Additional GLTF fixes (#36)
- Fix image tests under browser (#35)

#### v0.4.7

- glTF/GLB API: Stricter split, better docs (#33)

#### v0.4.6

- GTLF builder & parser fixes (#32)
- Update webpack (#31)

#### v0.4.5

- GLTF Parser Overhaul (#30)
- Move text loader to a new `tables` sub-module (#29)
- Dependency issues fixes (#23)
- Doc fixes (#27)
- Merge glb into gltf (#24)
- Module split (#22)
- Fix tests for OBJLoader and partly fix LAZLoader (#21)
- Module Structure RFC (#16)
- Unified glTF2-based mesh data format across loaders - first pass (#12)
- Doc fixes (#15)
- Initial Buildkite implementation (#10)
- Set up render test (#14)
- Doc polish (#13)
- Clean up text-encoding shim (#11)
- Fix GLBBuilder and GLBParser
- Clean up GLBBuilder API (#9)
- Add text-encoding polyfill (#8)
- Add initial GLB compressed point cloud support (#5)
- Initial Draco Encoder (#4)
- Support binary file format tests in browser (#3)
- Fix docs (#2)
- bump ocular to 0.6.2 (#1)
- Initial commit
