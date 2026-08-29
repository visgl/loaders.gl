---
title: CRC32CHash
description: Calculate CRC32C checksums for binary data with the loaders.gl Hash interface.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Crypto module · hash implementation"
  title="Use CRC32C where the storage format names it."
  description="CRC32CHash exposes the Castagnoli checksum through a small static and streaming-friendly API for format validation and block integrity."
  tone="mint"
  meta={['CRC32C', 'Static hash', 'Streaming support']}
  links={[
    {label: 'Hash API', to: '/docs/modules/crypto/api-reference/hash'},
    {label: 'Crypto module', to: '/docs/modules/crypto'},
    {label: 'CRC32Hash', to: '/docs/modules/crypto/api-reference/crc32-hash'}
  ]}
/>

<DocOrientation
  eyebrow="Use it for integrity"
  title="Match the checksum to the format."
  description="CRC32C is a fast non-cryptographic checksum used by systems and storage formats that specify the Castagnoli polynomial."
  tone="mint"
  items={[
    {label: 'Input', value: 'A byte array or binary batch'},
    {label: 'Output', value: 'CRC32C checksum string'},
    {label: 'Strength', value: 'Fast detection of accidental changes'},
    {label: 'Not for', value: 'Cryptographic authentication'}
  ]}
/>

<ReferenceBoundary
  title="CRC32CHash details"
  description="The reference below documents the static method and streaming behavior."
  tone="mint"
/>

# CRC32CHash

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

## Static Methods

#### `CRC32CHash.hash(data: ArrayBuffer, options?: object): Promise<string>`

Calculates the CRC32c hash of a byte array.

## Remarks

- This transform supports streaming hashing.
