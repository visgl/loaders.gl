---
title: Tile converter build instructions
description: Build and run the tile converter directly from a repository branch when a published package is not sufficient.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tile converter / development"
  title="Run the converter from the source tree."
  description="Use these instructions when a repository branch contains a fix or capability that is not in the published package yet. The workflow builds the dependencies, installs the elevation model, and runs the converter against a chosen tileset."
  tone="blue"
  meta={['Repository build', 'Latest branch changes', 'Development workflow']}
  links={[
    {label: 'Tile converter module', to: '/docs/modules/tile-converter'},
    {label: 'CLI reference', to: '/docs/modules/tile-converter/cli-reference/tile-converter'},
    {label: 'Bundle script', to: '/docs/modules/tile-converter/api-reference/tile-converter-bundle'}
  ]}
/>

<DocOrientation
  eyebrow="Source-tree workflow"
  title="Build the exact converter version you need."
  description="A source build is useful for testing current branch changes or a local patch. Keep the conversion depth bounded when working with a large remote dataset, then validate the generated output with the I3S server or a viewer."
  tone="blue"
  items={[
    {label: 'Checkout', value: 'Clone the repository and select the branch to test.'},
    {label: 'Build', value: 'Install dependencies and build the required modules.'},
    {label: 'Prepare', value: 'Install or disable the Earth Gravity Model dependency.'},
    {label: 'Convert', value: 'Run a bounded conversion and inspect the generated dataset.'}
  ]}
/>

<ReferenceBoundary
  title="Build and run details"
  description="The detailed guide lists repository setup, build commands, elevation-model options, conversion examples, and local I3S serving steps."
  tone="blue"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Following steps are for running converter right on a repository branch. It might be helpful if latest changes from any repository branch are needed. E.g. if latest `master` branch has some important updates in `tile-converter` module or other module that `tile converter` module depends on, a user can run it. It doesn't need to wait for new release.

1. Using [yarn](https://yarnpkg.com/getting-started/install) instead of npm is recommended because it is general practice in vis.gl repos;

2. Clone the repository

```
git clone git@github.com:visgl/loaders.gl.git
cd loaders.gl
```

3. Build modules

```
yarn bootstrap
```

4. Install default Earth Gravity Model dependency:

```
npx tile-converter --install-dependencies
```

You can use custom Earth Gravity Model or disable it using `--egm` option.

5. [Convert some tileset](/docs/modules/tile-converter/cli-reference/tile-converter)
   Examples:

```
npx tile-converter --input-type 3dtiles --tileset ./modules/3d-tiles/test/data/Batched/BatchedTextured/tileset.json --name BatchedTextured
npx tile-converter --input-type 3dtiles --tileset https://assets.ion.cesium.com/29328/tileset.json --name CairoLayer --max-depth 10
```

Notice "--max-depth" option. It means that the converter will load and convert only first 'n' (10 in example) levels of tiles. Use it for big tilesets when full conversion could take a lot of time. If you want to convert all the tileset, omit this option.

6. I3S layers can be used only as http service. There is local server to handle i3s layer

After conversion there are new i3s layers in output (default: "data") directory. Run it with the local web server:

```
I3sLayerPath="./data/CairoLayer" DEBUG=i3s-server:* npx i3s-server
```

7. Show converted layer on a map.

```
open https://loaders.gl/examples/i3s?url=http://localhost/SceneServer/layers/0
```

### Advanced

A. To show converted layer in a locally built loaders.gl example.

Run the front-end application from examples

```
cd examples/website/i3s
yarn
MapboxAccessToken=<TOKEN> yarn start-local
```

B. To run a custom layer in a web-browser manually

```
http://localhost:8080/?url=http://localhost/layers/0
```
