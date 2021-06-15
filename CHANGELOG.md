## v3.0 Prerelease

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

    CI: fix cache (#891)
    CI: add cache to .travis.yml (#890)
    bump ocular-dev-tools: no generator transpile in es6 dist (#889)
    pcd: color and normal attribute fixes (#888)
    crypto: fix transform iterators (#887)
    pcd: Fix color = 0 after loading (#886)
    core: `parseInBatches` support for `options.transforms` (#883)

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
