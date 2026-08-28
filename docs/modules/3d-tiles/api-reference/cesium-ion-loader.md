# CesiumIonLoader

`CesiumIonLoader` extends `Tiles3DLoader` with Cesium ion asset discovery and authentication. It
uses an application access token to resolve an asset endpoint, then scopes the endpoint token
returned by ion to the resolved asset origin. Nested tiles, external tilesets, and deck.gl
`Tile3DSourceLayer` requests retain that credential.

## Usage

```ts
import {load} from '@loaders.gl/core';
import {CesiumIonLoader} from '@loaders.gl/3d-tiles';

const tileset = await load(
  'https://assets.cesium.com/123/tileset.json',
  CesiumIonLoader,
  {
    'cesium-ion': {
      assetId: 123,
      accessToken: ionAccessToken
    }
  }
);
```

The URL identifies the asset after bootstrap; `assetId` identifies the ion API resource. If
`assetId` is omitted, the loader can infer it from a conventional `/<id>/tileset.json` URL or use
the first visible `3DTILES` asset.

## Authentication lifecycle

1. The application access token is sent as a bearer token only to `https://api.cesium.com`.
2. The ion asset and endpoint documents are fetched.
3. The returned endpoint URL becomes the tileset URL.
4. The returned endpoint token is installed as an exact-origin credential for tileset and tile
   requests.

This prevents either token from leaking when a tileset contains a resource on another origin. To
use an async account-token provider, create a `createCesiumIonCredential` preset and pass it via
`core.credentials`. See the [authentication guide](/docs/developer-guide/authentication#cesium-ion).

## Options

`CesiumIonLoader` inherits all [`Tiles3DLoader` options](./tiles-3d-loader).

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `cesium-ion.accessToken` | `string` | `null` | Cesium ion application access token |
| `cesium-ion.assetId` | `number \| string` | inferred | Asset resolved through the ion REST API |
| `cesium-ion.onError` | `(error) => void` | `null` | Called when endpoint bootstrap fails; the error is still thrown |
| `cesium-ion.isTileset` | `boolean \| 'auto'` | `'auto'` | Inherited content-category assertion |
| `cesium-ion.loadGLTF` | `boolean` | `true` | Fetch and parse linked glTF resources |

The parsed data formats are identical to `Tiles3DLoader`.
