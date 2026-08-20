import {runBrowserBenchmarks} from './run-browser-benchmarks.mjs';

const headless = process.argv.includes('--headless');
const filters = process.argv.slice(2).filter(argument => !argument.startsWith('-'));

runBrowserBenchmarks({headless, filters}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
