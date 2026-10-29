Tile converter

# Move tiled datasets between compatible standards.

`@loaders.gl/tile-converter` provides command-line and JavaScript tools for converting I3S and 3D Tiles data. Use the APIs when conversion is part of an application, or the CLI when it belongs in a build or data-preparation workflow.

[V5 CLI](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter-v5.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter-v5.md)[I3S converter](https://loaders.gl/next/docs/modules/tile-converter/api-reference/i3s-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/api-reference/i3s-converter.md)[3D Tiles converter](https://loaders.gl/next/docs/modules/tile-converter/api-reference/3d-tiles-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/api-reference/3d-tiles-converter.md)[Experimental v5 core](https://loaders.gl/next/docs/modules/tile-converter/api-reference/v5-conversion.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/api-reference/v5-conversion.md)[Conversion support](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/supported-features.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/supported-features.md)[Build instructions](https://loaders.gl/next/docs/modules/tile-converter/api-reference/build-instructions.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/api-reference/build-instructions.md)

The conversion path

## Choose a qualified conversion profile.

The converter uses the loaders.gl format implementations at the edges and keeps conversion concerns in one place, whether it runs from a Node.js API or a command-line bundle.

01

Input

I3S, 3D Tiles or decoded point data

02

Conversion

Explicit content, feature and spatial policies

03

Execution

JavaScript API or command line

04

Output

Authored resources, directories or bounded archives

Detailed guide

## Conversion and CLI details

The reference below covers installation, converter APIs, build and bundle instructions, CLI usage, supported features, and format standards.

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

![logo](/next/assets/images/3d-tiles-small-9b88f9838ace93fab9c0d83504fe9b4f.png)

## Installation[​](#installation "Direct link to Installation")

For CLI

```
npm install @loaders.gl/tile-converter
```

For API

```
npm install @loaders.gl/core

npm install @loaders.gl/tile-converter
```

## Choose a workflow[​](#choose-a-workflow "Direct link to Choose a workflow")

| Workflow                 | Entry point                                                                                                              | Current scope                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Experimental v5 Node CLI | [`tile-converter-v5`](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter-v5.md)       | Inspect, validate and convert explicitly selected meshes; opt-in complete explicit hierarchy for 3D Tiles/3TZ |
| Portable v5 API          | [`/v5/core` and `/v5/adapters`](https://loaders.gl/next/docs/modules/tile-converter/api-reference/v5-conversion.md) | Mesh/point processing, declared features and CRS operations, bounded archive output                           |
| Browser application      | [Inline conversion app](https://loaders.gl/next/examples/tiles/3d-tiles-conversion)                                 | Inspect, select, convert and download partial SLPK/3TZ collections                                            |
| Legacy v4 Node CLI       | [`tile-converter`](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter.md)             | Original I3S ↔ 3D Tiles workflow, filesystem/services and texture atlases                                     |

The documentation describes the current repository implementation. Check the installed package version before using experimental v5 capabilities.

## Command line[​](#command-line "Direct link to Command line")

Start with metadata inspection; conversion requires explicit content IDs from the result:

```
npx tile-converter-v5 inspect ./tileset.json

npx tile-converter-v5 validate ./tileset.json --resource tile-root-content-0

npx tile-converter-v5 convert ./tileset.json --resource tile-root-content-0 --output ./converted.3tz
```

See the [v5 CLI reference](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter-v5.md) for output formats, feature-schema controls, geometric-error policy and protected destinations.

## API[​](#api "Direct link to API")

A JavaScript API is also available:

* `I3SConverter` class that converts 3DTiles to I3S
* `Tiles3DConverter` class that converts I3S to 3DTiles
* The experimental [`/v5/core` and `/v5/adapters` APIs](https://loaders.gl/next/docs/modules/tile-converter/api-reference/v5-conversion.md) for portable mesh/point conversion, explicit feature mapping and archive output.

The `tile-converter-v5` command uses the shared v5 sources, codecs and sinks. The original `tile-converter` command uses the legacy converter classes.

### Runtime portability[​](#runtime-portability "Direct link to Runtime portability")

The legacy converters, command-line tools and HTTP server require Node.js. Their filesystem, service and texture-atlas operations remain separate from the experimental v5 conversion APIs. V5 core and adapters use portable binary data and run in Chromium and Node.js with application-provided input readers, output sinks and decoder assets.

## Conversion support[​](#conversion-support "Direct link to Conversion support")

The [supported-feature matrix](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/supported-features.md) distinguishes the legacy CLI from experimental v5 profiles. V5 converts selected static GLB/B3DM meshes or original-coordinate I3S `3DObject`/`IntegratedMesh` meshes into authored I3S/SLPK or 3D Tiles/3TZ resources. It preserves supported materials, one PNG/JPEG base-color map and explicitly mapped Arrow features, with Draco Edge Breaker enabled by default. Selected decoded points can also be written as PNTS and partial 3TZ collections through the API.

The [browser archive example](https://loaders.gl/next/examples/i3s-slpk) accepts a 3D Tiles URL, an I3S layer URL, or a local/remote SLPK or 3TZ archive and converts selected meshes to either SLPK or 3TZ. It provides metadata inspection, explicit selection, progress, cancellation, download/preview and native file saving where supported. Its limits are 1,000 inspected declarations/nodes, 64 mesh placements, 16 MiB input and decoded-resource budgets, 32 MiB output/archive budgets and 1 cm position rounding. Conversion archives must be at most 16 MiB. Remote archives require HTTP byte ranges and exposed ETag or Last-Modified validators; the inspected identity is checked again during conversion. These limits do not bound total peak memory.

The browser example and default Node workflow produce flat partial collections. To retain explicit 3D Tiles hierarchy/LOD and ADD/REPLACE, select every binary content and opt in to the [complete hierarchy profile](https://loaders.gl/next/docs/modules/tile-converter/api-reference/v5-conversion.md#complete-explicit-hierarchy-profile) for 3D Tiles/3TZ output. It supports external document placements, ordered multiple contents and static multiple primitives, within 32 documents, 256 tiles and 64 primitive placements. I3S screen-size LOD, implicit tiling, instancing and unmapped tile/group metadata remain separate work. Feature schemas and CRS/height operations must be declared explicitly. I3S-to-3TZ conversion requires a conservative geometric error in meters. Archive dependencies must stay inside the selected archive; external dependencies are rejected. Indexed reads and decompressed responses have separate input byte gates. See the [v5 API guide](https://loaders.gl/next/docs/modules/tile-converter/api-reference/v5-conversion.md) for exact profiles.

### Archive output and storage[​](#archive-output-and-storage "Direct link to Archive output and storage")

`createTileConversionArchive` packages successfully finalized format resources as indexed SLPK or 3TZ Blobs. Selecting a container does not convert its geometry or metadata.

For application-owned storage, `encodeTileConversionArchiveInBatches` streams finalized SLPK/3TZ resources with consumer-controlled backpressure and cancellation. Finalize storage only after iteration succeeds and discard partial output on failure. The browser archive example transfers acknowledged archive chunks from its worker. It can retain Blob parts for download/preview or, where the native save picker is available, await each file write before requesting the next chunk. Direct saving collects no archive Blob parts and commits the file only after successful completion; cancellation before final close aborts the file stream. Neither mode creates a complete archive buffer in the worker or guarantees a total memory cap. See the [v5 application guide](https://github.com/visgl/loaders.gl/tree/master/apps/tile-converter#stream-an-archive-to-storage).

## References[​](#references "Direct link to References")

* The `@loaders.gl/tiles-3d/i3s` module supports loading and traversing Indexed 3d Scene Layer (I3S).

* The `@loaders.gl/tiles-3d/3d-tiles` module supports loading and traversing 3D Tiles.

* [I3S Indexed Scene Layer Specification](https://github.com/Esri/i3s-spec) - The living specification.

* [3D Tiles Specification](https://github.com/AnalyticalGraphicsInc/3d-tiles) - The living specification.

* [OGC I3S Indexed Scene Layer Standard](http://www.ogc.org/standards/i3s) - The official standard from [OGC](https://www.opengeospatial.org/), the Open Geospatial Consortium.

* [OGC 3D Tiles Standard](https://www.opengeospatial.org/standards/3DTiles) - The official standard from [OGC](https://www.opengeospatial.org/), the Open Geospatial Consortium.

## Additional build instructions[​](#additional-build-instructions "Direct link to Additional build instructions")

There are additional ways to perform conversion:

* Tile converter can be run right on a repository branch. It might be helpful if some updates are needed which last release doesn't contain [Build instructions](https://loaders.gl/next/docs/modules/tile-converter/api-reference/build-instructions.md).
* An autonomous bundle script can be built. It packages the legacy converter into one file for distribution. [See instructions](https://loaders.gl/next/docs/modules/tile-converter/api-reference/tile-converter-bundle.md).

## Attribution[​](#attribution "Direct link to Attribution")

The tile-converter module represents a major development effort and was funded and contributed to loaders.gl by Esri.

![logo](data:image/jpeg;base64,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)

MIT License.
