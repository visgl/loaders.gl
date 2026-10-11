// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {runTileConverterCLI} from './node-cli.js';

/** Runs the Node process adapter and maps SIGINT into cooperative I/O cancellation. */
async function main(): Promise<void> {
  const controller = new AbortController();
  /** Cancels active inspection; normal promise cleanup closes its readable file. */
  const cancelInspection = (): void => controller.abort(new Error('Inspection interrupted'));
  process.on('SIGINT', cancelInspection);
  try {
    process.exitCode = await runTileConverterCLI(
      process.argv.slice(2),
      {
        stdout: text => process.stdout.write(text),
        stderr: text => process.stderr.write(text)
      },
      controller.signal
    );
  } finally {
    process.removeListener('SIGINT', cancelInspection);
  }
}

void main();
