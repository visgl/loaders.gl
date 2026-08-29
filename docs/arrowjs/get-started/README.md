---
title: Get started with Arrow JavaScript
description: Install Apache Arrow JS and make your first typed table in a browser or Node.js project.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript · getting started"
  title="Install the table model, then start with one column."
  description="Apache Arrow JS is the JavaScript binding for Arrow’s typed columnar format. Add the package, import the table primitives, and follow the linked guides when you need IPC, schemas, builders, or loaders.gl integration."
  tone="cyan"
  meta={['npm install', 'Browser and Node.js', 'Typed tables']}
  links={[
    {label: 'Arrow JS introduction', to: '/docs/arrowjs/developer-guide/introduction'},
    {label: 'Examples', to: '/docs/arrowjs/get-started/examples'},
    {label: 'Arrow in loaders.gl', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="The first five minutes"
  title="Install, import, inspect."
  description="The smallest useful Arrow program is short: install the package, import a table class, then move on to the representation that matches your application."
  tone="cyan"
  items={[
    {label: 'Install', value: 'Add apache-arrow to the project'},
    {label: 'Import', value: 'Use Arrow table and vector primitives'},
    {label: 'Inspect', value: 'Read schema, columns, and row counts'},
    {label: 'Continue', value: 'Choose examples, builders, or IPC I/O'}
  ]}
/>

<ReferenceBoundary
  title="Getting started details"
  description="The commands and imports below are intentionally minimal; the linked guides provide the next step for real data pipelines."
  tone="cyan"
/>

# Get Started

## Installing Arrow JS

The Apache Arrow JS bindings are published as an npm module.

```shell
npm install apache-arrow
# or
yarn add apache-arrow
```

## Importing Arrow JS

You should now be able to import arrow into your projects

```typescript
import {Table} from 'apache-arrow';
```
