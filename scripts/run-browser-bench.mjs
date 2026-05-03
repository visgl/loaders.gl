import {runBrowserBenchmarks} from '../dev-modules/devtools-extensions/index.mjs';

const headless = process.argv.includes('--headless');

runBrowserBenchmarks({headless}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
