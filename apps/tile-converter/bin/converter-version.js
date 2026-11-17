import {readFileSync} from 'node:fs';

/** Reports the installed package version and selected converter implementation. */
export function printConverterVersion(implementation) {
  const {version} = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const identity = `@loaders.gl/tile-converter ${version} (implementation: ${implementation})\n`;
  if (process.argv.includes('--version')) {
    process.stdout.write(identity);
    return true;
  }
  process.stderr.write(identity);
  return false;
}
