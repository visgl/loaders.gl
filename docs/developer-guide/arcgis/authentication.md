---
title: Authenticate with ArcGIS
description: Choose an ArcGIS credential and carry it through metadata, data and tile requests.
---

# Authenticate with ArcGIS

Your application obtains and refreshes tokens. loaders.gl applies them to requests for explicitly
trusted origins. It does not implement sign-in screens, OAuth redirects, password handling, or
persistent credential storage.

## Choose an authentication approach

| Scenario | Approach | Supply to loaders.gl | Important boundary |
| --- | --- | --- | --- |
| Publicly shared service | Anonymous | No credential | Related resources may have different access rules |
| Public application accessing permitted resources | API key, where supported by the service and account | Key as an ArcGIS token | Configure privileges and restrictions; a browser key is visible to users |
| User accessing organization content | OAuth user authentication, normally authorization code with PKCE | Token callback from the application's session library | The user's privileges and item sharing still apply |
| Backend application | App authentication where applicable | Backend-managed short-lived token | Keep client secrets on the backend |
| ArcGIS Enterprise / federation | Organization-specific session or token flow | Token scoped to the target server, or custom transport | Portal and service hosts may differ; one token is not necessarily valid everywhere |
| Existing proxy or cookie session | Application gateway / fetch configuration | Custom `core.fetch` or fetch options | Browser CORS and cookie policy still apply |

Use Esri's [authentication comparison](https://developers.arcgis.com/documentation/security-and-authentication/types-of-authentication/)
and [user authentication flows](https://developers.arcgis.com/documentation/security-and-authentication/user-authentication/flows/)
for current account, service and OAuth requirements. An API key is not a substitute for user access
to sensitive organizational content.

## Static token or API key

```ts
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';
import {createArcGISCredential} from '@loaders.gl/arcgis/authentication';

const source = await load(serviceUrl, ArcGISFeatureServerSourceLoader, {
  core: {
    credentials: [createArcGISCredential({
      origins: ['https://services.example.com'],
      token: accessToken
    })]
  }
});
```

Replace the example origin with the exact trusted service origin, including any non-default port.
The preset adds the `token` query parameter. It does not authorize wildcard subdomains. Add a
separate explicitly trusted origin if a scene or tile service references an authorized asset host.
Do not add arbitrary hosts returned by untrusted metadata.

The descriptors also register `ArcGISAuthentication`, so declarative credentials work with async
`load()` and `SourceLayer`:

```ts
const source = await load(serviceUrl, ArcGISFeatureServerSourceLoader, {
  core: {credentials: [{type: 'arcgis', origins: ['https://services.example.com'], token: accessToken}]}
});
```

## Refresh an application session

Connect your session manager to a callback. `getAccessToken` and `renewSession` below are application
functions, not loaders.gl APIs; implement them with your chosen OAuth/identity library.

```ts
const credential = createArcGISCredential({
  origins: ['https://services.example.com'],
  token: async ({reason}) => {
    if (reason === 'refresh') await renewSession();
    return await getAccessToken();
  }
});

const source = await load(serviceUrl, ArcGISFeatureServerSourceLoader, {
  core: {credentials: [credential]}
});
```

The shared transport deduplicates concurrent refreshes for the same credential and permits at most
one replay for an eligible request. The ArcGIS preset recognizes HTTP 401, 403, 498 and 499. Static
tokens cannot renew themselves. A permission failure can remain a permission failure after renewal.

**Current limitation:** an ArcGIS error inside an HTTP 200 JSON response does not trigger this
HTTP-status refresh path. Applications needing that behavior should use their existing ArcGIS
transport/session integration. See [troubleshooting](/docs/developer-guide/arcgis/troubleshooting).

Explicit URL tokens and request headers take precedence. Remove an expired token embedded in the
input URL if you expect a token callback to control authorization. Avoid placing tokens in shared
URLs, screenshots, application logs or source files.

## Use an existing Enterprise transport

```ts
const source = await load(serviceUrl, ArcGISFeatureServerSourceLoader, {
  core: {fetch: enterpriseFetch}
});
```

`enterpriseFetch` is your fetch-compatible function, including any federation or proxy logic. It
must return standard `Response` objects. Cookie-based access can use
`core: {fetch: {credentials: 'include'}}`; the server must permit credentialed CORS requests from
your application's origin. Client configuration cannot override server CORS policy.

## Discovery and scene resources

Discovery currently takes an explicit fetch function. Wrap it with the shared credential transport:

```ts
import {createAuthenticatedFetch} from '@loaders.gl/loader-utils';
import {discoverArcGISCapabilities} from '@loaders.gl/arcgis/discovery';

const authenticatedFetch = createAuthenticatedFetch({credentials: [credential]});
const graph = await discoverArcGISCapabilities(directoryUrl, {fetch: authenticatedFetch});
```

For `SourceLayer`, pass credentials in `sourceOptions.core.credentials`. For direct SceneServer
construction, pass credentials in `core.credentials`; consult the
[SceneServer reference](/docs/modules/arcgis/arcgis-scene-server). Follow-up resources still require
matching origins. Token propagation does not prove that a given credential is authorized for every
referenced resource.
