---
title: Working with AI Coding Agents
description: Find current loaders.gl documentation and verify parser, worker, and streaming behavior with AI coding agents.
---

# Working with AI Coding Agents

Start with [llms.txt](https://loaders.gl/llms.txt) to discover the current documentation.
Fetch only the Markdown pages relevant to the task. The index links to rendered
Markdown siblings of the documentation pages, including content from MDX components.
It excludes standalone examples and legacy guides; no full-site `llms-full.txt` is generated.

## Start from local truth

Inspect the application's package manager, lockfile, installed `@loaders.gl/*`
versions, package exports and TypeScript declarations before choosing APIs.
The website describes current development; applications on earlier releases should
use documentation and exports matching their installed version.

Choose a loader for the input format and an output shape the application can consume.
Check namespaced options and result types in that module's documentation. Do not
assume every loader returns rows or that every format supports streaming.

## Install the loaders.gl skill

```bash
npx skills add visgl/loaders.gl --skill loadersgl
```

The [repository skill](https://github.com/visgl/loaders.gl/tree/master/skills/loadersgl)
provides focused guidance for package boundaries, metadata and parser imports,
worker deployment, streaming, geospatial output, and repository contribution.
Installing it does not replace the application's instructions or authorize publishing.

## Verify the path the application uses

For asynchronous loading, metadata loaders can preload parser implementations.
Synchronous parsing requires a parser-bearing loader; inspect the installed package's
explicit subpath exports instead of guessing an import from an old example.
See [unbundled loaders](./using-unbundled-loaders.md).

For worker loading, inspect the actual worker request, response content type, version,
and deployment URL. An HTML fallback returned for a worker URL is a deployment error.
See [worker loaders](./using-worker-loaders.md).

For streaming, consume the async iterator and verify batches, completion and errors
with a small deterministic input. See [streaming loaders](./using-streaming-loaders.md).
Test browser behavior in Chromium and Node-specific behavior in Node. A typecheck
alone does not verify worker startup, WASM fetching, or parsed output.

## Contributing to loaders.gl

Read `AGENTS.md` before editing. Preserve the metadata/parser split and module
ownership boundaries. Add focused native Vitest coverage for behavior changes,
keep fast tests hermetic, and run the repository's documented build, formatting,
Node and headless browser checks. Build workers after the final module build.
The website build validates the generated index and Markdown links automatically.
