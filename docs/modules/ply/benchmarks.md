---
title: PLY benchmarks
description: Compare browser PLY parsing behavior with the actual geometry workloads used by applications.
hide_title: true
page_style: designed
---

import BrowserOnly from '@docusaurus/BrowserOnly';
import {PlyDocsTabs} from '@site/src/components/docs/ply-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="PLY module · live benchmark"
  title="See how PLY parsing behaves in this browser."
  description="PLY is flexible enough that a benchmark should make its fixture and output shape visible. Use the live app to compare representative geometry parsing rather than relying on a synthetic headline number."
  tone="blue"
  meta={['PLY', 'Geometry parsing', 'Browser runtime']}
  links={[
    {label: 'PLY module', to: '/docs/modules/ply'},
    {label: 'PLYLoader', to: '/docs/modules/ply/api-reference/ply-loader'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<PlyDocsTabs active="benchmarks" />

<DocOrientation
  eyebrow="What the run tells you"
  title="Measure parsing in the shape you will consume."
  description="The useful comparison includes parser startup, input shape, geometry fields, and materialization. Treat the result as a local engineering signal for your target browser and hardware."
  tone="blue"
  items={[
    {label: 'Input', value: 'The selected PLY fixture and encoding'},
    {label: 'Parser', value: 'The browser implementation under test'},
    {label: 'Output', value: 'The mesh data returned to the application'},
    {label: 'Context', value: 'This browser, device, and current tab state'}
  ]}
/>

<ReferenceBoundary
  title="Run the benchmark"
  description="The interactive app below performs the browser measurement. Use the module reference for parsing options and output fields."
  tone="blue"
/>

<BrowserOnly fallback={<p>Loading browser benchmarks...</p>}>
  {() => {
    const PlyBenchmarksApp = require('@site/src/examples/ply-benchmarks-app').default;
    return <PlyBenchmarksApp />;
  }}
</BrowserOnly>
