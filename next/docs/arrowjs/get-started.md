Arrow JavaScript · getting started

# Install the table model, then start with one column.

Apache Arrow JS is the JavaScript binding for Arrow’s typed columnar format. Add the package, import the table primitives, and follow the linked guides when you need IPC, schemas, builders, or loaders.gl integration.

[Arrow JS introduction](https://loaders.gl/next/docs/arrowjs/developer-guide/introduction.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/developer-guide/introduction.md)[Examples](https://loaders.gl/next/docs/arrowjs/get-started/examples.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/get-started/examples.md)[Arrow in loaders.gl](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The first five minutes

## Install, import, inspect.

The smallest useful Arrow program is short: install the package, import a table class, then move on to the representation that matches your application.

01

Install

Add apache-arrow to the project

02

Import

Use Arrow table and vector primitives

03

Inspect

Read schema, columns, and row counts

04

Continue

Choose examples, builders, or IPC I/O

Detailed guide

## Getting started details

The commands and imports below are intentionally minimal; the linked guides provide the next step for real data pipelines.

# Get Started

## Installing Arrow JS[​](#installing-arrow-js "Direct link to Installing Arrow JS")

The Apache Arrow JS bindings are published as an npm module.

```
npm install apache-arrow

# or

yarn add apache-arrow
```

## Importing Arrow JS[​](#importing-arrow-js "Direct link to Importing Arrow JS")

You should now be able to import arrow into your projects

```
import {Table} from 'apache-arrow';
```
