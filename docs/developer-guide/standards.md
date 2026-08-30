---
title: Standards and organizations
description: Explore the open standards, service protocols, and organizations represented by loaders.gl implementations.
hide_title: true
page_style: designed
---

import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {StandardsBoundaryGraphic} from '@site/src/components/docs/standards-boundary-graphic';
import {StandardsOrganizations} from '@site/src/components/docs/standards-organizations';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import apacheLogo from '../images/logos/apache-logo.png';

<CapabilityHero
  capability="standards"
  eyebrow="Standards and organizations"
  title="loaders.gl ♥ standards"
  description="Big-data applications should be able to choose open formats without rebuilding their loading path. loaders.gl implements standards deeply, exposes the boundaries honestly, and keeps the application-facing shapes portable."
  logos={[
    {alt: 'Open Geospatial Consortium', src: '/images/format-logos/ogc-logo-transparent.png'},
    {alt: 'glTF', src: '/images/format-logos/gltf-logo.png'},
    {alt: 'Apache Software Foundation', src: apacheLogo},
    {alt: 'ArcGIS', src: '/images/format-logos/arcgis-logo.svg'}
  ]}
  links={[
    {label: 'All formats', to: '/docs/formats'},
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'},
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'}
  ]}
/>

<StandardsBoundaryGraphic />

<DocOrientation
  eyebrow="What support means here"
  title="Implement the standard. Keep the boundary visible."
  description="A standards logo is useful only when readers can discover the loader, writer, source, version, and unsupported edge behind it. The catalog below links directly to those implementation pages."
  tone="violet"
  items={[
    {label: 'Decode', value: 'Load standards-shaped files and service responses'},
    {label: 'Encode', value: 'Write compatible formats where a writer is implemented'},
    {label: 'Discover', value: 'Read metadata before requesting large payloads'},
    {label: 'Compose', value: 'Move results through common table, mesh, scene, and tile shapes'}
  ]}
/>

<StandardsOrganizations />

<ReferenceBoundary
  title="Conformance lives with each format"
  description="Follow a format link for supported versions, profiles, extensions, loader and writer entry points, test-backed capabilities, and known gaps. The catalog is a map—not a blanket conformance claim."
  tone="violet"
/>

Support descriptions deliberately distinguish complete, partial, developing, and unsupported
capabilities. When a specification is still evolving—such as draft glTF 2.1 features—the format
page identifies the implemented draft surface and the tests that protect it.
