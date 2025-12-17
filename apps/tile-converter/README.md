# @loaders.gl/tile-converter

[![Tile converter release](https://github.com/visgl/loaders.gl/actions/workflows/tile-converter-release.yml/badge.svg)](https://github.com/visgl/loaders.gl/actions/workflows/tile-converter-release.yml)

[loaders.gl](https://loaders.gl/docs) is a collection of framework independent 3D and geospatial parsers and encoders.

This application contains command line scripts and JavaScript APIs for converting between formats, for instance between 3D Tiles and I3S tilesets. The source code, Dockerfile, and CLI entry points now live under `apps/tile-converter`, and the package version is managed in this app’s `package.json` to support independent releases.

For documentation please visit the [website](https://loaders.gl).

## Installation

```bash
npm install @loaders.gl/tile-converter
```

## Builds and CI

- Automated npm package and Docker image publishing is handled by the [tile-converter release workflow](https://github.com/visgl/loaders.gl/blob/master/.github/workflows/tile-converter-release.yml).
- Tagging a commit with `tile-converter-v*` will trigger the release workflow using the version declared in `apps/tile-converter/package.json`.
- Focused CI coverage for this app runs via the `tile-converter` job in the main [`test.yml`](https://github.com/visgl/loaders.gl/blob/master/.github/workflows/test.yml) workflow using `yarn test-tile-converter`.
