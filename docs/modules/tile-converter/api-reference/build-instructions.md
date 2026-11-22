---
title: Tile converter build instructions
description: Build and run the tile converter from a repository checkout.
---

# Tile converter build instructions

Build from source to try a change that is ahead of the published package. From the repository
root, install the workspace dependencies and build the packages, workers, and apps.

```sh
yarn install
yarn build
yarn build-workers
yarn build-apps
```

Run the CLI from the checkout using the same commands as the installed package.

```sh
node apps/tile-converter/bin/converter.js --help
node apps/tile-converter/bin/converter.js inspect ./dataset/tileset.json
```

See the [CLI reference](../cli-reference/tile-converter-v5.md) for conversion examples, options,
and limits.
