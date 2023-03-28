# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

![logo](./images/3d-tiles-small.png)

## Installation

For CLI

```bash
npm install @loaders.gl/tile-converter
```

For API

```bash
npm install @loaders.gl/core
npm install @loaders.gl/tile-converter
```

## Command Line Utilities

`tile-converter` - the npx tool for launch conversion

## API

A JavaScript API is also available:

- `I3SConverter` class that converts 3DTiles to I3S
- `Tiles3DConverter` class that converts I3S to 3DTiles

Note: the command line tools are implemented using this API and offer the same functions.

## References

- The `@loaders.gl/i3s` module supports loading and traversing Indexed 3d Scene Layer (I3S).
- The `@loaders.gl/3d-tiles` module supports loading and traversing 3D Tiles.

- [I3S Indexed Scene Layer Specification](https://github.com/Esri/i3s-spec) - The living specification.
- [3D Tiles Specification](https://github.com/AnalyticalGraphicsInc/3d-tiles) - The living specification.
- [OGC I3S Indexed Scene Layer Standard](http://www.ogc.org/standards/i3s) - The official standard from [OGC](https://www.opengeospatial.org/), the Open Geospatial Consortium.
- [OGC 3D Tiles Standard](https://www.opengeospatial.org/standards/3DTiles) - The official standard from [OGC](https://www.opengeospatial.org/), the Open Geospatial Consortium.

## Additional build instructions

There are additional ways to perform conversion:

- Tile converter can be run right on a repository branch. It might be helpful if some updates are needed which last release doesn't contain [Build instructions](modules/tile-converter/docs/api-reference/build-instructions.md).
- An autonomous bundle script can be built. It is entire converter in just 1 file. This file can be destributed directly to interested but not experienced user. [See instructions](modules/tile-converter/docs/api-reference/tile-converter-bundle.md).

## Attribution

The tile-converter module represents a major development effort and was funded and contributed to loaders.gl by Esri.

![logo](./images/esri.jpeg)

MIT License.
