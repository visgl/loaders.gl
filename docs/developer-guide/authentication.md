---
title: Authentication
description: Carry credentials through file, tile, and service requests without coupling loaders.gl to a sign-in system.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Application-owned credentials"
  title="Keep authentication with the request."
  description="Loaders.gl carries tokens through file, tile, and service requests while your application remains responsible for sign-in, secure storage, and token issuance."
  tone="blue"
  meta={['Static tokens', 'Refresh callbacks', 'Origin-scoped requests']}
  links={[
    {label: 'Services module', to: '/docs/modules/services'},
    {label: 'Loader options', to: '/docs/modules/core/api-reference/loader-options'}
  ]}
/>

<DocOrientation
  eyebrow="The credential boundary"
  title="Configure access once. Let sources reuse it."
  description="A credential can cover the follow-up requests made by a source, including metadata, tiles, and data ranges, without putting provider-specific sign-in logic into every loader."
  tone="blue"
  items={[
    {label: 'Application', value: 'Acquires, stores, and refreshes credentials'},
    {label: 'Loaders.gl', value: 'Matches credentials to the request origin'},
    {label: 'Sources', value: 'Reuse credentials for nested requests'},
    {label: 'Precedence', value: 'Explicit URL or request headers win'}
  ]}
/>

loaders.gl uses one credential pipeline for files, tiles, service metadata, and the follow-up
requests made by a source. Applications provide a static token or an asynchronous token callback;
loaders.gl decides where that credential may be sent and carries it through `load`,
`createDataSource`, service runtimes, and deck.gl source layers.

The pipeline deliberately does not implement sign-in screens, OAuth redirects, secure storage, or
provider token issuance. Those remain application responsibilities. Its job begins when the
application can return a usable token.

<ReferenceBoundary
  title="Credential configuration"
  description="The sections below cover provider presets, static and refreshing tokens, origin matching, and request precedence."
  tone="blue"
/>

## The minimal pattern

Provider presets live in `@loaders.gl/services`. Pass the resulting credential through
`core.credentials`:

```ts
import {load} from '@loaders.gl/core';
import {
  ArcGISFeatureServerSourceLoader,
  createArcGISCredential
} from '@loaders.gl/services';

const credentials = [
  createArcGISCredential({
    origins: ['https://services.example.com'],
    token: arcgisToken
  })
];

const source = await load(featureServerUrl, ArcGISFeatureServerSourceLoader, {
  core: {credentials}
});
const features = await source.getFeatures({layers: ['0']});
```

The exact same option works with `createDataSource` and with loaders that make nested requests.
Explicit credentials already present on a request URL or in its headers take precedence over a
configured credential.

## Static tokens and refreshing tokens

A string is appropriate for a token whose lifetime exceeds the source. For expiring credentials,
provide a callback that returns the current token and refreshes it when asked:

```ts
import {createBearerTokenCredential} from '@loaders.gl/loader-utils';

let currentToken = await acquireToken();

const credential = createBearerTokenCredential({
  id: 'private-tiles',
  origins: ['https://tiles.example.com'],
  token: async ({reason, response}) => {
    if (reason === 'refresh') {
      currentToken = await refreshToken({status: response?.status});
    }
    return currentToken;
  }
});
```

Callbacks receive `reason: 'request'` for normal authorization and `reason: 'refresh'` after an
accepted authentication failure. Refreshes for the same credential are deduplicated. loaders.gl
replays at most once, and only for an idempotent request with a reusable body. Static tokens are
never refreshed automatically.

## Provider presets

| Provider | Helper | Placement | Default origin | Notes |
| --- | --- | --- | --- | --- |
| ArcGIS REST | `createArcGISCredential` | `token` query parameter | None; required | Includes ArcGIS 498 and 499 refresh statuses |
| Mapbox | `createMapboxCredential` | `access_token` query parameter | `https://api.mapbox.com` | Suitable for TileJSON and child tile requests |
| Google Maps Platform | `createGoogleMapsCredential` | `key` query parameter | `https://tile.googleapis.com` | A server-returned 3D Tiles `session` parameter is preserved separately |
| Cesium ion REST API | `createCesiumIonCredential` | Bearer header | `https://api.cesium.com` | Authorizes ion discovery and endpoint bootstrap |

Every helper accepts an async token callback. `origins` replaces a helper's default allowlist when
the service is reached through a proxy or another provider host.

### Mapbox tiles

```ts
import {createDataSource} from '@loaders.gl/core';
import {MVTSourceLoader} from '@loaders.gl/mvt';
import {createMapboxCredential} from '@loaders.gl/services';

const source = createDataSource(tileJSONUrl, [MVTSourceLoader], {
  core: {
    credentials: [createMapboxCredential({accessToken: mapboxToken})]
  }
});
```

### Google 3D Tiles

```ts
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource} from '@loaders.gl/tiles';
import {createGoogleMapsCredential} from '@loaders.gl/services';

const source = new Tiles3DSource(
  {url: googleTilesetUrl, loader: Tiles3DLoader},
  {core: {credentials: [createGoogleMapsCredential({apiKey: googleApiKey})]}}
);
```

Google's API key authorizes the request. The `session` query parameter returned in tileset content
URLs is request state, not another application credential; `Tiles3DSource` preserves both values
without replacing an explicit child parameter.

### Cesium ion

```ts
import {load} from '@loaders.gl/core';
import {CesiumIonLoader} from '@loaders.gl/3d-tiles';

const tileset = await load('https://assets.cesium.com/123/tileset.json', CesiumIonLoader, {
  'cesium-ion': {accessToken: ionAccessToken, assetId: 123}
});
```

The Cesium ion loader uses the account token only with `api.cesium.com`, resolves the asset
endpoint, and installs the returned endpoint token only for that endpoint's exact origin. The
legacy `cesium-ion.accessToken` option remains the shortest Cesium-specific entry point;
`createCesiumIonCredential` is useful when the ion REST request shares a larger application
credential registry.

## deck.gl layers

Pass credentials inside the usual `loadOptions`. `SourceLayer`, `Tile3DSourceLayer`, and their
nested sources retain them for metadata, tiles, external tilesets, and other dependent resources:

```ts
const layer = new SourceLayer({
  id: 'secured-service',
  data: serviceUrl,
  loaders: SERVICE_LOADERS,
  loadOptions: {core: {credentials}}
});
```

For a source created before the layer, put `core.credentials` in the source's options instead.

## Security model

- Credentials are sent only when `URL.origin` exactly matches an allowlisted origin. Paths and
  wildcard subdomains are intentionally unsupported.
- Use separate credentials when APIs and asset hosts have different trust boundaries.
- Credential query parameters are redacted from `ServiceRuntime` telemetry and normalized request
  errors. Applications should apply the same policy to custom fetch logging.
- Prefer headers when the provider supports them: query parameters can appear in browser history,
  intermediary logs, and copied URLs.
- loaders.gl keeps tokens in memory only through the values and callbacks supplied by the
  application. It does not persist them.

## Cookies, proxies, and custom transports

Cookie-authenticated services still use standard fetch configuration:

```ts
const source = createDataSource(url, loaders, {
  core: {fetch: {credentials: 'include'}}
});
```

The server must permit the browser origin and credentials through CORS. For signed URLs, complex
request signing, service workers, or application gateways, provide `core.fetch`; the common
credential wrapper composes with that function. Avoid configuring both a custom signer and a
loaders.gl credential for the same field unless explicit request values are intended to win.

See the [request credential API](/docs/modules/loader-utils/api-reference/request-credentials) for
the generic constructors and callback contract.
