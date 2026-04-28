import {BsonDocsTabs} from '@site/src/components/docs/bson-docs-tabs';

# BSONWriter

<BsonDocsTabs active="bsonwriter" />

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-v3.4" />
</p>

`BSONWriter` writes JSON-like JavaScript objects as BSON binary documents.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import {BSONWriter} from '@loaders.gl/bson';

const arrayBuffer = await encode(data, BSONWriter);
```

## BSONWriter Options

`BSONWriter` currently passes `bson` options through to the underlying MongoDB `js-bson` serializer. This pass-through behavior may change in future versions and should not be relied on for stable public API behavior.

## Attribution

This writer is a wrapper around MongoDB's [`js-bson`](https://github.com/mongodb/js-bson) module, which is under the Apache 2.0 license.
