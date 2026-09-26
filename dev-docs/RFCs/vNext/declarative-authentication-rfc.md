# Declarative authentication and application request signing

## Goals

Allow JSON configuration to instantiate authentication classes supplied by an application,
loader, or service. Support request-specific signing and URL rewriting through application
callbacks, including the private tiled S3 use case in [#2914](https://github.com/visgl/loaders.gl/issues/2914),
without adding AWS SDK or S3 dependencies to loaders.gl.

## Public options

```ts
import {MapboxAuthentication} from '@loaders.gl/services';

const options = {
  core: {
    authentications: [MapboxAuthentication],
    credentials: [{type: 'mapbox', accessToken: 'application-token'}]
  }
};
```

`core.authentications` is a list of constructors, each with a stable static `type`.
`core.credentials` accepts both existing runtime credentials and typed configuration objects.
Core constructs `new AuthenticationClass(credentialConfiguration)` for each declaration.
The constructor receives that entry, not the entire loader-options object.
Instances implement either the existing token credential structure or the callback credential
structure below. There is no additional `getCredentials()` method.

Classes are JavaScript dependencies injected by the application. Credential declarations can
come from JSON; JSON never names a module to import or executes code. Existing token callbacks,
credential factory helpers, and explicitly constructed instances remain supported.

## Loader and service discovery

An optional `getAuthentications(url, options)` hook returns an array of constructors or a promise
for that array. Core consults the selected loader before resolving declarations. Application
constructors precede contributed constructors; the first matching static `type` wins. Credential
order remains the order in `core.credentials` and multiple configurations can instantiate the
same class. Unknown types, invalid constructor results, and constructor failures reject the load
before its data request; diagnostics identify the entry index without printing configuration.

The hook is on loader metadata, or on its resolved implementation in the asynchronous load and parse APIs. It is
discovery only and should not make credentialed data requests. `preload()` keeps its existing
implementation-resolution contract. Synchronous `createDataSource()` accepts synchronous hooks;
applications use `load()` when discovery is asynchronous. Direct source constructors require
application-provided classes in options because no loader discovery runs there.

Resolved options carry credential instances to the parser, sources and child requests. The
application's configuration objects are not modified. Instances are created once per load and
reused within that load; supplying an existing instance explicitly permits sharing across loads.
Nested authenticated transports also reuse instances for the same declaration objects, including
when a new array contains those objects. Declarations are treated as immutable within that transport
pipeline; use new configuration objects for changed credentials. Independent transports resolve
their own instances.

## Request signing callbacks

```ts
type RequestAuthentication = {
  id: string;
  type: 'request';
  origins: readonly string[];
  authenticate(request: {
    url: string;
    options: RequestInit;
    reason: 'request' | 'retry';
    response?: {status: number; headers: Headers};
  }): {url: string; options: RequestInit} |
      Promise<{url: string; options: RequestInit}>;
  refreshStatusCodes?: readonly number[];
};
```

Applications may provide a callback credential directly in `core.credentials`, or register a
class whose instances implement this structure and whose constructor reads declarative options.
`core.authentications` continues to contain classes rather than changing into a callback list.

The pipeline merges request defaults and per-request headers, applies ordinary token credentials,
then runs matching callbacks in list order immediately before the transport. Callbacks see the
method, body, range headers, signal and URL for the actual request. Each callback returns the full
request, and the caller's abort signal is retained. Callback scopes use exact HTTP origins or
custom-scheme authorities such as `s3://bucket`; matching never treats all opaque origins as equal.

Each tile is signed separately. Retries start from the original unsigned request and call the
signer again. Signer retries are opt-in through `refreshStatusCodes`, are limited to one replay,
and use the existing replayable-method/body restrictions. Signatures are never cached or shared
between requests. The application owns provider credential refresh and any concurrent refresh
deduplication. Existing token-provider refresh deduplication is preserved.

An application signer can resolve `s3://` URLs, use an externally installed AWS SDK, or call a
backend that returns presigned URLs. It should scope both custom and HTTPS origins when child
URLs may use either. loaders.gl does not resolve AWS regions, discover AWS credentials, implement
SigV4, or guarantee S3 compatibility without the application's adapter. Custom fetch transports
must preserve signed URL/header fields when sending the request. SDK errors must be redacted by
the application callback; loaders.gl does not know provider-specific secret formats.

## Workers and compatibility

Static token credentials can be serialized after resolution; constructor registries are removed
from worker options. Parsing with request callbacks or token-provider functions stays on the
calling thread so nested requests cannot silently lose authentication. Worker RPC for arbitrary
authentication callbacks is outside this change.

The existing query/header token precedence rules continue to apply. Signing callbacks are trusted
application code and own their header/URL changes, including handling already signed input URLs.
Diagnostic URL redaction removes all query values when callback credentials are present because
signers can use arbitrary parameter names and rewrite the destination.

## Validation

Hermetic Chromium tests cover constructor resolution and precedence, existing credential identity,
unknown types, scoped custom URLs, signing after request-default merging, cancellation, replay,
double-wrapping, public load/parse/batch/source propagation and worker fallback. Service preset
tests compare class instances with the existing factory results. No AWS service is contacted.
