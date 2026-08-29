---
title: MD5Hash
description: Calculate MD5 digests for compatibility with formats and systems that require them.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Crypto module · hash implementation"
  title="Use MD5 when compatibility is the requirement."
  description="MD5Hash implements the shared Hash API for legacy file formats, cache keys, and interoperability cases. It should not be used for new security-sensitive designs."
  tone="orange"
  meta={['MD5', 'Compatibility', 'Streaming interface']}
  links={[
    {label: 'Hash API', to: '/docs/modules/crypto/api-reference/hash'},
    {label: 'Crypto module', to: '/docs/modules/crypto'},
    {label: 'SHA256Hash', to: '/docs/modules/crypto/api-reference/sha256-hash'}
  ]}
/>

<DocOrientation
  eyebrow="Know the boundary"
  title="Separate interoperability from security."
  description="MD5 remains useful when an external protocol or existing dataset specifies it. For collision-resistant integrity or authentication, choose a modern cryptographic construction instead."
  tone="orange"
  items={[
    {label: 'Use it for', value: 'Legacy formats and compatibility checks'},
    {label: 'Interface', value: 'Shared async, sync, and batch methods'},
    {label: 'Bundle', value: 'Preload before synchronous operation'},
    {label: 'Avoid for', value: 'New security-sensitive applications'}
  ]}
/>

<ReferenceBoundary
  title="MD5Hash details"
  description="The reference below documents the constructor and shared Hash behavior."
  tone="orange"
/>

# MD5Hash

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Calculates the MD5 hash.

## Interface

Implements the [`Hash`](./hash) API.

## Methods

### `constructor(options?: object)`
