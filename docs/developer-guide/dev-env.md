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

The **master** branch is the active development branch.

Building loaders.gl locally from the source requires node.js `>=10`.
We use [yarn classic](https://yarnpkg.com/en/docs/install) to manage the dependencies.

```bash
git checkout master
yarn
yarn bootstrap
```

## Running Tests

- `yarn bootstrap`: Install and build workers etc. Run every time you pull a new branch.
- `yarn lint`: Check coding standards and Biome formatting
- `yarn lint fix`: Fix Biome lint and formatting errors
- `yarn test node`: Quick test run under Node.js
- `yarn test browser`: Test run under browser, good for interactive debugging
- `yarn test`: List available test modes
- `yarn test full`: Run node tests and browser tests in headless mode

## Environment Setup

Note that our primary development environment is MacOS, but it is also possible to build loaders.gl on Linux and Windows.

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

### Develop on Windows

It is possible to build loaders.gl on Windows 10, but not directly in the Windows command prompt. You will need to install a Linux command line environment.

First, install [WSL (Windows Subsystem for Linux)](https://docs.microsoft.com/en-us/windows/wsl/install-win10) on Windows 10, and follow the [Linux](#develop-on-linux) directions.

Note that you may also need to make some decisions on where to place your code and whether to link the linux subsystem to your windows drives.

Once this is done, follow the instructions for developing on Linux.

### Develop on Linux

On Linux systems, the following packages are necessary for running webgl-based headless render tests.

- mesa-utils
- xvfb
- libgl1-mesa-dri
- libglapi-mesa
- libosmesa6
- libxi-dev

To get the headless tests working: `export DISPLAY=:99.0; sh -e /etc/init.d/xvfb start`

## Appendix: Installing JavaScript Development Tools

You will of course need to install the basic JavaScript development tools. Unless you are new to JavaScript development you most likely already have these in place. The following should work on a linux system.

### Install Node and NPM using NVM (recommended)

- `https://www.liquidweb.com/kb/how-to-install-nvm-node-version-manager-for-node-js-on-ubuntu-12-04-lts/`
- `https://github.com/nvm-sh/nvm#install--update-script`
- `https://github.com/nvm-sh/nvm/releases`

```bash
nvm install 16
nvm use 16
```

(Node 16 is currently recommeded for building and development of loaders 3.3. NPM comes with the NodeJS in this case)

#### Optional: Install Node and NPM manually

```bash
sudo apt update
sudo apt install nodejs
sudo apt install npm
```

### Install yarn

https://www.hostinger.com/tutorials/how-to-install-yarn-on-ubuntu/
(yarn version needed is 1.22.19 or the latest stable 1.xx.xx)

```bash
sudo apt update
sudo apt install yarn nodejs
yarn –version
```

### Install jq

```bash
sudo apt-get install jq
```

### Install build-essential package

This step might be required for some systems that do not have required packages pre-installed.

```bash
sudo apt-get install build-essential
```
