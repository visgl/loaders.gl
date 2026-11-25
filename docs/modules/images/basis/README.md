# @loaders.gl/images/basis

APIs for BASIS data in the images module.

```typescript
import {BasisTextureFormat, KTX2BasisTextureFormat, BasisLoaderOptions, BasisASTCBlockSize} from '@loaders.gl/images/basis';
```

Import `getSupportedBasisFormats` and `selectSupportedBasisFormat` from `@loaders.gl/images/api` to choose a GPU transcode target. The Basis loader and writer initialize their codecs when needed.

## API

| Export | Kind |
| --- | --- |
| `BasisLoaderOptions` | Type |
| `BasisWorkerLoaderWithParser` | Loader |
| `BasisLoaderWithParser` | Loader |
| `BasisLoader` | Loader |
| `KTX2BasisWriterOptions` | Type |
| `KTX2BasisWriter` | Writer |
| `BasisASTCBlockSize` | Type |
| `BasisCodec` | Type |
| `BasisFormat` | Type |
| `BasisFormatSelection` | Type |
| `BasisTextureInfo` | Type |
| `BasisSupportedTextureFeatures` | Type |
| `BasisFormatOption` | Type |
| `BasisTargetFormat` | Type |
| `BasisEncoderFormat` | Type |
| `BasisImageData` | Type |
| `selectSupportedBasisFormat` | Utility |
| `getSupportedBasisFormats` | Utility |
| `KTX2BasisWriterWorker` | Utility |
| `BasisTextureFormat` | Utility |
| `KTX2BasisTextureFormat` | Utility |

## Reference

- [basis loader](/docs/modules/images/texture/api-reference/basis-loader)

See the [images module](/docs/modules/images) for installation and related entrypoints.
