// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {runTileConverterCLI} from './node-cli.js';

/** Runs the Node process adapter and maps SIGINT into cooperative I/O cancellation. */
async function main(): Promise<void> {
  const controller = new AbortController();
  /** Cancels the active operation; promise cleanup closes source and output handles. */
  const cancelOperation = (): void =>
    controller.abort(new Error('Tile conversion operation interrupted'));
  process.on('SIGINT', cancelOperation);
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
    process.removeListener('SIGINT', cancelOperation);
  }
}

void main();
