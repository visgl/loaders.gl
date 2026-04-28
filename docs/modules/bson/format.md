import {BsonDocsTabs} from '@site/src/components/docs/bson-docs-tabs';

# BSON Format

<BsonDocsTabs active="format" />

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/bson/api-reference/bson-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>BSONLoader</strong>
    <span>Loads BSON binary documents into JSON-like JavaScript objects.</span>
    <span className="docs-api-card__meta">Output: Record&lt;string, unknown&gt;</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/bson/api-reference/bson-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>BSONWriter</strong>
    <span>Writes JSON-like JavaScript objects as BSON binary documents.</span>
    <span className="docs-api-card__meta">Input: Record&lt;string, unknown&gt;</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync</span>
  </a>
</div>

| Characteristic | Value                                          |
| -------------- | ---------------------------------------------- |
| File Format    | [BSON](https://bsonspec.org/)                  |
| Data Format    | [Unstructured/JSON](/docs/specifications/category-json) |
| File Type      | Binary                                         |
| File Extension | `.bson`                                        |
| MIME Types     | `application/bson`                             |
