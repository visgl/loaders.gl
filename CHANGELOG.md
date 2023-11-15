# CHANGELOG for loaders.gl

## v4.0

### v4.0.3

- feat(tile-converter): estimation of time remaining (#2774)
- fix: Revert parquet-wasm integration (#2781)
- fix(Arrow): featureIds not correctly parsed from MultiPolygon w/ holes in arrow util (WIP) (#2777)
- fix: Use "latest" version tag when loading from unpkg (#2779)
- docs(arrowjs): Update Arrow docs and release notes (#2778)
- fix(examples): run 'geospatial' locally (#2776)
- chore: Update all dependencies to ^4.0.0 (#2775)
- feat(parquet): Enable Parquet WASM loader (#2773)
- fix(3d-tiles): Enable Tiles3DLoader tests (#2771)
- chore: Dependencies (#2772)
- chore: parseFile accepts `ReadableFile` (#2770)
- chore(excel): Fix batched loader adapter from atomic parse (#2769)
- chore(loader-utils): split Worker/WorkerWithEncoder types (#2768)

### v4.0.2

- test: run workers from source code (#2762)
- feat(schema): makeTableFromBatches (#2767)
- chore: Remove Buffer in test cases (#2766)
- chore(Arrow): add test cases for geoarrow to binary geometries (#2765)
- chore: Adopt namespace style imports for apache-arrow (#2764)
- fix get arrow bound function; add test case (#2763)
- fix(kml): Fix TXCLoader default shape (#2761)
- chore: Improve docs (#2758)
- fix(website): Unbreak website build (#2756)
- chore: fix 4.0 peer dependencies (#2755)

### v4.0.1

- chore(textures): enable tests (#2741)
- feat(gis): Consolidate geo metadata detection and table conversion (#2742)
- fix(zip): cd header zip64 data reading fix (#2710)
- feat(arrow): GeoArrow utilities (#2744)
- Got rid of .toString() usage for ArrayBuffers (#2743)
- chore: Add some javascript API guidelines (#2747)
- Update 3D Tiles Docs (#2749)
- feat(mvt): MVTileSource (#2750)
- chore: improve test coverage (#2751)
- docs: Clean up website links (#2748)
- refactor(tile-converter): refactor creation of Attribute info (#2718)
- feat(tile-converter): conversion progress (#2739)
- chore(shapefile): Improve Shapefile format doc (#2752)
- fix(tile-converter): i3s-server - esm compatibility (#2745)

## v4.0 Prerelease

> The official 4.0 alpha track starts with alpha.6
> The early pre-release track was abandoned due to build incompatibility problems.
> release info (#2491))

### v4.0.0-beta.8

- Update gltf.md. (#2733)
- fix(website): restore I3S examples (#2734)
- fix: render test import (#2731)
- chore(crypto): Restore crypto tests (#2730)
- chore: Clean up license text (#2729)
- chore(i3s): Export a function customizeColors from i3s lib utils (#2719)
- added test for conversion 64-bit attributes to strings (#2728)

### v4.0.0-beta.7

- fix(i3s): Remove luma.gl dependency (#2727)
- feat(flatgeobuf): Upgrade to latest flatgeobuf (#2684)
- feat(lerc): Break out LERCLoader into its own module (size and bundling issues) (#2724)
- chore(polyfills): Bump deps (#2723)
- feat(polyfills): Add installFilePolyfills on Node.js (#2722)
- fix(i3s): I3SContentLoader regression (#2713)

### v4.0.0-beta.6

- fix(polyfills): Add CJS export for node.js (#2720)
- feat(wms): Restore LERCLoader (#2715)
- chore: Remove deprecated APIs and update docs (#2714)

### v4.0.0-beta.5

- Path fix (#2709)
- fix(gltf, tile-converter): attributeStorageInfo, use class name (#2673)
- chore: Add CI for Node 20 (#2712)
- fix(tile-converter): enable tests (#2708)
- chore: Bump to Node 18 (#2711)
- docs (whats-new): Update whats-new.mdx for 4.0 loaders.gl release (#2702)
- feat(geopackage): Upgrade and modernize (#2704)

### v4.0.0-beta.4

- fix(tile-converter): cli tools (#2707)
- feat(tile-converter): test for conversion arrays to attribute of string type (#2703)
- chore(polyfills): Consolidate node code (#2701)
- fix(i3s): handle search params in I3SLoader (#2692)

### v4.0.0-beta.6

- feat(tile-converter): --analyze-only option (#2694)
- fix(tiles): cartographicToCartesan syntax (#2690)
- chore(website): Restore website (#2689)
- fix(wms): WMS 1.3.0 compatability on GetFeatureInfo (#2680)
- chore: Prep for Node18 support (#2699)
- chore: math.gl@4.0.0 (#2698)
- fix(gltf): fix of getTypedArrayForAccessor in gltf-scenegraph (#2683)
- chore(schema): Move arrow dependencies to arrow module (#2697)
- chore: Upgrade to math.gl@4.0.0-beta.1. Remove gl-matrix (#2696)
- chore: Restore library loading (#2686)
- fix(tiles): convert region to obb (#2685)
- feat: Move to ES modules, upgrade dev-tools (#2681)
- feat(mvt): Add MVTSource (#2674)
- chore(core): Remove writeSync, save and fs dependencies (#2678)
- feat(loader-utils): Refactor FileSystem to be independent of fs (#2676)
- chore: Remove Buffer usage (#2675)
- chore(zip): Refactor zip content hash tables (#2500)
- chore(polyfills): Remove Promise.allSettled polyfill (#2672)

### v4.0.0-beta.2

- fix: getting tile url with empty query params (#2671)
- chore(polyfills): Start moving Node.js code into polyfills (#2669)

### v4.0.0-beta.1

- feat(tile-converter): support of 64-bit int (#2670)
- feat(gltf): added support of arrays to ext-feature-metadata (#2663)
- feat(mvt): Add TileJSONLoader (#2666)
- feat(pmtiles): Create PMTileSource from Blob (#2668)
- feat(wms): Separate WMSSource and WMSService (#2667)
- fix: remove unused ts directive (#2665)
- Move master to 4.0-beta tags (#2661)
- feat(pmtools): Add vector tile support (#2664)
- docs: Improved release notes
- feat(pmtiles): Support for pmtiles format (#2662)
- Website: Geoparquet example (#2660)
- fix(parse-i3s): getting root node url for normalizeTilesetData without nodepages (#2659)

### v4.0.0-alpha.26

- Fixes for deck.gl 8.10 (#2658)
- feat(crypto): Add encoding parameter for hashes (#2657)

### v4.0.0-alpha.25

- fix(gltf): tests for ext-feature-metadata (#2656)
- fix(gltf, converter): make ext-mesh-features independent from ext-structural-metadata (#2655)
- batch types (#2645)
- chore(twkb): Add TWKBLoader tests (#2653)
- feat(tile-converter): select metadata class from EXT_structural_metadata (#2647)
- feat: new geoparquet example (#2646)
- feat(wkt): Add TWKBLoader/Writer (#2028)
- feat(wkb): Auto-detect WKB dialect and encoding (#2184)
- feat(wkb): New HexWKBLoader for hex encoded WKB (#2652)
- chore(worker-utils): Improve version handling (#2651)
- chore: geoparquet prep (#2650)
- feat(wkt): Add WKTCRSLoader/Writer (#2649)
- docs(release-notes): Loaders 4.0 upcoming release notes (#2648)
- docs: Add whats-new and upgrade-guide to arrowjs docs (#2636)
- feat(schema): Make geojson-table compatible with GeoJSON (#2644)
- docs(tile-converter): metadata class selection (#2642)
- chore(tile-converter): rename (#2641)
- chore(parquet): Add Buffer polyfill to parquet to avoid bundler complications (#2643)

### v4.0.0-alpha.24

- fix(tile-converter): geometry attributes reordering performance (#2640)
- fix(tile-converter): EXT_feature_metadata conversion (#2639)
- feat(gltf): EXT_feature_metadata - numeric types support (#2634)
- chore(gltf): 3d-tiles extensions refactoring (#2633)
- chore(draco): Upgrade to draco3d v1.5.6 (#2638)
- Fix browser exclude (#2596)
- docs: Consolidate whats-new (merge duplications) (#2637)
- feat(arrow): upgrade to apache-arrow v13 (#2632)
- feat(arrow): Typed apache arrow loader (#2631)
- chore: More typed loaders (#2630)
- chore(gis): Add typescript types (#2629)
- docs(i3s): fix formats and english (#2628)
- docs(i3s): I3S receipts (#2627)
- chore: Type 3d-tile and I3S loaders. (#2606)

### v4.0.0-alpha.23

- chore: Add loader type parameters (#2626)
- feat(tile-converter): support EXT_mesh_features and EXT_structural_metadata (#2566)
- feat(core): non-specific parse functions return unknown (#2625)
- chore(csv): Ensure tests  use typed CSVLoader (#2621)
- docs(core): Typed loaders (#2624)
- chore(zip): Remove zip module dependency on @loaders.gl/core (#2622)
- chore: Clean up module imports, remove default exports in images module (#2617) (#2623)

### v4.0.0-alpha.22

- fix(zip): @loaders.gl/core dependency (#2620)
- feat(tile-converter): support 3tz (#2609)
- chore(core): Reduce use of implicit any, move test files to .ts (#2619)
- chore: Use parseFromContext in subloaders (#2616)
- feat(loader-utils): Type safe context parsers for sub loaders (#2613)
- feat(3d-tiles): some improvements (#2610)

### v4.0.0-alpha.21

- feat(core): parseSync, parseInBatches, load, loadInBatches type inference (#2612)
- feat: More typed loaders (#2607)
- feat(3d-tiles): 3tz loader (#2578)
- feat(zip): ZipFileSystem (#2602)
- chore(i3s): Hash generation moved to @loader.gl/zip (#2599)
- chore(zip): read file classes (#2601)
- chore(zip): Compression method added for local header (#2600)
- chore(compression): Added raw mode for deflate-compresion module (#2598)

### v4.0.0-alpha.20

- chore(i3s): Hash file utility moved to loader-utils (#2595)
- chore(i3s): Zip parse refactoring (#2594)
- fix(core): fetchOptions regression (#2591)
- chore(tile-converter): remove CesiumION tokens (#2592)
- feat(tile-converter): select metadata classes (#2590)
- fix(tile-converter): featureIds + uvRegions (#2588)

### v4.0.0-alpha.19

- fix(tile-converter): CLI startup script (#2587)
- feat(tile-converter): i3s - offline conversion (#2579)
- Handle empty childless tiles in TilesetTraverser (#2584)
- fix(i3s): add to tileset data (#2585)
- fix(tile-converter): fix loading buffers in preprocess-3d-tiles (#2572)

### v4.0.0-alpha.18

- fix(tile-converter): skip failing content (#2576)
- fix: Bump and remove @xmldom/xmldom (input validation issue) (#2582)
- docs(tile-converter): Add documentation for SLPK Extractor (#2567)
- chore(core): Refactor fetchFile to handle Node.js local file loading (#2575)
- chore(tile-converter): 3dtiles - exclude Tile3D and Tileset3D (#2574)

### v4.0.0-alpha.17

- docs(chore): core API documentation improvements (#2573)
- Add triangulate property to geojsonToBinary (#2571)
- fix(obj): Improved vertex colors parsing (#2569)

### v4.0.0-alpha.16

- chore(tile-converter): create SLPK hash during serve (#2565)
- docs(tile-converter): I3S Server (#2564)
- chore(tile-converter): i3s-server tests (#2563)
- chore(deps): bump semver in /test/apps/typescript-test (#2544)
- chore(deps): bump semver from 5.7.1 to 5.7.2 (#2545)
- chore(tile-converter): i3s-server convert to ts (#2562)

### v4.0.0-alpha.15

- chore(tile-converter): bump i3s-server deps (#2561)
- chore(tile-converter): Support for SLPKs larger than 2 Gb (#2547)
- feat(tile-converter): i3s-server bundle (#2555)
- chore(deps): bump semver from 5.7.1 to 5.7.2 in /website (#2546)
- fix(docs): JSONLoader \_rootObjectBatches removed but not mentioned in upgrade guide (#2558)
- chore(deps): bump word-wrap in /test/apps/typescript-test (#2559)
- fix(tile-converter): CesiumION tileset URL (#2560)
- chore: update CHANGELOG.md (#2551)
- chore(tile-converter): update i3s-server manual (#2552)

### v4.0.0-alpha.14

- fix(3d-tiles): implicit tiling v1.1 (#2549)
- fix(tile-converter): i3s->3dtiles regression (#2550)

### v4.0.0-alpha.13

- fix(gltf): 3D tiles extension types & docs (#2542)
- fix(tile-converter): failing test (#2540)
- chore: bump fast-xml-parser (#2538)
- fix(3d-tiles): implicit tiling v1.1 (#2539)

### v4.0.0-alpha.12

- fix(tile-converter): proceed failed tiles (#2536)
- fix(3d-tiles): implicit tiling relative paths (#2535)

### v4.0.0-alpha.11

- chore(tile-converter): add tests (#2534)
- chore(tile-converter): unified tests naming (#2533)
- feat(CLI): Extract SLPK (#2515)

### v4.0.0-alpha.10

- fix(tile-converter): install deps on windows (#2532)

### v4.0.0-alpha.9

- fix(worker-utils): child process - ignore warnings (#2529)
- fix: update dependencies (#2528)

### v4.0.0-alpha.8

- Update supported-features.md (#2525)
- chore(tile-converter): preprocess stage for I3SConverter (#2520)
- chore(tile-converter): i3s-converter - mitigate "tiles" module dependency (#2517)
- chore(3d-tiles): tile content type (#2516)
- feat(i3s): Add an option to multiply colors by attribute (#2519)
- feat(tile-converter): support attributes data from textures (#2511)
- chore(3d-tiles): improve JSON types (#2509)
- chore(slpk): slpk mode for server implemented (#2486)
- fix(tile-converter): node workers error (#2504)

### v4.0.0-alpha.7

- fix(tile-converter): reject POINT mesh type (#2501)
- fix(i3s): Dependency path error (#2499)
- fix(i3s): add md5 to i3s module (#2479)
- chore: Node worker cleanup (#2495)
- chore: move DOMParser dep from polyfills to kml module (#2496)
- fix(wms): Avoid breaking normalized ImageSource metadata (#2492)
- docs: Upgrade guide for WMMSCapabilities, link to CHANGELOG for patch release info (#2491)
- fix(wms): undefined fields can be set to undefined strings (#2489)
- fix(tiles): Improved query params handling (#2490)
- fix(hero example): change dataset url (#2484)
- fix(tiles): isLoaded has breaking change (#2485)
- fix: dependency issue (#2480)
- chore: Cleanup after 4.0 fast forward (#2481)
- cleanup
- chore(gltf): Add types for post processed gltf (#2468)
- feat(3d-tiles): Tiles3DLoaderOptions (#2471)
- feat(gltf): Typed glTF loader, separate post processing (#2472)
- docs: more formats (#2467)
- docs: Add formats section (#2466)
- docs: Add ArrowJS docs (#2453)

### v4.0.0-alpha.6

- feat: Typed loaders (#2448)
- chore: Bump math.gl and probe.gl (#2444)
- feat(parquet): Columnar loader (#2447)
- Update whats-new.md
- Update whats-new.md
- docs: Update what's new for 4.0 (#2277)
- feat: Improve Loader typing (v4) (#2325)
- feat: Improve Writer typing (v4) (#2320)
- feat: Add JSON and CSV writers (#2319)
- feat(schema): Use standard objects for serialized metadata (#2318)
- chore(schema): Split types and utils (#2317)
- feat(schema): Add table accessors (v4) (#2316)
- chore(arrow): bump apache-arrow to 9.0.0. Temporarily disable arrow workers. (#2276)
- fix(examples): wms control panel height (#2443)
- feat(website): add hero example (#2441)
- feat(wms): Replace EPSG:4326 with CRS:84 in WMS 1.3.0 (#2439)
- feat(tile-converter): support TRIANGLE-STRIP (#2428)

## v3.4

### v3.4.9

- fix(obj): Improved OBJ vertex colors parsing (#2569)

### 3.4.2

- docs: Upgrade guide for `WMSCapabilities` type, link to CHANGELOG for patch release info
- fix(wms): undefined fields can be set to `undefined` strings (#2489)
- fix(tiles): Improved query params handling (#2490)

### v3.4.1

### v3.4.0

### v3.4.0-alpha.5

- feat(wms): Support for layer dimension metadata (#2475)
- docs(slpk): TSDoc comments (#2460)
- chore(tiles): Another round of type improvements (#2462)
- Compute memory usage for GLTF tiles (#2458)
- fix(wkb): TypeError: Cannot use 'in' operator to search for 'wkb' in undefined (#2463)
- chore(tiles): Improved TypeScript types (#2461)
- Tiles3DLoader: pass query parameters used on tileset request onto tile requests (#2252)
- docs: tilesetUrl change (#2408)
- docs(tile-converter): features compatibility (#2454)
- Fix handling of query parameters in tile url (#2456)
- docs(whats-new): tile-converter updates (#2455)
- chore(slpk): implementation of slpk parser (#2409)
- fix(wms): fix type exports (#2452)

### v3.4.0-alpha.4

- chore: Remove deck.gl test dependency (#2451)
- fix(tile-converter): Remove luma.gl dependency (#2450)
- feat(wms): coordinate flipping for WMS 1.3.0 (#2442)
- fix(examples): wms control panel height (#2443)
- feat(website): add hero example (#2441)
- feat(wms): Replace EPSG:4326 with CRS:84 in WMS 1.3.0 (#2439)
- feat(tile-converter): support TRIANGLE-STRIP (#2428)

### v3.4.0-alpha.3

- feat(wms): More closely follow spec, extract more capabilities (#2437)
- fix(website): examples pictures (#2435)
- fix: yarn dependency issues (#2436)
- docs: whats-new remove subheaders from old releases
- Update whats-new.mdx
- Update whats-new.mdx
- feat(wms): WMSCapabilities now includes `version` and `abstract` fields (#2434)
- fix(website): i3s debug stats issue (#2433)
- fix(wms-example): height of side panel (#2432)
- fix(docs): developing on a new ubuntu install (#2430)
- fix(website): minor style issues (#2431)
- fix(website examples): stats widget issue (#2429)
- fix(docs): dead links (#2424)
- feat(website): add showcase (#2427)
- fix(tile-converter): tile-converter dependencies changed and tests enabled (#2422)
- update monaco deps in example and website (#2421)
- chore(parquet): Use BSONLoader (#2416)
- fix(tile-converter): Dockerfile (#2407)
- fix docusaurus footer links typo (#2419)
- Fix yarn.lock (#2418)
- feat(bson): New BSONLoader module (#2415)
- feat(wms): Extract more data from capabilitiies (#2417)
- (geoparquet-example) fix(docs): core readme (#2414)
- fix(docs): Specification, API Reference and Loader Catalog links (#2413)
- fix(website-examples): height of the images (#2412)
- Fixes for docs, including partial fix for arcgis example (#2410)
- feat(website): Add local search (#2406)
- docs: 3.4 release notes and WMS (#2404)
- feat(website): Add redirects to unbreak pre-docusaurus links (#2405)
- feat(wms): Use WMS 1.3.0 as default (#2400)
- (feat)tiles: add boundingBox to Tile3D class (#2401)
- chore(deps): bump http-cache-semantics from 4.1.0 to 4.1.1 in /website (#2403)
- docs: Docusaurus deploy, remove gatsby folder (#2402)
- chore: fix vite deps + add missing types to loader-utils/src/types.ts (#2396)
- feat(wms): WMS 1.3.0 preparations, WMS example upgrade (#2399)
- feat(pcd): support intensity and label (#2398)
- feat(ply): Support arbitrary columns (intensity, confidence etc). (#2397)
- feat(docs): Most examples now running on docusaurus website (#2394)
- feat(docs): Add examples to docusaurus website (#2393)

### v3.4.0-alpha.2

- feat(3d-tiles): support s2 bounding volume (#2376)
- feat(parquet): Extract geoparquet metadata (#2391)
- fix(website): Working docusaurus docs (#2392)
- feat(parquet): columnar loading (#2390)
- fix(tile-converter): install dependencies crash (#2384)
- fix(tile-converter): node 18 compatibility (#2385)
- feat(wms): Pass through authorization load options (#2388)
- docs(i3s): Update i3s-loader.md (#2386)
- feat(wms): Support specifying WMS protocol version. (#2389)
- chore(wms): Code reorganization (#2387)
- chore: Bump to probe.gl@4.0.1 (#2371)
- chore(deps): bump webpack from 5.75.0 to 5.76.1 in /website (#2383)
- chore(deps): bump @sideway/formula in /website-gatsby (#2378)
- chore: Add docusaurus website boilerplate (#2377)
- chore(loader-utils): Improve LoaderOption typings (#2365)
- fix(website): I3S as hero example (#2370)
- feat(xml): Improved HTMLLoader (#2375)
- feat(images): initial AVIF support (#2369)
- feature(wms): Add CSWService class (OGC Catalog Service for the Web) (#2374)
- chore: Update example dependencies to 3.3.1 (#2367)
- chore: Cleanup load options in tests (#2366)
- fix(loader-utils): Fix incorrect browser field for 'utils' (#2363) (#2364)
- chore: update CHANGELOG

## v3.3

### v3.3.0

- feat(examples): Add URL loading to glTF example
- fix(website): Disable glTF example due to gatsby typescript issues (#2361)
- chore(tiles): Code cleanup (#2358)

### v3.3.0-alpha.14

- chore(wms): Streamline ImageService APIs (#2357)
- feat(wms): ArcGIS data sources (#2340)
- chore(tile-converter): add Docker guide (#2355)
- example(wms): Fixes to ImageryLayer (#2356)
- chore(polyfills): Split Node fetch polyfill into request and file versions (#2354)
- chore(parquet): Clean up parquet code base (#2349)
- chore: Upgrade github actions to v3 (#2353)
- fix(wms): Unbundle LERCLoader to unblock esbuild applications (#2351)
- feat(loader-utils): Add ReadableFile, WritableFile (#2350)
- chore(examples): update 3d-tiles examples (#2348)
- control panel styling; misc. auto formatting app (#2347)

### v3.3.0-alpha.13

- feat(wms): AdHocImageSource - initial URL template support (#2346)
- website: bump luma & fix I3S Debug (#2343)
- feat(wms): LERCLoader (#2342)
- fix(tile-converter): handle joinImages errors (#2345)
- feat(wms): ImageSource class, WMS doc cleanup (#2344)
- docs: fix formatting (#2341)
- chore(wms): Add more services to WMS example (#2337)
- chore(deps): bump http-cache-semantics in /test/apps/typescript-test (#2339)
- fix(tile-converter): Mark join-images as --external to avoid bundling (#2338)
- Update whats-new.md
- docs: update release notes (#2336)
- example: Working WMS website example (#2332)
- docs(tile-converter): update docs for new options (#2335)

### v3.3.0-alpha.12

- chore(parse-basis): add level size field (#2334)

### v3.3.0-alpha.11

- Added link to showcases prod (#2330)
- examples: Bundle examples with vite (#2331)
- fix(tile-converter): memory leak (#2329)
- chore(deps): bump ua-parser-js from 0.7.23 to 0.7.33 in /website (#2322)
- examples(wms): Add minimal image and tile layer visualizations (#2323)
- feat(wms): WMSService class (#2327)
- fix(examples): 3d-tiles CesiumION URL (#2326)
- feat(wms): WMSErrorLoader plus fixes (#2324)
- feat(wms): Minor fixes. Improve WFS, WMTS and GML docs. (#2321)
- Update wms.md
- Update README.md
- feat(ogc): Add initial OGC support (WMS, WFS, WMTS and GML) (#2314)
- chore: enable tests (#2313)

### v3.3.0-alpha.10

- feat(tile-converter): i3s - merge materials (#2311)

### v3.3.0-alpha.9

- feat(wms): Loaders for additional WMS response types. (#2312)
- chore(i3sLoader): Handling unsupported point cloud layer (#2310)
- fix(i3s): parse not compressed attributes (#2308)
- feat(tile-converter): save 3DNodeIndexDocument and nodepage (#2307)
- feat(draco): Upgrade to v1.5.5 (#2296)
- fix(tile-converter): instant writing in queue (#2306)
- chore(i3s): add types for arcgis slides (#2299)
- fix(i3s-converter): fix default arrays in shared-resources.ts (#2298)

### v3.3.0-alpha.8

- feat(tiles): detect content formats (#2288)
- chore: Replace probe.gl with @probe.gl (#2297)
- chore: Run coveralls on Node 16 (#2295)
- fix(json): Syntax fix in JSONLoader docs (#2270)
- fix(core): Update type for registerLoaders to accept a single Loader (#2261)
- feat(wms): New WMS loader module (#2292)
- chore(deps): bump @xmldom/xmldom from 0.7.6 to 0.7.7 (#2287)
- chore(deps): bump loader-utils from 1.4.1 to 1.4.2 in /website (#2290)
- chore(mvt): convert GeoJSONTiler to TypeScript (#2294)
- feat(mvt): automatic tile generation from GeoJSON (geojson-vt fork). (#2293)
- fix(tile-converter): lint error (#2289)
- feat(xml): New XML loader module (#2291)

### v3.3.0-alpha.7

- fix(tile-converter): always calculate refinement percentage (#2286)
- chore(deps): bump socket.io-parser from 3.3.2 to 3.3.3 in /website (#2285)
- chore(deps): bump loader-utils from 1.4.0 to 1.4.1 in /website (#2284)
- fix(Shapefile): Ignore TS7053 in parseRow function (#2264)
- fix(tile-converter): i3s - fix fullExtent calculation (#2281)
- fix(tile-converter): i3s - handle file path with "\" (#2283)
- Stat type changed to default 'count' (#2262)

### v3.3.0-alpha.6

- chore(arcgis-webscene-loader): handle usupported layers (#2273)
- chore: typescript 4.8.4 (#2275)
- NPY: Add check that buffer is long enough (#2271)
- deck.gl compatible Viewport type (#2259)
- fix(tiles): Viewport type (#2258)

### v3.3.0-alpha.5

- fix(tile-converter): 3DTiles - generage batchIds (#2257)
- chore(i3s): export more types (#2255)

### v3.3.0-alpha.4

- feat(i3s): colorize by attribute (#2254)
- fix(gltf): add diffuseTex support to v1.0 (#2250)
- fix(tile-converter): comment out transform attributes worker (#2253)
- fix: tests (#2251)
- chore(tile-conveter): i3s - geometry conversion tests (#2249)
- feat(tile-converter): parallel siblings conversion (#2246)
- fix(website): revert breaking commit (#2248)
- chore(i3s): add statistic types (#2247)
- fix(3d-tiles): add options to normalizeTileHeaders (#2241)
- fix(tile-converter): types (#2242)
- fix(tile-converter): install deps test (#2243)
- fix(polyfills): jpeg parser returns Buffer (#2244)
- fix(implicit-tiling): handle child tiles (#2240)
- feat(tile-converter): enable loader workers (#2234)

### v3.3.0-alpha.3

- feat(i3s): content loader worker for Node.js (#2237)
- chore(tiles): fix lint warning (#2235)
- fix(parse-i3s-tile-content): move initial value inside function (#2230)

### v3.3.0-alpha.2

- fix(worker-utils): check node worker properly (#2232)
- chore(i3s): fix naming (#2222)
- feat(tile-converter): add EXT_feature_metadata initial properties support (#2224)
- feat(draco): loader worker for NodeJS (#2228)
- feat(textures): basis loader worker for NodeJS (#2229)
- fix(video) ReferenceError: navigator is not defined (#2227)
- feat(gltf): add initial "EXT_feature_metadata" extension support (#2221)
- docs(pcd): fix pcd-loader example `PCDloader` spelling (#2226)
- [tiles] Fix culling volume calculation from viewport (#2223)
- fix(draco-builder): handle object metadata properly (#2209)
- pass i3s loader only required options (#2188)
- fix(tiles): i3s traverser for multiple viewports (#2213)
- fix(tile-converter): memory overflow (#2217)
- chore(polyfills): add export for \_fetchNode (#2195)
- chore(deps): bump devcert from 1.1.3 to 1.2.2 in /website (#2220)
- chore(deps): bump moment from 2.29.2 to 2.29.4 in /website (#2219)

### v3.3.0-alpha.1

- fix(3d-tiles): prevent crash when cartographic center is undefined (#2212)
- fix(3d-tiles): add support for absolute content-uris (#2211)
- chore(deps): bump gatsby-plugin-mdx from 2.14.0 to 2.14.1 in /website (#2192)
- chore(deps): bump terser from 4.8.0 to 4.8.1 (#2214)
- fix(tile-converter): remove batchIds extensions warning (#2215)
- chore(tiles): distanceToCamera & screenSpaceError getters (#2190)
- feat(tile-converter): add EXT_feature_metadata extension support (#2208)
- Fix type imports in math module (#2204)
- fix(video): window undefined (#2198)
- chore: peer dependency major version only (#2166)
- chore(deps-dev): bump sharp from 0.27.1 to 0.30.5 in /website (#2189)
- chore(deps): bump eventsource from 1.1.0 to 1.1.1 (#2187)
- feat(converter-cli): support equal sign in the converter options (#2171)
- fix(i3s): textures - no headers in Request (#2183)
- fix(tile-converter): worker receives corrupted buffer (#2185)
- fix(tiles): i3s tile register (#2181)
- fix(schema): failing imports from apache-arrow (#2179)
- feat(gltf): KHR_texture_transform (#2175)
- fix(worker-utils): Vite build(#2178)
- fix(ci): remove node12 from workflows (#2173)

## v3.2 Prerelease

### v3.2.0-alpha.4

- feat(i3s-stats): add tiles total metric to i3s (#2118)
- feat(webscene): ArcGIS WebScene loader (#2158)
- chore(tile-converter): improve tile converter error message (#2156)
- fix(tiles): isLoaded criteria (#2167)
- chore(tile-converter): full extent appears in json file (#2165)

### v3.2.0-alpha.3

- WASM-based parquet (#2103)
- chore(statistics): add vertex count statistics (#2163)
- fix(parse-i3s-content): calculate content length properly (#2162)
- chore(tile-converter): cli refactoring (#2160)
- fix(tile-converter): import polyfills (#2159)
- chore(tile-converter): refactoring (#2157)
- Append Response to context when parsing (#2128)
- fix(tile-converter): node transformation order (#2153)
- feature(tile-converter): ktx2 writer worker (#2154)
- fix(gltf): v1 texture normalization (#2155)
- chore(deps): bump async from 2.6.3 to 2.6.4 (#2151)

## v3.2.0-alpha.2

- fix(website): broken examples (#2132)
- fix(tile-converter): extent calculation (#2148)
- fix(tile-converter): async root node loading (#2149)
- fix(gltf-attributes): node mesh issue (#2147)
- docs(gltf): EXT_meshopt_compression (#2145)
- feat(i3s): async root node loading (#2138)
- feat(tile-converter): writing queue (#2133)
- chore(deps): bump moment from 2.29.1 to 2.29.2 in /website (#2143)
- feat(showcase): add new page for website (#2130)
- feat(tile-converter): add 3d-tiles attributes worker (#2146)
- feat(tiles): execute traversal optimization (#2139)
- fix(tile-converter): fetch data from server on a specific port (#2135)
- fix(gltf): meshopt compression extension (#2140)
- chore(deps): bump minimist from 1.2.5 to 1.2.6 in /test/apps/typescript-test (#2141)
- chore(deps): bump minimist from 1.2.5 to 1.2.6 (#2142)
- feat(tile-converter): add i3s attributes worker (#2136)
- chore: refinement-tile-converter-documentation (#2134)
- feat(tile-converter): draco writer worker (#2107)
- feat(core): getLoaderOptions (#2123)
- fix some postProcessGLTF and glTF Extensions urls (#2121)
- fix: error message truncation in checkResponse (#2119)
- feat(textures): worker for ktx2 basis writer (#2115)
- chore(textures): update what's new in basis_universal (#2112)
- chore(tile-converter): ts and refactoring (#2116)
- chore: sync loaders version (#2117)
- chore(tile-converter): typescript (#2113)
- chore(basis): update basis libs (#2111)
- WKB encoder follow up (#2022)
- feat(draco): writer worker (#2106)
- Update loaders to accept shape option (#2102)

## v3.2.0-alpha-1

- Pin sql.js 1.5.0 in GeoPackageLoader (#2101)
- Add Geopackage to geospatial example (#2100)
- Return tables from geopackage loader (#2098)
- chore: Remove spurious JS files (#2032)
- chore: Update master to 3.2.0 alpha track (#2099)
- feat(json): Support more streaming JSON formats (WIP) (#2016)
- fix(examples): vancouver data is geojson not geopackage (#2097)
- feat(draco): writer worker (#2090)
- fix(examples): 3d-tiles-with-three Tileset3D import (#2094)
- perf(tiles): traversal debounce, i3s-lod optimization (#2086)
- chore(compression): unblock tests (#2088)
- feat(arrow): Add arrow MIME types (#2082)
- fix(terrain): swap winding order of skirts to match winding order of terrain (#2085)
- test(crypto): nodejs worker (#2079)
- fix(crypto): switch tests on (#2077)
- chore(worker-utils): Additional node worker prep (#2076)
- chore(worker-utils): Initial prep for node workers (#2075)
- fix(tile-converter): simultaneous file writing (#2074)
- feat(core): Add debug logging for selectLoader (#2069)
- fix(parse-i3s-tile-content): I3S conversion issue without draco (#2064)
- Replased uber links (#2056)
- chore(tile-converter): update docs (#2055)
- fix(terrain): skirting misses last edge (#2045)
- fix(tiles): init zoom calculation (#2046)
- fix(tile-converter,i3s-app): default value of pbr + app picking (#2044)
- fix(examples): 3d-tiles Tileset Demos URLs (#2051)
- Fix MVTLoader bug when WGS84 is used (#2052)
- fix(tile-converter): duplicated texture output (#2048)
- chore(i3s-loader): add fetch option (#2050)
- TerrainLoader support for more image formats (#2040)
- chore(tile-converter): add ts to node-debug file (#2038)
- chore(tile-converter): add ts to geometry-attributes file (#2037)
- chore(i3s-converter): add ts for helper function (#2036)

## v4.0 Prerelease

## v4.0.0-alpha.5

- feat(tile-converter): add transformation matrix generation for node (#2034)
- feat(examples): i3s - terrain elevation support (#2020)
- feat(obj): MTLLoader (#2033)
- docs(wkt): Add some format notes (#2029)
- fix: Alternate approach to bundler issues (#2026)
- fix: Added `__VERSION__` definitions to build-worker scripts (#2030)
- Remove node-stream-polyfill (#2023)
- feat(wkt): WKB writer (#2017)
- Fix(docs): Update 3.1 release date in the whats new page (#2015)
- Update geojson-to-binary docs (#2013)
- fix: Rename bundle.js to dist.min.js (#2009)
- Unify geojsonToBinary & MVTLoader (#2003)
- rollup fixes (#2011)
- chore: bump probe.gl@3.5.0 (#2010)
- chore: Fix bundler examples versions (#2006)
- fix(textures): Avoid using \_\_dirname in texturee-encoder (#2005)
- feat(3dtiles-implicit-tiling): add region bounding volume calculation for child tiles (#2002)
- chore(examples): Update get-started-rollup example dependencies. (#2001)
- feat(textures): schema based typings (#1983)
- feat(pcd): pcd loader support for compressed binary data (#1995)
- fix(docs): Fix markdown tables (#1999)
- fix(3d-tiles): max-statements warning (#1996)
- fix(textures): crunch loader (#1997)
- fix(tiles): culling relative to viewport center (#1991)
- feat(tile-converter): Keep KTX2 texture as it is while I3S -> 3DTiles conversion (#1992)
- fix(i3s-app, i3s-debug-app): move terrain layer data to global scope (#1985)
- fix(examples): i3s - move terrain data to global scope (#1985)
- chore(zip): Remove dependency on @loaders.gl/core (#1989)
- chore(gltf): Remove dependency on @loaders.gl/core (#1988)
- chore(arrow): Remove dependency on @loaders.gl/core (#1987)
- chore(ply): Remove dependency on @loaders.gl/core (#1986)
- chore(tile converter): refactoring (#1981)
- fix(tile-converter): change converter options (#1975)
- chore(tile-converter): Enable typescript check of tile-converter test folder (#1980)
- chore(tile-converter): Convert most remaining files to .ts (#1977)
- chore(gltf): Enable typescript checking of gltf/test folder (#1978)
- chore(2d-tiles): Enable typescript check of 3d-tiles test folder (#1979)
- chore(deps): bump url-parse from 1.4.7 to 1.5.3 in /website (#1972)
- fix(tile-converter): add build script for docker image of tile-converter (#1974)
- fix(tile-converter): json-map-transform templates mutation (#1976)
- feat(tile-converter): add '--generate-bounding-volume' flag (#1973)
- doc,test(3d-tiles): glTF content extension (#1948)
- feat(tile-converter): add "--generate-texture" flag (#1966)
- chore(deps): bump path-parse from 1.0.6 to 1.0.7 in /website (#1971)
- chore(deps): bump ws from 5.2.2 to 5.2.3 in /website (#1962)
- chore(deps): bump prismjs from 1.23.0 to 1.25.0 in /website (#1961)
- chore(deps): bump axios from 0.21.1 to 0.21.4 in /website (#1960)
- chore(deps): bump object-path from 0.11.5 to 0.11.8 in /website (#1959)
- chore(deps): bump tmpl from 1.0.4 to 1.0.5 in /website (#1958)
- fix(examples): textures GL_EXTENSIONS_CONSTANTS (#1970)
- fix(textures, worker-utils): deck.gl compatibility (#1956)
- fix(gltf): parse interleaved buffer (#1968)
- fix(i3s-app, i3s-debug-app): set max zoom property for terrain layer (#1965)
- feat(i3s-debug-app): add terrain layer (#1964)
- chore(i3s): types (#1945)
- fix(examples): i3s-app - building explorer visibility (#1957)
- feat(i3s-app): add terrain layer (#1955)
- Detect when 64 bit precision is required for a numericProp in MVTLoader (#1952)
- fix(examples): i3s debug - coordinate system related issues (#1954)
- feat(3dtiles-implicit-tiling): add more tests (#1950)
- feat(3dtiles-implicit-tiling): parse implicit tiling structure (#1938)
- Allow top-level workerUrl for CompressionWorker (#1949)
- chore: types refactoring (#1947)
- feat(tile-conveter): 3dtiles->i3s converter glTF content (#1946)
- fix(i3s): repeating textures (uv0>1 || uv0<0) (#1935)
- fix(tile-converter): enable converter after typing changes (#1941)
- chore(parse-i3s-tile-content): TS, refactor. (#1926)
- chore(shapefile): add benchmarks (#898)
- fix(polyfills): Slow performance in response.arrayBuffer() (#1944)
- feat(flatgeobuf): Binary parsing (#1942)
- examples: Add vite example (#1943)
- chore: Run CI on Node 16 (#1940)
- fix: temporarily revert to ocular-build (#1939)
- feat(gis): Update gis category docs (#1431)
- feat(json): rebuild json path (#877)
- fix(tile-converter): black models issue (#1936)
- feat(3d-tiles): content glTF extension (#1933)
- feat(3d-tiles_implicit_tiling): add subtree loader (#1924)
- feat: enable tsbuild (#1930)
- chore: Move all libs to esbuild (#1877)
- fix(website): natsby-theme-ocular@1.2.5 ignores .tsconfig.json (#1929)
- build(deps): bump xmldom 0.5.0 to @xmldom/xmldom 0.7.5 (#1923)
- docs(parquet): Parquet loader docs (#1836)
- chore(docs): Improve whats new (#1928)
- docs: mention ktx2-basis support (#1925)
- docs(textures): 3.1 updates (#1922)
- feat: Proper typescript monorepo references (#1920)
- chrore(test-apps): remove husky (#1919)
- chore(parse-i3s-tile-content): refactor constants (#1911)
- chore(deps): bump jszip from 3.6.0 to 3.7.0 (#1918)
- feat: Generate d.ts typings (#1907)
- chore: Add typescript tests (#1908)
- chore(tile-converter): use Tiles3DLoader for local data (#1913)
- fix(tile-converter): i3s->3dtiles - model matrix transformation (#1902)
- fix(website/tile-converter): parsing textures (#1901)
- chore(examples): i3s - cleanup (#1904)
- feat(examples): i3s - fork deck components (#1898)
- fix(3dtiles-converter): fix texture parsing for I3S-> 3DTiles conversion (#1897)

## v4.0.0-alpha.4

- fix(i3s): coordinate system option - backward compatibility (#1900)

## v4.0.0-alpha.3

- feat(i3s): coordinate system option (#1899)

## v4.0.0-alpha.1

- feat(i3s): change output coordinate system (#1893) (#1896)
- feat(tile-converter): add atlas texture conversion I3S -> 3DTiles (#1894)
- fix(fetch-node): fix redirect location handling in fetch polyfill (#1892)
- chore: TS remove implicit any - multiple PRs
- feat(tile-converter): use converter.min.js as entry for npx command (#1890)
- feat(i3s-converter): add basis universal supercompressed texture writer (#1887)
- feat(i3s): decodeTextures option (#1883)
- chore(json): improve clarinet types and perf (#1684)
- chore(json): Clean up clarinet typings (#1884)
- feat(basis-encoder): add basis encoder (#1871)
- fix(i3s-attributes): fix picking attributes parsing (#1869)
- chore: Move bundle builds to esbuild (#1876)
- Revert "chore: Reintroduce ES5 build (#1842)" (#1875)
- chore: Bump master to v4.0-alpha (#1874)
- chore(deps): bump url-parse from 1.5.1 to 1.5.3 (#1865)
- chore(i3s-docs): udpate I3sLoader docs (#1862)
- chore(i3s-app): fix attributes panel layout (#1868)
- chore(i3s-picking): disable feature picking for integratedMesh layer type (#1867)
- fix(tile-converter): support specific gltf structure (#1860)
- consistently use core as peer dependency (#1853)
- fix(i3s): change logic of tileset urls parsing for i3s apps (#1841)
- feat(gltf): parse basis textures (#1843)
- fix(examples): textures fix function name (#1845)

## v3.1 Prerelease

## v3.1.0-alpha.4

- fix(website): gltf page (#1834)
- chore(parquet): Use async compression/decompression (#1835)
- feat(i3s): support ktx2 texture (#1833)
- Create loader for Building Scene Layer JSON structure. (#1832)
- chore: Reintroduce ES5 build (#1842)
- feat(textures): basis - auto-select decoder format (#1840)

## v3.1.0-alpha.3

- feat(images): Add isImageFormatSupported('image/webp') (#1825)
- chore: Use globalThis (#1826)
- feat(csv): TSV file support (#1824)
- fix: promisify wrapper to contain util import (#1817)
- feat(textures): basis - autoselect target format (#1829)
- feat(examples): parse ktx2 with basis universal (#1823)
- feat(gltf): basisu and webp extensions (#1827)
- feat(i3s): support ktx2 texture in I3SContentLoader (#1831)

## v3.1.0-alpha.2

- feat(textures): change CDN for basis encoder (#1822)

## v3.1.0-alpha.1

- feat(textures): parse KTX2 with BasisLoader (#1818)
- Add NDJSONLoader to docs (#1820)
- chore: fix lint warnings (#1814)
- NDJSONLoader (#1813)
- chore(typescript) - fix typescript warnings (#1812)
- Update Basis Transcoder + wasm file (#1803)
- feat(las): support options.las.shape (#1808)
- chore(images): add test for svg (#1810)
- bump typescript (#1811)
- chore(texture-app): fix local running of application (#1805)
- chore(example) fixed code after code review (#1806)
- fix: remove unnecessary dependencies (#1807)
- fix(images): fix svg data encoding (#1792)
- fix yarn.lock (#1802)
- chore(textures): remove unnecessary dependencies (#1787)
- bug(schema): fixed Can't reexport the named export (#1795)
- I3S-Debug-App - Fix toolbar layout (#1790)
- chore(website): fix geospatial example import and styles (#1786)
- fix: add util rule to prevent webpack error (#1788)
- chore(examples): improving code after code review (#1791)
- fix(test): remove unexisting import (#1793)
- feat(parquet): decimal logic type (#1776)
- chore(schema): Reorganize category utils (#1783)
- feat(examples): created website example with geospatial loaders (#1749)
- feat(compression/parquet): Add LZ4_RAW decompression support for Parquet (#1769)
- feat(las): arrow integration (#1765)
- I3S-Debug-App - Safari layout fixes (#1781)
- chore(examples): add inertia flag to deck.gl controller (#1768)
- I3S-App - Commont layout fixes (#1780)
- chore(I3S-Debug): add tooltips (#1775)
- I3S-Debug-App - Disable Tooltips for mobile (#1779)
- I3S-Debug-App - Fix Info panel layout (#1778)
- I3S-Apps - Fix memory widget layout (#1777)
- I3S-Debug-App - Fix debug panel layout (#1774)
- I3s-Debug-App - Fix semantic validator layout (#1772)
- Fix toogle buttons I3S-Debug-App (#1771)
- chore(I3S-Debug): buttons highlighting (#1770)
- chore(I3S-Debug): add tool bar functionality (#1763)
- yarn.lock fix (#1759)
- docs(tile-converter): fix dockerhub links (#1764)
- chore(i3s-debug-app): fix minor application issues (#1761)
- chore(i3s-debug-app): fix tile info panel bug (#1760)
- chore(I3S-Debug): tools bar for mobile (#1758)
- Add part of dummy header to LZ4 parquet files (#1754)
- Added test cases for good parquet files (#1756)
- chore(I3S): change memory stats styles (#1757)
- chore(I3S-Debug): change tile validator styles (#1755)
- docs(tile-converter): Improve dockerhub links (#1729)
- chore(I3S-Debug): UI changing - Debug Panel (#1737)
- feat(pointcloud): schema for las and ply (#1740)
- fix(core): Help browser resolution; use default export for make-node-stream.ts (#1745)
- Include id field in test data to verify mapping (#1743)
- chore(wkt): improved wkt typings (#1730)
- chore(mvt) improved types in mvt module (#1727)
- Add an out-of-view condition based on 'touchFrame' to 3d tiles request scheduling (#1739)
- fix(worker-utils/loader-utils): loaders.gl for vite (#1742)
- chore(deps): bump tar from 4.4.13 to 4.4.15
- fix(worker-utils): Use default import for "child_process" (#1741)
- chore(tsc): add noUnusedLocals rule to tsconfig (#1738)
- Parquet - Fix for decode page function (#1733)
- Bump togeojson dependency for better TCX parsing (#1735)
- chore(I3S-Debug): memory stats positioning change (#1725)
- Parquet - Snappy compression fix (#1728)
- Parquet - Add RLE_DICTIONARY support (#1721)
- Fix parquet loader regression type (#1710)
- MVTLoader binary mode supports feature.id (#1724)
- chore(wkt): improved wkt typings (#1706)
- feat(parquet): Add Parquet worker (#1722)
- chore(i3s): refactoring to fix esling warnings (#1719)
- fixes(kml): mime types (#1720)
- chore: update yarn.lock
- chore(I3S & I3SDebug): UI improvements (#1704)
- chore(I3S-debug): change random color map (#1718)
- fix: parseInBatches() can fall back to worker parser (#1717)
- fix(core): parseInBatches() runs transform even when falling back to `parse()` (#1716)
- Bump deck.gl to 8.5.0 and luma.gl to 8.5.4 (#1712)
- bug fix: const -> let for reassignment (#1714)
- chore: firm up mesh category types (#1688)
- chore(I3SDebug): change color map for depth (#1707)
- chore(deps): bump xlsx from 0.16.9 to 0.17.0 (#1699)
- Add plain dictionary codec for parquet (#1701)
- fix(3d-tiles): cesium rtc parse (#1703)
- feat(netcdf): Experimental netcdf module (#1702)
- chore(wkt): Convert module to typescript (#1705)
- chore(tiff): fix yarn test node-debug (#1700)
- chore(parquet): reader refactoring (#1698)
- I3S: fix dependencies for luma (#1697)
- I3S Example: hide widget on mobile (#1695)
- I3S debug: fix nav visibility on mobile (#1696)
- Add function to convert parquet schema to arrow schema (#1694)
- ply: fix switching dataset error (#1692)
- fix(terrain): Correct terrain bounding box (#1676)
- [parquet] fix internal dependency versions (#1686)
- Fix dependencies (#1685)
- Unlock math.gl minor/patch versions (#1689)
- chore(parquet): Use @loaders.gl/compression (#1651)
- feat: random-access parsing (#1683)
- fix(core): ReadableStream type result (#1682)
- fix(core): selectLoader type issue (#1681)
- chore: minor updates for v3 (#1674)
- chore: move master to 3.1-alpha. Drop es5 build (#1680)
- feat(core): Add makeStream(asyncIterable) (#1675)
- feat(core): Add options.\_streamRedAhead (#1679)
- fix(textures): compressed texture mime types (#1678)
- fix(csv): options.batchSize (#1677)
- tiles: improve testing (#1672)
- terrain: skirting optimization for quantized (#1669)
- Bump version in yarn.lock (#1671)
- Bump math.gl to 3.5.1 (#1670)
- chore(i3s): Add test case for ImageLoader issue for Safari browser (#1665)
- Fix(shapefile): Typing fixes (#1667)
- terrain: skirting (#1662)
- chore(schema): Prepare schema module for switch to arrow (#1666)

## v3.0

### v3.0.1

- feat(core): selectLoader(): options.mimeType, options.fallbackMimeType (#1658)
- chore: Improve `LoaderContext` type handling (#1664)
- [gis] new binaryToGeojson signature (#1656)
- examples: terrain debug with start-local (#1661)
- examples: terrain use TerrainLoader explicitly (#1652)
- fix(crypto): Conditionally call crypto.onEnd() (#1660)
- chore(docs): improve loader option documentation (#1659)
- fix: node imports (#1606)
- feat(core): Avoid `selectLoader()` exception when a 204 is received (#1193)
- examples: i3s move to website folder (#1650)
- examples: TerrainLoader (#1649)
- chore(shapefile): improve typings (#1620)
- feat: independent worker loaders (#1646)
- fix: improve typings (#1647)

## v3.0 Prerelease

### v3.0.0-beta.10

- fix(gis): Fix transform.js types (#1645)
- chore(parquet): Convert module to typescript (#1644)
- fix(i3s): Safari test error (#1643)
- Add getSingleFeature utility function (#1640)
- feat(compression/crypto): Composable API (#1622)
- fix(i3s): import Ttype ypedArray (#1639)
- tiles: fix i3s LOD selection (#1618)
- fix(docs): Remove commented markup from readme.md (#1636)
- Update deck.gl version for website (#1626)
- chore(docs): Doc cleanup (#1617)

### v3.0.0-beta.9

- feat(csv): skipEmptyLines default to true (#1632)
- fix(csv): Change default `shape` to `object-row-table` (#1631)
- Fix featureIds parsing to avoid errors in Safari browser (#1629)
- fix-typing-warnings (#1628)
- feat: Move gis category types to `@loaders.gl/schema (#1458)
- Refactor 3DTiles converter to typescript (#1619)
- feat(core): probe.gl for options warnings, handle <loader>.workerUrl (#1621)
- chore: Move mesh utils to @loaders.gl/schema (#1607)
- Move types from i3s-converter to particular modules (#1609)
- chore(docs): Update whats-new for 3.0 (#1616)
- feat: specify data format with `options.<loader>.shape` (#1615)
- fix(csv): fix typing of options.csv.skipEmptyLines (#1614)

### v3.0.0-beta.8

- fix(csv): avoid downcasting CSVLoader type (#1613)
- chore(las): Improving typings (#1603)
- fix(core): Fix import statement (#1610)
- chore: Remove lint warnings (#1611)
- I3S-Converter - Add types to functions (#1576)

### v3.0.0-beta.7

- chore: bump math.gl and probe.gl to the latest beta (#1605)
- fix(schema): Add arrow depenency (#1604)
- feat(parquet): Experimental parquet loader (#1602)
- chore(polyfills): Convert polyfills to typescript (#1598)
- chore(core): node fs handling cleanup (#1601)
- Fix draco parser (#1599)

### v3.0.0-beta.6

- fix(loader-utils): Fix normalization of text flag (#1597)
- converter: fix yarn build-converter-bundle (#1595)
- i3s: uncomment tests (#1594)
- tiles: onTraversalComplete (#1596)
- chore(pcd): Improving typings (#1591)
- feat(core): add `limit` options (#1587)
- Export MVTWorkerLoader (#1592)
- chore: convert math module to typescript (#1555)
- fix(core): Align batched parsing output from non-batched parsers (#1590)
- chore(ply): Improve typings (#1588)
- chore(loader-utils): Improve RequestScheduler typings (#1586)
- feat(chore): Add `options.mimeType` to specify fallback loader (#1584)
- chore(core): Separate file for loader option defaults (#1583)

### v3.0.0-beta.5

- fix(core): selectLoader type assertion (#1552)

### v3.0.0-beta.4

- feat(schema): Support batch debouncing (#1582)
- chore(worker-utils: Improve typing (#1581)
- chore: Improve batch processing code (#1570)
- fix(tiles): fix type export (#1579)
- Complete the move of null-loader to core (#1551)
- fix(docs/arrow): large datasets Observable notebook link, point to the original (#1577)
- I3s-attribute-loader pass fetch options (#1548)

### v3.0.0-beta.3

- fix(examples): disable regenerator babel transform for local examples (#1558)
- Remove basePath option from TileHeader class (#1559)
- chore(worker-utils): reorganize worker utils (#1561)
- core(worker-utils): Additional cleanup (#1563)
- Fix for " Property 'byteLength' is missing in type '{}' but required in type 'Buffer'" (#1566)
- chore(csv): code cleanup (#1569)
- tiles: pass through fetch options (#1550)
- fix(worker-utils): Fix for runtime error: **VERSION** is not defined (#1567)
- use loadOptions in i3s-tileset-traverser (#1557)
- i3s: pass through the token (#1571)
- I3S-App - Fix picking functionality (#1572)

### v3.0.0-beta.2

- chore: Bump ocular-dev-tools@1.0.0-alpha.6 (#1543)
- chore: Update upgrade guide (#1542)
- Resolve typings in null-loader ParseInBatches (#1540)
- fix(core): fetchFile option handling (#1549)
- Convert i3s-tile-converter to typescript (#1545)
- Enable ts checking for tests in tiles module (#1536)
- chore(examples): Refactor webpack-local-config (#1485)
- feat(zarr): Flatten zarr module, remove XML-parsing (#1462)
- feat: unbundled loaders (#1553)
- draco: arrow-like schema (#1529)
- i3s: fix draco geometry loading (#1554)

### v3.0.0-beta.1

- chore(zip): Convert zip module to typescript (#1530)
- fix(gltf): Preserve accessor properties in Draco decoded mesh attrributes (#1176)
- Fix tile-converter tests (#1531)
- Remove hardcoded dev worker config (#1517)
- chore: convert kml module to typescript (#1522)
- 3DTilesConverter: Fix for multiple of 4 error while string attribute parsing process (#1502)
- chore: Clean up types (#1528)
- chore(core): Convert core module to typescript (#1525)
- chore: Move to 3.0.0-beta releases (#1526)
- fix(tiles): Inside viewer request volume distanse to camera (#1523)
- Clear ESLint warnings (#1498)
- fix(gltf): Restore functionality of passing options from gltf to draco loader (#1504)
- I3S: rename base map: Satellite (#1506)
- 3d-tiles-app: bump deck.gl version (#1521)
- Remove segmentation data property from i3s example (#1505)
- tiles: remove unused private props (#1500)
- chore(textures): Convert module to typescript (#1514)
- i3s-app: update deck.gl version (#1513)
- chore(gltf): Add autogenerated glTF types (#1511)
- tiles: options enhancements (#1475)
- tiles: Tile traversal optimizations (#1183)
- fix(gltf): Fix option propagation (#1509)
- chore(draco): Convert module to typescript and modernize loader data. (#1508)
- feat(gltf): integrate meshopt decompression library (#1507)
- i3s-app: update deck (#1476)
- chore(tables): Rename tables module to schema (#1497)
- chore: Convert gltf module to typescript (#1483)
- chore: start typing loader options (#1496)
- chore(json): Convert json module to typescript (#1494)
- chore: Convert worker-utils to typescript (#1493)
- chore(csv): Convert module to typescript (#1495)
- feat(worker-utils): Support dynamic update of maxConcurrency etc (#1480)
- chore: Small typescript fixups (#1492)
- chore(ply): Convert ply module to typescript (#1486)
- Convert pcd module to typescript (#1491)
- I3s-Picking - Remove pickFeatures flag (#1467)
- Fix local webpack config (#1479)
- chore: Convert images module to typescript (#1481)
- chore(all): Remove deprecated methods and options (#1120)
- Add a warning message for .slpk files downloading (#1468)
- chore: Typescript branch for tiles modules (WIP) (#1417)
- feat(geotiff): Consolidate helpers for GeoTIFF images. (#1469)

### v3.0.0-alpha.21

- Fix(loader-utils|worker-utils): fix TS type exports for isolated modules (#1473)

### v3.0.0-alpha.20

- Add docker documentation to the tile-converter (#1427)
- chore: Additional typescript tooling (#1438)
- Adding docs for new tesselator option in terrainloader (#1433)
- chore: typescript build fixes (#1442)
- FIX(CSVLoader): Fix an issue where papaparse hangs for CSV files with quotes (#1434)
- geopackage: arrow schema (#1428)
- chore(tables): Convert tables module to typescript (#1451)
- chore: bundle and worker build optimizations (#1452)
- chore: upgrade math.gl (#1453)
- chore(arrow): Convert arrow module to typescript (#1450)
- build(deps): bump ws from 6.2.1 to 6.2.2 (#1444)
- chore(i3s): Convert module to typescript (#1454)
- chore: Fix typescript coverage (#1456)
- feat(geotiff): New experimental geotiff module (#1448)
- chore(loader-utils): Convert loader-utils module to typescript (#1459)
- chore(geopackage): Convert geopackage module to typescript (#1457)
- feat(zarr): Add new zarr module (#1460)
- Bounding Volume Layer - Refactoring (#1435)
- Fix for website error with textures app (#1461)
- Use parseSync from loader context, not `@loaders.gl/core` (#1464)
- Fix for mvt benchmark (#1463)
- chore: Enable typescript for eslint/prettier (#1470) (#1471)

#### v3.0.0-alpha.19

- chore: Typescript build setup (#1421)
- chore: Use babel-register for node tests (#1429)
- Fix no-did-mount-set-state eslint error in compressed texture (#1426)
- Fix "no-did-mount-set-state" eslint error in tile-validator.js (#1424)
- Fix for dangerouslySetInnerHTML lint error (#1423)
- chore(examples): Fix no-did-update-set-state eslint error for textures app (#1425)
- chore(examples): Fix PropTypes lint errors (#1422)
- geopackage: switch tests on (#1411)
- Set XML-based loaders to default to geojson output (#1415)
- fix(gltf): fix failing ci test in GTLFBuilder (#1419)
- docs(tiles): Unify data format documentation (#1408)
- Fix for ocular config (#1413)
- Rename segmentationData -> featureIds (#1404)
- fix(3d-tiles): Add additional check for batchTableJson (#1407)
- i3s-debug: debug panel refactoring (#1403)
- GeoPackage loader (#1402)
- chore: Upgrade to ocular-dev-tools@1.0.0-alpha (#1405)
- build(deps): bump dns-packet from 1.3.1 to 1.3.4 (#1399)
- Add delatin support and tesselator option (#1372)

#### v3.0.0-alpha.18

- i3s-debug: added selector for changing bounding volumes geometry (#1387)
- tiles: update isLoaded logic (#1398)
- I3S-Debug - Disable normals Validation controls if there are no normals in Tile (#1394)

#### v3.0.0-alpha.17

- B3dm - Support legacy b3dm data format (#1382)
- Tile-converter - Fix attributes loading for legacy b3dm (#1389)

#### v3.0.0-alpha.16

- chore(mvt): Use earcut from math.gl (#1391)
- i3s: optimization (#1396)
- build(deps): bump browserslist from 4.16.3 to 4.16.6 (#1397)

#### v3.0.0-alpha.15

- tiles: loadTiles option (#1376)
- I3S-Converter - Add validation flag (#1379)
- Converter - Fix file for file path (#1378)
- i3s debug app - renamed warnings in TileValidator (#1374)
- tiles: update documentation (#1383)
- i3s-debug: fix multiple viewports (#1385)
- i3s: fix tests (#1386)
- gis: Fix inefficient test (#1395)
- Chore(Arrow): Upgrade apache-arrow to 4.0.0 (#1390)

#### v3.0.0-alpha.14

- I3S-Debug - Rename ObbLayer -> BoundingVolumeLayer (#1363)
- Add ES5 bundle + fix webpack configuration (#1352)
- Chore(CSV): fix skipEmptyLines handling for streaming parsing (#1364)
- I3S-Debug - Add JSDoc for color-map.js file (#1366)
- I3S-Debug - Refactoring for tiles color (#1357)
- feat(tiles): OBB transformation (#1370)
- I3S-Converter - Cleanup top level warnings (#1365)
- Add dist.es5.min.js description to readme file (#1369)
- i3s: fix get color function (#1371)
- tiles: fix zoom evaluation for OBB (#1373)
- I3S-Debug - Fix for i3s-content-loader worker (#1375)

#### v3.0.0-alpha.13

- Chore(CSV): improve rowFormat handling and consistency (#1360)
- i3s-debug: remove yarn.lock (#1359)
- I3S-Debug - Remove normals from minimap view (#1361)
- MVT triangulation (#1356)
- Website - Remove Basis + Compressed texture loader from loaders list (#1353)
- i3s-debug: texture refactoring (#1350)
- FIX(CSVLoader): Handle duplicate header column names in CSVs (#1355)
- I3S-Picking - Use u_pickSegmentation uniform (#1354)
- Add segmentationData to tiles documentation (#1351)
- Create polyfill for Promise.allSettled() method (#1342)
- Refactoring in I3S loaders (#1347)
- i3s-debug: fix debug texture (#1348)
- i3s-debug: show-debug-texture-image (#1346)
- examples: fix yarn start-local-deck (#1345)
- I3S-Debug - Rename custom color option (#1344)
- I3S-Debug - Move Wireframe mode to tile options (#1343)
- i3s-debug: improve uv debug texture (#1338)
- I3S-Debug - Fix for tile validation (#1340)
- I3S-Debug and I3S-Picking - Fix for attributes panel (#1339)
- I3S-attribute-loader - Fix for attributes loading (#1337)
- I3S-Debug - Show normals in percentage way (#1336)
- I3S-Debug - Normals refactoring (#1335)
- build(deps): bump ssri from 6.0.1 to 6.0.2 (#1331)
- I3S-Debug - Add input for changing debug normals length (#1333)
- fix babel-runtime version (#1334)
- i3s-debug: uv debug refactoring (#1332)

#### v3.0.0-alpha.12

- I3S-Debug - Compare geometry volume vs Tile volume (#1310)
- I3S-Debug - Add normals debug feature (#1321)
- I3S-Debug - Tile debug refactoring (#1323)
- I3S-Debug - Add wireframe mode (#1327)
- i3s-debug: texture checker (#1330)
- I3S-Debug - Refactor attributes panel (#1328)
- Tile-Converter - Add '--validate-bounding-volumes' option to script (#1329)

#### v3.0.0-alpha.11

- I3s-Debug - Add tile info panel + initial selection logic for custom colors (#1288)
- i3s-debug: improve layer with obb (#1289)
- I3s-Debug - Add color picker to custom tile selection mode (#1290)
- website: add react-color component (#1291)
- I3SLoader - Add benchmark (#1294)
- I3S-Debug - Add semantic validator ui (#1295)
- I3S-Debug - Improve attributes panel in debug mode (#1292)
- I3S-Debug - Change Semantic Validator UI (#1299)
- I3S-Debug - Add LOD + OBB Validation (#1300)
- Modify MVTLoader to output binary without going through geojson (#1281)
- i3s: support texture atlas (#1282)
- tile-converter: fix attributes normalization (#1301)
- tiles: handle multiple viewports v2 (#1296)
- workflow: don't test nodejs v10 (#1307)
- i3s debug: stop loading button (#1298)
- I3S-Debug - Add clear button to semantic validator (#1302)
- I3S-Debug - Add MBS validation (#1303)
- I3S-Debug - Add validator for tile geometry (#1305)
- I3S-Debug - Attributes panel improvemets (#1308)
- i3s-debug: multiple viewports traversal (#1306)
- i3s: fix stop loading logic (#1311)
- i3s-debug: geometry & texture validation (#1309)
- tile-converter: fixes issue 1313 (#1314)
- i3s-debug: debug panel refactoring (#1316)
- tiles: refactor tileset-3d (#1315)
- i3s debug: fix obb rotation (#1320)
- i3s-debug: LOD validation (#1312)
- Tile-converter - Add Node Bounding Volumes Validation (#1319)
- i3s debug: multiple viewports refactoring (#1317)

#### v3.0.0-alpha.10

- i3s: switch content worker on (#1287)
- I3S-Picking - Load attributes only on click event (#1286)
- i3s-debug: obb layers (#1279)

#### v3.0.0-alpha.9

- i3s example: refactoring (#1264)
- Fix test for get frame state (#1263)
- I3S-Picking - small naming refactoring (#1260)
- i3s debug: use main viewport for frustum culling (#1266)
- I3S - Tile coloring in debug application (#1268)
- I3S - Tileset debugging (#1265)
- i3s-debug: options panel (#1269)
- i3s-debug: app refactoring (#1275)
- I3S - picking add url token support (#1277)
- i3s: fix coloring in 1.6 (#1276)
- I3S-debug - move memory usage to debug panel (#1278)
- build(deps): bump xmldom from 0.4.0 to 0.5.0 (#1270)
- i3s: content worker (#1285)
- I3S Converter - Fix params order in normalizeAttributesByIndicesRange function (#1284)
- I3S Parse content - check attributes before flatten process (#1283)

#### v3.0.0-alpha.8

- i3s: fix compressed texture issue (#1256)
- build(deps): bump elliptic from 6.5.3 to 6.5.4 (#1254)
- I3s-picking - add feature ids to feature attributes mapping (#1257)
- chore: code cleanup (#1261)
- fix(compression): zlib compression writes in gzip format by default (#1262)

#### v3.0.0-alpha.7

- chore: typescript 4.2.2 (#1220)
- chore: Improve coverage further (#1212)
- examples: fix i3s "yarn start" (#1192)
- i3s: material support (#1217)
- i3s: support compressed textures in material (#1224)
- I3s picking refactoring (#1215)
- Add i3s 1.6 picking support (#1228)
- I3s 1.6 picking support small fixes (#1229)
- texture: load worker from "beta" (#1223)
- Change I3S example to I3S with picking feature (#1230)
- GLTF with raw webgl (#1225)
- I3s Picking improve tooltip view (#1231)
- I3s Picking improve attributes panel (#1233)
- I3S picking - Select building using only onclick event (#1234)
- I3S picking - flatten feature ids by feature indices for compressed geometry (#1236)
- Update eslintignore and prettierignore (#1244)
- fix MVT empty binary tiles (#1235)
- textures example: fixes basis (#1239)
- I3S-picking - change attribute parsing logic (#1240)
- I3s-picking - fix feature-index parsing in compressed geometry (#1241)
- I3s-picking - fix tileset attribute urls generation (#1242)
- Small fix in camera position for loading 3dtiles (#1247)
- I3S-picking - refactor getting attributes from selected feature (#1243)
- I3S-picking fix for integrated mesh layers (#1227)
- docs: Add vis.gl, Linux Foundation and UCF links (#1252)
- i3s: fix material lighting (#1237)
- i3s: debug application (#1249)
- i3s-debug: publish on site (#1253)
- I3S-picking - fix for custom example in control panel (#1250)
- Fixes for warnings regarding unresolved options (#1232)
- I3S-picking - auto add 'layers/0' if needed to tileset url (#1251)
- i3s: fix vertex colors (#1255)

#### v3.0.0-alpha.6

- chore: Adjust default worker concurrency. Add mobile concurrency (#1213)
- fix(loader-utils): TypedArray type import (#1219)
- tests: fix VERSION issues (#1216)
- Move attributes loading logic to i3s-loader (#1209)

#### v3.0.0-alpha.5

- Removed 'encodeSync' option from dracoWriter documentation (#1147)
- Avoid mutating input object in geojsonToBinary function (#1139)
- chore: Rename createWorker to createLoaderWorker (#1150)
- chore(compression): API simplification (#1151)
- texture: fix import link (#1148)
- feat(compression): worker compression (#1152)
- feat(worker-utils): new module for worker utils (#1154)
- tile-converter: i3s converter support multiple materials (#1153)
- feat(compression): Add ZstdWorker (#1157)
- chore(crypto): Adopt async `Transform.run()` convention (#1159)
- feat(crypto): Add CryptoWorker (#1158)
- Change sharedResource href structure (#1155)
- Change geometry definitions if no texture (#1156)
- Fix for basis textures with workerUrl (#1160)
- chore{website): Bump gatsby (#1164)
- chore(docs): minor cleanup
- chore(exampled/textures): Small cleanup (#1165)
- chore(worker-utils): Cleanup WorkerThread code (#1161)
- Fix for compressed and crunch worker loaders (#1168)
- tile-converter: i3s - fix uv0 in draco (#1167)
- tile-converter: i3s - refactoring & JDOCs (#1163)
- textures: crunch tests (#1145)
- fix(website): check in yarn.lock (#1169)
- chore: Cleanup (#1170)
- tile-converter: i3s - convert COLOR_0 (#1171)
- fix(gltf): Add `accessor.byteOffset` in accessor post-processing (#1175)
- feat: Build source maps on CDN for script and worker debugging. (#1178)
- chore: Add `module` field to loader and writer objects (#1177)
- Update Docs for tile-converter on loaders.gl website (#1174)
- chore: Enable type checking in test folders (#1179)
- fix(mvt): Add extensions/mime types to support ArcGIS server
- chore(gltf): Remove deprecated files and clean up src file structure (#1182)
- Comment out octet-stream MIMEtype for the MVTLoader (#1184)
- chore(examples): copy i3s example for object picking (#1186)
- chore(examples): Add custom mesh layer to i3s-picking example (#1187)
- i3s: load draco geometry (#1190)
- i3s: docs and minor refactoring (#1191)
- chore(examples): Add shader overrides to i3s-picking
- Added layer attributes loading while picking objects (#1188)
- Added I3S objects picking initial functionality (#1199)
- tile-converter: support geometry without normals (#1197)
- i3s: make pbr material (#1201)
- Change build targets (#1205)
- I3S-Picking restore attributes panel + cleanup (#1206)
- tile-converter: i3s fixes normal conversion (#1195)
- Fix gltf types (#1207)
- i3s: refactoring (#1208)
- chore(worker-utils): Refactor worker classes. (#1204)
- chore: Add yarn caching for CI (#1210)
- Improve coverage (#1211)

#### v3.0.0-alpha.4

- Pass through options to DracoLoader (#1124)
- Dockerfile to build image (#1127)
- Texture app get extension with vendor prefixes (#1131)
- Add default value for baseColorFactor in tile-converter (#1130)
- feat(textures): Add texture format utils (#1133)
- textures: test pvr & dds (#1138)
- textures: loader workers (#1136)
- textures: refactoring (#1141)
- Fix binary-geojson transformations for empty objects (#1137)
- i3s: support compressed textures (#1142)
- Change babel config to fix es5 modules transpilation (#1144)
- Remove parseSync option from draco loader documentation (#1146)
- Use getSupportedGPUTextureFormats() in textures example (#1135)

#### v3.0.0-alpha.3

- Add GPXLoader, switch to more full-featured KML parser (#1019)
- Move NPYLoader to textures module (#1121)
- textures: support astc (#1114)
- textures: support atc (#1111)
- textures: update basis decoder binaries (#1110)
- textures: support ktx (#1115)
- Texture docs (#1119)
- MVTLoader clean up (#1089)
- textures: small refactoring (#1109)
- textures: correct module loading (#1122)
- Added more internal formats to ktx (#1123)
- Added drag&drop functionality to textures app (#1125)
- feat(excel): new module (#1106)

#### v3.0.0-alpha.2

- gltf: update GLTFScenegraph documentation (#1001)
- draco: bugfix & cleanup (#1004)
- Row based parsing: Option to enable memory usage optimizations. (#1005)
- loader-utils: new features (#1003)
- loader-utils: padToNBytes function (#1006)
- properly pass optimizeMemoryUsage param during csv parsing (#1007)
- Fix polygonIndices uint16 overflow with large rings (#1008)
- docs: Add mvt module (#1012)
- Hotfix MVTLoader doc page link
- Enable setting maximum dimensions to parse for Shapefile (#1009)
- Fix shapefile batch parsing when options.metadata: true (#1014)
- Add pull_request_target event to gh actions (#1016)
- gltf: fix removed function call (#1013)
- Fix require is not defined (rollup) (#1011) (#1015)
- gltf: fixes - parse gltf without buffers (#1017)
- Deduplicate gh actions on pull request (#1018)
- Update attribute loader to handle empty options (#995)
- arrow: writer (#1021)
- arrow: writer documentation (#1024)
- Fix options table rendering in parse.md (#1023)
- arrow: encoder - JSDoc comments & typings (#1025)
- arrow: documentation minor update (#1027)
- yarn-lock (#1028)
- tile-converter: Module for converting 3D Tiles to I3S (Esri contribution) (#1036)
- Use pull_request instead of pull_request_target for Github Actions (#1037)
- tile-converter: docs (#1039)
- draco: update to version 1.4.1 (#1029)
- Fix basemamps (#1040)
- crypto: convert zero leading hex correctly (#1044)
- draco: minor refactoring (#1046)
- Added feature ids support for compressed geometry 3DTiles -> I3s converter (#1047)
- Fixed base map selection for examples in I3S and 3DTiles (#1042)
- Added reuseWorkers option (#1038)
- Fix for workers-pool with reuseWorkers flag (#1048)
- tile-converter: update docs (#1045)
- tile-converter: minor docs update (#1052)
- Add "rowBased" option for arrow loader (#1035)
- draco: get rid of local libs (#1056)
- tile-converter: install-depndencies (#1055)
- tests: draco bench test (#1060)
- Add global version for loaders (#1054)
- draco: increase decompression performance (#1061)
- Added texture testing tool (#1063)
- tile-converter: update documentation (#1066)
- tile-converter: update documentation (#1067)
- Refactoring of texture-tester app (#1068)
- tile-converter: install \*.pgm from deck.gl-data (#1069)
- polyfills: test 302 redirect (#1071)
- textures: rename basis module (#910)
- Compressed textures: pvr & dds (#1076)
- texture: compressed texture format selection (#1070)
- Added WEBGL_compressed_texture_etc1 support for for compressed texture loader (#1072)
- textures: dds parser (#1075)
- polyfills: follow redirect option (#1077)
- polyfills: follow redirect by default (#1078)
- gltf: change buffer parsing order (#1080)
- Changed bundle config to produce dist.min.js in ES5 (#1085)
- feat(examples/texture-tester): Use luma.gl API (#1083)
- build(deps): bump ini from 1.3.5 to 1.3.8 (#1059)
- Rewrite texture-tester page to React app (#1084)
- Added stats popover to texture-tester app (#1087)
- textures: crunch (#1086)
- Add textures example to website (#1088)
- Refactoring of texture app (#1092)
- examples/textures: add docs, add KTX parser/writer stubs (#1094)
- textures: Move `texture-api` from `images` to `textures` (#1095)
- Move file sizes logic to loaders in textures app (#1093)
- Textures app - fix for basis textures (#1097)
- Added additional description fields to textures app (#1096)
- FIx for uncompressed image textures (#1102)
- chore(website): polish textures example (#1104)
- website: textures - use luma for rendering (#1101)
- Add MVT MIME type (#1108)
- textures: jsdoc comments & documentation (#1107)
- gltf: pass only minimal options to DracoLoader to avoid messaging ove… (#1113)

#### v3.0.0-alpha.1

- gltf: refactor GLTFScenegraph (#991)
- Added default options for i3s-attribute-loader (#990)
- gltf: enhance gltf scenegraph (#987)
- Option to use float64 for LAS positions (#958)
- add browser excludes (#989)
- Add NPY Loader (#986)
- gltf: enhance gltf builder (#979)
- Changed attribute loader logic (#984)
- Support loading i3s feature ids (#971)
- gltf: enhance GLTFScenegraph (#976)
- update gltf builder (#970)
- i3s: test I3S content loader (#966)
- Added attributes loader for I3s (#964)
- Gltf up axis support (#965)

## v2.3 Release

#### v2.3.1

- Gltf up axis support (#965)
- Added attributes loader for I3s (#964)
- Add NPY Loader (#986)
- Add browser excludes (#989)

#### v2.3.0

- Bump to math.gl@3.3.0 (#968)

## v2.3 Prereleases

#### v2.3.0-beta.3

- Fix image loader using imagebitmap options (#963)
- i3s: handle nodepages (#960)
- 3d-tiles: Fix encodeSync based tests (#962)
- vb/draco metadata (#956)
- draco: upgrade libs to version 1.3.6 (#959)

#### v2.3.0-beta.2

- Set isTileset to 'auto' in tile-3d to enable loading an external tileset json within a tile. (#947)
- Draco: Fix for the case that extraAttributes are provided in options (#948)
- Shapefile Multipolygon fix (#955)

#### v2.3.0-beta.1

- Added an I3S example that uses the Arcgis basemap. (#954)
- Set worker url to local file for shapefile tests (#953)
- website: Restore gltf frontpage
- Delete less (#951)
- [MVT] Fix tile index check (#950)

#### v2.3.0-alpha.14

- json: Fix streaming of array of arrays (#946)

#### v2.3.0-alpha.13

- draco: fixes draco3d memory leak (#944)
- Fix docs link (#945)
- draco: Custom attributes (#942)
- gltf: parseGLBV1 function fixed (#943)
- draco: Add draco3d types (#941)
- Add support for extraAttributes in DracoLoader (#940)
- Streaming shapefile fixes (#937)
- las: add a safeguard for two bytes color detection (#935)
- Shapefile: types (#931)

#### v2.3.0-alpha.12

- Reproject shapefile (#932)
- obj: Add schema (#933)
- pcd: Add schema (#930)
- las: parse two-bytes colors (#927)
- Shapefile: parse in batches (#925)
- Coerce web stream from Uint8Array to ArrayBuffer (#929)
- table: Add arrow-compatible types (#924)
- Coerce each chunk of a Node stream to an ArrayBuffer (#928)
- shapefile: cleanup (#923)
- shapefile: rename files (#922)
- compression: Support streaming (#871)
- Crypto doc correction (#920)
- Binary to GeoJson fix for individual geometries (#919)
- gltf: partial support for GLBv1 and glTFv1 (#912)
- shapefile: doc improvements (#917)
- Shapefile: shp/dbf state parser (#913)
- Include tsc in pre commit hook (#914)

#### v2.3.0-alpha.11

- Reprojection wrappers for binary and geojson (#906)
- basis: Add CompressedTextureWriter (#909)
- polyfills: Blob/File/FileReader polyfills (#907)
- loader-utils: concatenateChunksAsync perf increase (#905)
- shapefile: refactor DBF parser (#903)
- shapefile: streaming (#901)
- website: Bump deck.gl@8.2.5 (#900)
- shapefile: detect magic number (#899)

#### v2.3.0-alpha.10

- Use namespace for node imports (#896)
- typescript: gltf (#897)
- typescript: enable math module (#895)
- 3d-tiles: typescript (#894)
- typescript updates (#893)
- [Bug] Fix incorrect text/json mimeType (#892)

#### v2.3.0-alpha.9

- CI: fix cache (#891)
- CI: add cache to .travis.yml (#890)
- bump ocular-dev-tools: no generator transpile in es6 dist (#889)
- pcd: color and normal attribute fixes (#888)
- crypto: fix transform iterators (#887)
- pcd: Fix color = 0 after loading (#886)
- core: `parseInBatches` support for `options.transforms` (#883)

#### v2.3.0-alpha.8

- crypto: Add crc32c transform (#882)
- Remove duplicate shapefile worker loader files (#881)
- flatgeobuf: New module for flatgeobuf format (#880)
- Docs: contributing.md cleanup (#878)
- Use template contributing.md (#753)
- crypto: fixes and cleanup (#876)
- Fix name of indices returned from SHPLoader (#875)

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
- tables: @loaders.gl/experimental => @loaders.gl/schema (#500)
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
