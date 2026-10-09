---
title: Development environment
description: Build, test, and debug loaders.gl locally across supported operating systems.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Working on loaders.gl"
  title="A predictable path from checkout to test."
  description="The repository uses a small set of repeatable install, build, lint, and test commands. The same workflow keeps browser workers, generated bundles, and package dependencies in sync."
  tone="cyan"
  meta={['Yarn workspace', 'Browser and Node.js', 'Headless tests']}
  links={[
    {label: 'Get started', to: '/docs/developer-guide/get-started'},
    {label: 'Node.js support', to: '/docs/developer-guide/node'}
  ]}
/>

<DocOrientation
  eyebrow="The local workflow"
  title="Install. Build. Test. Inspect."
  description="Build the packages before running worker-dependent tests, keep formatting automatic, and use the browser test lane for browser-capable behavior."
  tone="cyan"
  items={[
    {label: 'Install', value: 'Resolve the workspace with Yarn'},
    {label: 'Build', value: 'Generate package and worker bundles'},
    {label: 'Verify', value: 'Run lint, Node, and Chromium tests'},
    {label: 'Debug', value: 'Use the main-thread path when useful'}
  ]}
/>

## Setup

`master` is the active development branch. Use a Node.js version supported by the root
`package.json`: `^22.13.0`, `^24.0.0`, or `^26.0.0`. The repository pins Yarn 4.17.1
in its `packageManager` field; use that version rather than Yarn Classic.

```bash
git checkout master
yarn install
yarn build
yarn build-workers
yarn playwright:install
```

`yarn build` cleans package `dist` directories. Run `yarn build-workers` after the
final module build so browser tests can load worker scripts.

## Build and test

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `yarn build` | Build modules and check TypeScript types. |
| `yarn build-workers` | Generate browser and Node.js worker bundles. |
| `yarn lint` | Check lint and formatting. |
| `yarn lint fix` | Apply lint and formatting fixes. |
| `yarn test-node` | Run the Node.js compatibility tests. |
| `yarn test-headless` | Run browser tests in headless Chromium. |
| `yarn test-browser` | Run browser tests with a visible browser. |
| `yarn test` | Run the Node.js and headless Chromium suites. |
| `yarn test-slow` | Run expensive hermetic tests. |
| `yarn test-external` | Run tests that access external services. |
| `yarn test-audit` | Audit test structure and fixtures. |
| `yarn test-website` | Install website dependencies and build the documentation site. |

Run `yarn install` after dependency changes. Before submitting a PR, run the build,
worker build, Node.js tests, headless tests, and `yarn lint fix`. For documentation
changes, also build the website. See the [test workflow](https://github.com/visgl/loaders.gl/blob/master/dev-docs/ci-testing.md)
for test lanes, coverage, and profiling.

## Platform setup

Development is supported on macOS and Linux. On Windows, use a Linux environment
such as WSL and follow the Linux setup below.

On Linux, install Chromium and its system dependencies before running browser tests:

```bash
yarn exec playwright install --with-deps chromium
```

Installing system dependencies may require administrator privileges. Headless
Chromium does not require the old Xvfb-based test setup.

### Website development workers

The website development server can run the Parquet source worker directly from
`modules/parquet/src/workers/parquet-source-worker.ts`. You do not need to run
`yarn build-workers` before `cd website && yarn start`; the website-only
development webpack configuration supplies a module-worker URL for that source
file and watches it for changes. Editing the worker invalidates the development
worker farm, so active jobs fail and the next request starts a fresh worker.

This is intentionally a website development convenience, not a published
package feature. Production and staging still use the generated
`dist/parquet-source-worker.js` asset, and an explicit `parquet.workerUrl` always
overrides the built-in target. The source-worker replacement is not enabled for
server-side rendering, Node.js, or package builds.
