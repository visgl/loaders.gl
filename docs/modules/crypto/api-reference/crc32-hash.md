---
title: CRC32Hash
description: Calculate CRC32 checksums for complete buffers or streaming binary batches.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Crypto module · hash implementation"
  title="Add a fast checksum to a binary pipeline."
  description="CRC32Hash provides the shared Hash interface for integrity checks and streaming transforms where a cryptographic digest is not required."
  tone="blue"
  meta={['CRC32', 'Streaming support', 'Integrity checks']}
  links={[
    {label: 'Hash API', to: '/docs/modules/crypto/api-reference/hash'},
    {label: 'Crypto module', to: '/docs/modules/crypto'},
    {label: 'Streaming loaders', to: '/docs/developer-guide/using-streaming-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="Use it for integrity"
  title="Checksum bytes while they move."
  description="CRC32 is useful for detecting accidental corruption and validating blocks during transfer. It is not intended to provide cryptographic security."
  tone="blue"
  items={[
    {label: 'Input', value: 'ArrayBuffer or async binary batches'},
    {label: 'Output', value: 'CRC32 checksum in the Hash result encoding'},
    {label: 'Strength', value: 'Fast accidental-corruption detection'},
    {label: 'Not for', value: 'Authentication or adversarial integrity'}
  ]}
/>

<ReferenceBoundary
  title="CRC32Hash details"
  description="The reference below documents the constructor, shared interface, and streaming behavior."
  tone="blue"
/>

# CRC32Hash

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Calculates the CRC32C hash.

## Interface

Implements the [`Hash`](./hash) API.

## Methods

### `constructor(options?: object)`

## Remarks

- This transform supports streaming hashing.
