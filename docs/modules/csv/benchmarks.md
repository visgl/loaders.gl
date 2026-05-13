import BrowserOnly from '@docusaurus/BrowserOnly';
import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';

# CSV Benchmarks

<CsvDocsTabs active="benchmarks" />

<BrowserOnly fallback={<p>Loading browser benchmarks...</p>}>
  {() => {
    const BenchmarksApp = require('@site/src/examples/benchmarks-app').default;
    return <BenchmarksApp />;
  }}
</BrowserOnly>
