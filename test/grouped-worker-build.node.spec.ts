// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fileSystem from 'node:fs';
import operatingSystem from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {expect, test} from 'vitest';

const WORKER_BUILD_SCRIPT = path.resolve('scripts/build-workers.mjs');

test.each([
  true,
  false
])('worker asset builds follow grouped source ownership when source exists: %s', sourceExists => {
  const directory = fileSystem.realpathSync(
    fileSystem.mkdtempSync(path.join(operatingSystem.tmpdir(), 'grouped-workers-'))
  );
  try {
    const scriptDirectory = path.join(directory, 'scripts');
    const executableDirectory = path.join(directory, 'bin');
    const callLog = path.join(directory, 'worker-builds.log');
    fileSystem.mkdirSync(scriptDirectory, {recursive: true});
    fileSystem.mkdirSync(executableDirectory, {recursive: true});
    fileSystem.copyFileSync(WORKER_BUILD_SCRIPT, path.join(scriptDirectory, 'build-workers.mjs'));
    fileSystem.writeFileSync(
      path.join(executableDirectory, 'npm'),
      `#!${process.execPath}\nrequire('node:fs').appendFileSync(process.env.LOADERS_GL_WORKER_BUILD_LOG, process.cwd() + '\\n');\n`,
      {mode: 0o755}
    );

    for (const [format, input] of [
      ['csv', '../tables/src/workers/csv-worker.ts'],
      ['tables', 'src/workers/csv-worker.ts']
    ]) {
      const moduleDirectory = path.join(directory, 'modules', format);
      fileSystem.mkdirSync(moduleDirectory, {recursive: true});
      fileSystem.writeFileSync(
        path.join(moduleDirectory, 'package.json'),
        JSON.stringify({
          name: '@loaders.gl/' + format,
          scripts: {'build-worker': `esbuild ${input} --outfile=dist/csv-worker.js`}
        })
      );
    }
    if (sourceExists) {
      const workerDirectory = path.join(directory, 'modules/tables/src/workers');
      fileSystem.mkdirSync(workerDirectory, {recursive: true});
      fileSystem.writeFileSync(
        path.join(workerDirectory, 'csv-worker.ts'),
        '// Worker entry fixture.\n'
      );
    }
    const result = spawnSync(process.execPath, [path.join(scriptDirectory, 'build-workers.mjs')], {
      cwd: directory,
      encoding: 'utf8',
      timeout: 30000,
      env: {
        ...process.env,
        PATH: executableDirectory + path.delimiter + process.env.PATH,
        LOADERS_GL_WORKER_BUILD_LOG: callLog
      }
    });
    expect(result.status, result.stderr).toBe(0);
    if (sourceExists) {
      expect(fileSystem.readFileSync(callLog, 'utf8').trim().split('\n').sort()).toEqual([
        path.join(directory, 'modules/csv'),
        path.join(directory, 'modules/tables')
      ]);
    } else {
      expect(fileSystem.existsSync(callLog)).toBe(false);
      expect(result.stderr).toContain('Skipping @loaders.gl/csv build-worker');
    }
  } finally {
    fileSystem.rmSync(directory, {recursive: true, force: true});
  }
});
