---
title: setPathPrefix
description: Configure a shared prefix for resolving relative resource paths used by loaders.gl operations.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core API / resource paths"
  title="Resolve relative assets from one known base."
  description="setPathPrefix() supplies a shared prefix for relative paths passed to load functions. It is useful when application data and referenced resources live below a common deployment or CDN base."
  tone="blue"
  meta={['Relative paths', 'Shared base prefix', 'Alias resolution']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Loader options', to: '/docs/modules/core/api-reference/loader-options'},
    {label: 'Resource resolution', to: '/docs/modules/3d-tiles/concepts/resource-resolution-and-content-detection'}
  ]}
/>

<DocOrientation
  eyebrow="Path resolution"
  title="Keep resource references portable."
  description="A relative asset path can remain unchanged in a format or application while deployment code supplies the location where that asset is served. The prefix is applied after aliases are resolved."
  tone="blue"
  items={[
    {label: 'Set', value: 'Provide a prefix for relative load and save paths.'},
    {label: 'Resolve', value: 'Apply aliases first, then prepend the configured prefix.'},
    {label: 'Inspect', value: 'Read the current prefix with getPathPrefix().' },
    {label: 'Clear', value: 'Set an empty prefix when resolution should use the original path.'}
  ]}
/>

<ReferenceBoundary
  title="Path prefix reference"
  description="The detailed reference covers resolvePath(), setPathPrefix(), getPathPrefix(), alias order, and relative versus absolute paths."
  tone="blue"
/>

### resolvePath(path : String) : String

Applies aliases and path prefix, in that order. Returns an updated path.

### setPathPrefix(prefix : String)

This sets a path prefix that is automatically prepended to relative path names provided to load functions.

### getPathPrefix() : String

Returns the current path prefix set by `setPathPrefix`.
