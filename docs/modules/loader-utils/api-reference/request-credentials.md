# Request credentials

`@loaders.gl/loader-utils` exposes transport-level building blocks for scoped query and header
credentials. Most application code should use the provider presets in `@loaders.gl/services` and
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

## `redactCredentialURL(url, credentials)`

Replaces configured credential query values with `[REDACTED]` for diagnostics. Header credentials
do not affect URLs. This utility does not sanitize arbitrary secrets unknown to the supplied
credential registry.
