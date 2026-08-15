import {runBrowserBenchmarks} from './run-browser-benchmarks.mjs';

const headless = process.argv.includes('--headless');

runBrowserBenchmarks({headless}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
