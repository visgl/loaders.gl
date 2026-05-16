This is a standalone web app using `@loaders.gl/ply`, `@loaders.gl/splats`, and `@loaders.gl/deck-layers`.

### Usage

```bash
yarn
yarn start
```

### Supported Sources

The URL input accepts Gaussian splat `.ply`, `.splat`, `.ksplat`, and `.spz` sources. SPZ loading uses `SPZLoader` with the `zstd-codec` module injected for ZSTD decompression.
