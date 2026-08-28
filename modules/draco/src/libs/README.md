# Draco runtime assets

The vendored files are pinned to the official [Google Draco 1.5.7 release](https://github.com/google/draco/releases/tag/1.5.7), commit [`8786740086a9f4d83f44aa83badfbea4dce7a1b5`](https://github.com/google/draco/tree/8786740086a9f4d83f44aa83badfbea4dce7a1b5). No generated wrapper, fork, or unverified third-party build is used. The upstream source repository is [google/draco](https://github.com/google/draco/tree/8786740086a9f4d83f44aa83badfbea4dce7a1b5), and the npm package is the Google-published [`draco3d@1.5.7`](https://www.npmjs.com/package/draco3d/v/1.5.7) package.

| File | Upstream provenance | SHA-256 |
| --- | --- | --- |
| `draco_decoder.js` | [Google-hosted official fallback](https://www.gstatic.com/draco/versioned/decoders/1.5.7/draco_decoder.js) | `5656ccaf1f50300e3c318e15c3313430483f3866cd9c25f22fbf9d6f229e6728` |
| `draco_decoder.wasm` | [`draco3d@1.5.7` package](https://unpkg.com/draco3d@1.5.7/draco_decoder.wasm) | `2516a4e43526d71787bf2f678f951329f7f858f8f15f42d4bc9e370b31a0da3a` |
| `draco_decoder_gltf.wasm` | [Google-hosted official glTF decoder](https://www.gstatic.com/draco/versioned/decoders/1.5.7/draco_decoder_gltf.wasm) | `712db3449ae2041d6e8a224c395bda6cedb49e51322fae38b7db9beb8b381889` |
| `draco_encoder.js` | [`draco3d@1.5.7` package](https://unpkg.com/draco3d@1.5.7/draco_encoder.js) | `8434adecd1446459601763e499be3697546056bca90b286a538ae0483a00845a` |
| `draco_encoder.wasm` | [`draco3d@1.5.7` package](https://unpkg.com/draco3d@1.5.7/draco_encoder.wasm) | `d2a3ac80c91980d5d321c116454834ff36264825c6d1794cc84e42288f158958` |
| `draco_wasm_wrapper.js` | [`draco3d@1.5.7` package](https://unpkg.com/draco3d@1.5.7/draco_wasm_wrapper.js) | `e8049906ef3f8f75d3456c22a3f31bfdfe5b5b5bd09ccdec613b9e9a49d554d8` |
| `draco_wasm_wrapper_gltf.js` | [Google-hosted official glTF wrapper](https://www.gstatic.com/draco/versioned/decoders/1.5.7/draco_wasm_wrapper_gltf.js) | `8bb2952dba7d67e1414f8df819410cb0434a666be53f671fff75f68843d76f6` |

The npm package is pinned by the repository lockfile checksum as well. Verify a replacement asset against this manifest before committing it; a hash mismatch requires re-auditing the upstream release rather than silently accepting a new build. The assets are distributed under the Apache License 2.0 in [`DRACO-LICENSE`](./DRACO-LICENSE).
