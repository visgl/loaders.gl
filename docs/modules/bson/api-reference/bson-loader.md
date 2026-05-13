import {BsonDocsTabs} from '@site/src/components/docs/bson-docs-tabs';

# BSONLoader

<BsonDocsTabs active="bsonloader" />

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

`BSONLoader` loads BSON binary documents into JSON-like JavaScript objects.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {BSONLoader} from '@loaders.gl/bson';

const data = await load(url, BSONLoader, {bson: options});
```

## BSONLoader Options

`BSONLoader` currently passes `bson` options through to the underlying MongoDB `js-bson` parser. This pass-through behavior may change in future versions and should not be relied on for stable public API behavior.

## Attribution

This loader is a wrapper around MongoDB's [`js-bson`](https://github.com/mongodb/js-bson) module, which is under the Apache 2.0 license.
