# Splats

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `@loaders.gl/splats` module loads binary Gaussian splat files for rendering or processing as Mesh Arrow tables.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/splats
```

## Loaders

| Loader                                                        | Description                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------- |
| [`SPLATLoader`](/docs/modules/splats/api-reference/splat-loader)   | Loads raw `.splat` Gaussian splat files.                   |
| [`KSPLATLoader`](/docs/modules/splats/api-reference/ksplat-loader) | Loads GaussianSplats3D `.ksplat` files from full buffers. |

## Formats

| Format                                      | Description                                          |
| ------------------------------------------- | ---------------------------------------------------- |
| [SPLAT / KSPLAT](/docs/modules/splats/formats/splats) | Binary Gaussian splat formats for real-time scenes. |
