# Security

loaders.gl reads, parses and writes data from local files, remote services and archives. These operations cross trust boundaries: an attacker may control a URL, a response, file contents or the code that processes them. The protections an application needs depend on its loaders, runtime and deployment; loaders.gl is not a security sandbox for untrusted data.

## Reporting a vulnerability

Report suspected vulnerabilities privately through [GitHub security advisories](https://github.com/visgl/loaders.gl/security/advisories/new), rather than opening a public issue. See the [security policy](https://github.com/visgl/loaders.gl/blob/master/.github/SECURITY.md) for supported versions and disclosure timing.

## Loading data and external resources

A URL or file reference can lead to unexpected network requests or access to local files. Some formats reference additional assets, and a loader may follow those references. In server-side applications, attacker-controlled URLs can also reach internal services or other destinations the application can access.

- Restrict permitted schemes, hosts, ports and local paths, including those reached through redirects and referenced assets. Enforce the same policy at the network or filesystem boundary; validating only the original URL is insufficient.
- Keep credentials scoped to the intended service. Avoid forwarding authorization headers to unrelated origins or logging tokens and signed URLs. See [authentication](developer-guide/authentication.md).
- Set application-appropriate limits on response bytes, request count, concurrency and time. Do not rely solely on a declared content length.
- Browser same-origin rules, CORS and content security policy can help constrain requests, but they do not replace server-side access controls.

## Parsing and resource exhaustion

A malformed or deliberately complex file can consume excessive CPU or memory, trigger parser errors, or exploit a defect in a decoder. File extensions and media types are not proof that data is safe. Validate inputs against the formats and sizes your application expects, handle parsing errors, and budget for decoded geometry, images and tables as well as their input bytes.

For hostile inputs, use process or container isolation and enforce memory and execution-time limits outside the parser. Web Workers can keep work off the UI thread, but a worker alone is not a security boundary or a guarantee of bounded memory. Render or display parsed content as data: apply the appropriate escaping and sanitization before inserting untrusted text or markup into a page.

## Decompression and archives

Compressed data can expand dramatically, and nested archives or large numbers of entries can amplify CPU, memory and storage use. A small compressed input is not evidence that its decoded output is small. Apply limits to compressed and expanded bytes, aggregate output across entries and nested archives, nesting depth, entry count and processing time. If writing archive entries to disk, validate normalized paths and reject traversal and unsafe links.

The [compress-utils untrusted input guidance](https://github.com/dupontcyborg/compress-utils#untrusted-input) explains output, decoder-memory and streaming limits. Its [JavaScript documentation](https://github.com/dupontcyborg/compress-utils/blob/main/bindings/wasm/README.md#errors-and-limits) distinguishes one-shot limits from stream limits. Those protections apply to the specific compress-utils APIs and versions being used; loaders.gl can use other codecs and does not guarantee a universal decompression limit. Confirm that the limits are actually exposed and enforced on your chosen path, and use application or process-level limits where they are not.

## Dependencies and the software supply chain

Dependencies have become a major attack vector: a compromised direct or transitive package, build tool or account can affect applications that never chose it explicitly. loaders.gl is actively working to minimize dependencies, especially transitive dependencies, while retaining the functionality each module needs. Choose only the modules and optional backends your application requires, review dependency changes and advisories, keep supported versions updated, and use a lockfile and your own dependency scanning and software bill of materials.

A [dependency inventory](developer-guide/dependency-inventory.md) records the direct and transitive package counts for the current development installation and explains its scope and gaps. Published packages, optional peers, development tooling, vendored code, and dependencies loaded at runtime have different exposure; no single package count captures all of them.

## Workers, code and publishing

Workers and dynamically loaded modules are executable code. Depending on configuration, a worker may be bundled locally, supplied through a `workerUrl`, or loaded from a published CDN bundle. Host or pin worker assets from sources you trust, control their URLs and apply an appropriate content security policy. See [worker loading and URL precedence](developer-guide/using-worker-loaders.md#module-and-classic-workers).

For consumers, obtain packages from trusted registries, review lockfile changes and protect credentials used by builds and deployments. For maintainers, protect repository and registry publishing access, review release changes and keep build dependencies current. The repository's [release workflow](https://github.com/visgl/loaders.gl/blob/master/.github/workflows/release.yml) runs tests, builds packages and worker bundles, and publishes to npm; review the workflow and npm configuration for the current release mechanism rather than assuming every artifact has a particular provenance guarantee.
