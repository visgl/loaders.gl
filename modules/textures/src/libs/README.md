# Basis Universal runtimes

These files are built by [Basis Universal](https://github.com/BinomialLLC/basis_universal)
at commit [`38168767f42d5a77fb777594630825e0547b4489`](https://github.com/BinomialLLC/basis_universal/commit/38168767f42d5a77fb777594630825e0547b4489).
That July 18, 2026 artifact rebuild includes the v2.50 codecs and the latest KTX2 bounds checks.

The runtime artifacts were copied without modification from:

- `webgl/transcoder/basis_transcoder.js`
- `webgl/transcoder/basis_transcoder.wasm`
- `webgl/encoder/basis_encoder.js`
- `webgl/encoder/basis_encoder.wasm`

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `basis_transcoder.js` | 50,538 | `720dd9bd09c7cada6d87f1b7b70cec713df04da88cd641ac3212559353834dc8` |
| `basis_transcoder.wasm` | 1,060,846 | `a0f65d4a30ecb3269d01ead7d0a3477d2b0208146d083625a90623f473f6c139` |
| `basis_encoder.js` | 103,878 | `d225ce1e7012609bcfbe338351c8778d95eb1c19d404314d513b2b2df94a6ffb` |
| `basis_encoder.wasm` | 3,287,321 | `48d4e39ccaa1e290a17d00c13b353a728227bb439108d5e6c944fe6ab80552db` |

The transcoder is the runtime dependency for both `.basis` and KTX2 decoding. The encoder is
loaded independently and only by `KTX2BasisWriter`.

## License

Basis Universal is licensed under Apache License 2.0. See [BASIS-LICENSE](./BASIS-LICENSE) and
[BASIS-NOTICE](./BASIS-NOTICE).
