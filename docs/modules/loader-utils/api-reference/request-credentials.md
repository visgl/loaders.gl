---
title: Request credentials
description: Attach scoped query or header credentials to matching service requests without leaking tokens across origins.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Loader utilities / transport security"
  title="Attach credentials only where the request needs them."
  description="The credential helpers provide origin-scoped query and bearer-header policies for service sources. They keep token attachment, refresh decisions, and request context separate from format parsing."
  tone="pink"
  meta={['Origin scoping', 'Query and bearer tokens', 'Refresh callbacks']}
  links={[
    {label: 'Loader utilities', to: '/docs/modules/loader-utils'},
    {label: 'Authentication guide', to: '/docs/developer-guide/authentication'},
    {label: 'Service sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="Credential boundary"
  title="Make the destination part of the policy."
  description="A credential should know which origins may receive it and when a failed request is allowed to refresh. The helpers expose those decisions as data and callbacks instead of scattering token logic across source implementations."
  tone="pink"
  items={[
    {label: 'Scope', value: 'Allow exact HTTP(S) origins to receive a credential.'},
    {label: 'Attach', value: 'Use a query parameter or Authorization-style header.'},
    {label: 'Refresh', value: 'Replay once only for configured response statuses.'},
    {label: 'Inspect', value: 'Receive redacted request context in the token provider.'}
  ]}
/>

<ReferenceBoundary
  title="Request credential reference"
  description="The detailed reference covers query credentials, bearer credentials, token providers, refresh statuses, and origin matching."
  tone="pink"
/>

`@loaders.gl/loader-utils` exposes transport-level building blocks for scoped query and header
credentials. Most application code should use the provider presets in `@loaders.gl/arcgis/authentication` or `@loaders.gl/services` and
pass the result as [`core.credentials`](/docs/developer-guide/authentication).

## `createQueryParameterCredential(options)`

Creates a `RequestCredential` that adds a query parameter to requests matching an exact origin.

| Option | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable, non-secret diagnostic name |
| `origins` | `string[]` | Exact HTTP(S) origins allowed to receive the token |
| `parameterName` | `string` | Query parameter receiving the token |
| `token` | `string \| TokenProvider` | Static token or application callback |
| `refreshStatusCodes` | `number[]` | Statuses allowing one refresh and replay; defaults to 401 and 403 |

## `createBearerTokenCredential(options)`

Creates a header credential. The default header is `Authorization` and the default prefix is
`Bearer `; `headerName` and `prefix` can customize both.

## `TokenProvider`

```ts
type TokenProvider = (context: {
  url: string;
  reason: 'request' | 'refresh';
  response?: {status: number; headers: Headers};
}) => string | null | Promise<string | null>;
```

The URL is supplied before the credential is attached. The refresh response intentionally exposes
only status and headers. Returning `null` skips the credential or declines a replay.

## `createAuthenticatedFetch(options)`

Wraps a `FetchLike` implementation. Matching credentials compose, explicit URL parameters and
headers win, abort signals are preserved, concurrent refreshes are deduplicated, and at most one
safe replay is attempted.

`credentials` accepts instantiated token/callback credentials and declarative entries.
`authentications` supplies constructors with a static `type`; `fetchOptions` supplies request
defaults to merge before signing. Request callbacks run after ordinary token placement.

## Authentication classes and resolution

`AuthenticationConstructor` has a static `type: string` and constructs an `Authentication` from
one `CredentialOptions` entry. `Authentication` is either the existing `RequestCredential` or
`RequestAuthentication`. `CredentialOptions` contains `type` plus provider-specific fields.

`TokenAuthentication` adapts an existing `RequestCredential` into a class instance. The built-in
`BearerTokenAuthentication` and `QueryParameterAuthentication` classes accept the corresponding
factory options, with static types `bearer-token` and `query-parameter` respectively.

`resolveCredentials(credentials, authentications)` preserves existing instances and resolves
typed declarations using the first registered matching constructor. It throws for unknown types
and invalid results. `resolveAuthenticationOptions(options)` returns options with resolved
credentials without modifying input. `resolveLoaderAuthenticationOptions(loader, url, options)`
also collects constructors from the optional `loader.getAuthentications(url, options)` hook;
application classes precede loader classes. Already-resolved credentials need no discovery.

## `RequestAuthentication`

Callback credentials have `id`, `type: 'request'`, `origins`, `authenticate`, and optional
`refreshStatusCodes` (default: no retries). Exact scopes may include custom-scheme authorities,
such as `s3://bucket`, as well as HTTP(S) origins.

`authenticate({url, options, reason, response?})` returns `{url, options}` or a promise for that
value. `options` is the complete `RequestInit`; `reason` is `request` or `retry`; `response`
exposes only failure status and headers. Return complete request options. The original abort
signal is preserved. Callback credentials may also be class instances created from JSON.

See [application request signing](/docs/developer-guide/authentication#application-request-signing)
for an SDK-independent example and the worker execution constraints.

## `redactCredentialURL(url, credentials)`

Replaces configured credential query values with `[REDACTED]` for diagnostics. Header credentials
do not affect URLs. This utility does not sanitize arbitrary secrets unknown to the supplied
credential registry.

When callback credentials are present, all query values are redacted, including on rewritten
destinations, because a signer may introduce arbitrary signature parameter names.
