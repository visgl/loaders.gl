---
title: CSV benchmarks
description: Compare CSV parsing and batch delivery in the browser with the same fixture and options.
hide_title: true
page_style: designed
---

import BrowserOnly from '@docusaurus/BrowserOnly';
import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="CSV module · live benchmark"
  title="Measure the parse path your table actually uses."
  description="CSV performance depends on row width, quoting, conversion, and whether the application consumes one table or batches. This browser benchmark keeps the fixture and run visible so the result has useful context."
  tone="mint"
  meta={['CSV', 'Table output', 'Browser runtime']}
  links={[
    {label: 'CSV module', to: '/docs/modules/csv'},
    {label: 'CSVLoader', to: '/docs/modules/csv/api-reference/csv-loader'},
    {label: 'Streaming loaders', to: '/docs/developer-guide/using-streaming-loaders'}
  ]}
/>

<CsvDocsTabs active="benchmarks" />

<DocOrientation
  eyebrow="Keep the comparison useful"
  title="Use the same input, output shape, and browser."
  description="Run complete and batched parsing against the same fixture. Treat the result as a local signal and repeat it when changing options, browser versions, or hardware."
  tone="mint"
  items={[
    {label: 'Fixture', value: 'The same CSV bytes for each run'},
    {label: 'Output', value: 'The selected table or batch shape'},
    {label: 'Timing', value: 'Measured in the active browser'},
    {label: 'Use', value: 'Choose options for the real application path'}
  ]}
/>

<ReferenceBoundary
  title="Run the benchmark"
  description="The interactive app below performs the browser measurement. Use the loader reference for parsing options and batch behavior."
  tone="mint"
/>

<BrowserOnly fallback={<p>Loading browser benchmarks...</p>}>
  {() => {
    const BenchmarksApp = require('@site/src/examples/benchmarks-app').default;
    return <BenchmarksApp />;
  }}
</BrowserOnly>
