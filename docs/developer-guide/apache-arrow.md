---
title: Apache Arrow
description: Use a typed, columnar table shape between loaders, applications, workers, and writers.
hide_title: true
page_style: designed
---

import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {ArrowJsStructureGraphic} from '@site/src/components/docs/arrow-js-structure-graphic';
import {CategoryDataConcept} from '@site/src/components/home/concepts';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<CapabilityHero capability="arrow" />

<CategoryDataConcept initialCategoryId="table" initialRepresentationId="arrow" />

<ArrowJsStructureGraphic />

<DocOrientation
  eyebrow="A common data plane"
  title="Use one typed table shape between formats."
  description="Arrow keeps columns typed and contiguous as data moves between loaders, workers, applications, and writers. It is useful when the next step should not care which file format came first."
  tone="cyan"
  items={[
    {label: 'Use it when', value: 'Several formats feed the same table processing path'},
    {label: 'Core representation', value: 'Typed columns, record batches, and tables'},
    {label: 'Useful properties', value: 'Binary layout, zero-copy views, and shared schemas'},
    {label: 'Packages', value: '@loaders.gl/arrow, @loaders.gl/geoarrow, and @loaders.gl/parquet'}
  ]}
/>

## Start here

Apache Arrow gives different tabular formats a shared, typed columnar shape. Use it when you want
efficient transfer or the same processing code across formats; loaders that return other shapes do
not require it.

loaders.gl uses Apache Arrow as a standard in-memory representation of tables.

loaders.gl provides an `ArrowLoader` and an `ArrowWriter` that load and write Arrow files.

An increasing subset of tabular loaders can parse various formats directly into in-memory Arrow tables, and writers can write in-memory Arrow tables to those formats.

<ReferenceBoundary
  title="The representation details"
  description="The sections below cover the Arrow JS dependency, supported versions, installation, and compatibility troubleshooting."
  tone="cyan"
/>

## Apache Arrow JS library

To work effectively with in-memory Apache Arrow data, a library is needed, and loaders.gl integrates with the official Apache Arrow JS `apache-arrow` package.

A subset of modules that import the Apache Arrow JS library:

- `@loaders.gl/arrow`
- `@loaders.gl/geoarrow`
- `@loaders.gl/parquet`
- `@loaders.gl/schema`
- `@loaders.gl/schema-utils`

### Apache Arrow JS versions

Currently, all loaders.gl modules that use Apache Arrow are designed to work with:

- `apache-arrow: ">= 17.0.0"`

These semver specifications are designed to deduplicate: if the application specifies an `apache-arrow` version that satisfies the version condition, all the loaders.gl modules should be linked with that library. This allows applications to control which Arrow version they want to have installed by adding a specific version to their own package.json `dependencies` section.

Note that future loaders.gl versions may drop support for older versions if compatibility issues require it.

With a clean install (`rm -rf node_modules package-lock.json yarn.lock` and reinstall), the latest version of `apache-arrow` is automatically installed.

You may still want to specify `apache-arrow` explicitly in your app to avoid being pinned down by lock files etc.

### Recommended install pattern

```bash
npm install apache-arrow @loaders.gl/core @loaders.gl/arrow
# plus any other loaders you use
```

or:

```bash
yarn add apache-arrow @loaders.gl/core @loaders.gl/arrow
```

### Troubleshooting

If you suspect version conflicts or duplicate apache-arrow versions in your application:

- Add `apache-arrow` as an explicitly top-level dependency in your app
- Try a clean reinstall after lockfile cleanup
- Align dependent packages to the same major/minor family of Arrow where possible

Most package managers have a way to check a dependency:

```bash
$ yarn why apache-arrow
├─ @loaders.gl/arrow@workspace:modules/arrow [c7e01]
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/arrow@workspace:modules/arrow
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/geoarrow@workspace:modules/geoarrow [49c26]
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/geoarrow@workspace:modules/geoarrow [eeaaa]
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/geoarrow@workspace:modules/geoarrow
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/schema-utils@workspace:modules/schema-utils [3820d]
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/schema-utils@workspace:modules/schema-utils [b9e22]
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
├─ @loaders.gl/schema-utils@workspace:modules/schema-utils
│  └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
│
└─ @loaders.gl/schema@workspace:modules/schema
   └─ apache-arrow@npm:21.1.0 (via npm:^21.0.0)
```
