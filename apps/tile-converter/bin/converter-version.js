import {readFileSync} from 'node:fs';

/** Reports the installed package version and selected converter implementation. */
export function printConverterVersion(implementation) {
  /** Package version read from the installed command’s manifest. */
  const {version} = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  /** Human-readable identity emitted by the version command. */
  const identity = `@loaders.gl/tile-converter ${version} (implementation: ${implementation})\n`;
  if (process.argv.includes('--version')) {
    process.stdout.write(identity);
    return true;
  }
  return false;
}
