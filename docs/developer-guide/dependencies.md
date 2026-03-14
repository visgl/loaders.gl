# Managing Dependencies

Some loaders and writers need external JavaScript or WebAssembly runtimes at execution time. Examples include Draco decoders and Basis encoder/transcoder modules.

Use `options.modules` to control how those runtimes are provided.

## `options.modules`

`options.modules` is a map of runtime overrides:

```typescript
{
  modules: {
    draco3d,
    'draco_decoder.wasm': decoderWasmUrl,
    'basis_encoder.js': basisEncoderUrl
  }
}
```

Each loader or writer supports its own keys. See the corresponding API reference page for the exact keys it recognizes.

Typical keys fall into two categories:

- Bundled module objects, such as `modules.draco3d` or `modules.basisEncoder`
- URL or asset overrides, such as `'draco_decoder.wasm'` or `'basis_encoder.js'`

## Two Ways To Use It

### Inject a bundled module object

Use this when a loader supports a preloaded runtime object from your application bundle.

Example: bundling the full `draco3d` package:

```typescript
import draco3d from 'draco3d';
import {setLoaderOptions} from '@loaders.gl/core';

setLoaderOptions({
  modules: {
    draco3d
  }
});
```

This avoids loading the Draco runtime from the default remote URLs.

### Override individual runtime asset URLs

Use this when you want loaders.gl to keep loading a runtime dynamically, but from URLs that you control.

Example: overriding the Draco decoder assets:

```typescript
import {setLoaderOptions} from '@loaders.gl/core';

setLoaderOptions({
  modules: {
    'draco_wasm_wrapper.js': '/static/loaders/draco_wasm_wrapper.js',
    'draco_decoder.wasm': '/static/loaders/draco_decoder.wasm'
  }
});
```

This is useful when your application serves copied assets from its own server or when your bundler emits static asset URLs.

## Examples

### Draco

Bundled module injection:

```typescript
import draco3d from 'draco3d';
import {load} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';

const mesh = await load(url, DracoLoader, {
  modules: {
    draco3d
  }
});
```

URL overrides:

```typescript
const mesh = await load(url, DracoLoader, {
  modules: {
    'draco_wasm_wrapper.js': '/vendor/draco/draco_wasm_wrapper.js',
    'draco_decoder.wasm': '/vendor/draco/draco_decoder.wasm'
  }
});
```

### Basis

Bundled encoder injection:

```typescript
const texture = await load(url, CompressedTextureLoader, {
  'compressed-texture': {useBasis: true},
  modules: {
    basisEncoder
  }
});
```

URL overrides:

```typescript
const texture = await load(url, BasisLoader, {
  basis: {module: 'transcoder'},
  modules: {
    'basis_transcoder.js': '/vendor/basis/basis_transcoder.js',
    'basis_transcoder.wasm': '/vendor/basis/basis_transcoder.wasm'
  }
});
```

## Interaction With `CDN` And `useLocalLibraries`

`options.modules` is the most explicit override mechanism and should be preferred over CDN configuration.

Related options:

- `options.core.CDN` changes the default loaders.gl CDN base URL used when a loader resolves one of its own runtime files through loaders.gl paths.
- `options.core.useLocalLibraries` forces loaders.gl to resolve certain external runtime URLs through loaders.gl-managed paths.

In practice:

- If you provide a bundled module object such as `modules.draco3d`, that object is used directly.
- If you provide per-file keys such as `'basis_encoder.wasm'`, the loader may use those URLs instead of the default loaders.gl runtime locations.
- If you provide neither, loaders.gl falls back to its built-in runtime loading logic for that loader or writer.

`useLocalLibraries` is mainly relevant for loaders that start from third-party absolute URLs, such as Draco. It is not a replacement for `options.modules`.

## Recommended Usage

- Use `options.modules` for application-specific runtime overrides.
- Prefer bundled module injection when a loader supports it, because it avoids extra runtime fetches.
- Use per-file URL overrides when your build emits static assets and you want loaders.gl to fetch those emitted files.

## Supported Keys

The supported `options.modules` keys are loader-specific and writer-specific.

Examples:

- [DracoLoader](/docs/modules/draco/api-reference/draco-loader)
- [DracoWriter](/docs/modules/draco/api-reference/draco-writer)
- [BasisLoader](/docs/modules/textures/api-reference/basis-loader)
- [CompressedTextureLoader](/docs/modules/textures/api-reference/compressed-texture-loader)
- [KTX2BasisWriter](/docs/modules/textures/api-reference/ktx2-basis-texture-writer)
