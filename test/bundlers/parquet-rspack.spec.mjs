// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {rspack} from '@rspack/core';
import {chromium} from 'playwright';
import {expect, test} from 'vitest';

test('production Rspack bundles a working Parquet module worker', async () => {
  const output = await mkdtemp(join(tmpdir(), 'loaders-parquet-rspack-'));
  const compiler = rspack({
    mode: 'production',
    entry: fileURLToPath(new URL('./parquet-rspack.entry.mjs', import.meta.url)),
    output: {path: output, filename: 'main.js'},
    module: {rules: [{test: /\.parquet$/, type: 'asset/resource'}]}
  });
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/') {
      response.setHeader('Content-Type', 'text/html');
      response.end('<script src="/main.js"></script>');
      return;
    }
    if (!/^\/[\w.-]+\.(js|parquet|wasm)$/.test(pathname)) {
      response.writeHead(404).end();
      return;
    }
    try {
      const body = await readFile(join(output, pathname));
      response.setHeader(
        'Content-Type',
        pathname.endsWith('.js')
          ? 'text/javascript'
          : pathname.endsWith('.wasm')
            ? 'application/wasm'
            : 'application/octet-stream'
      );
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  try {
    await new Promise((resolve, reject) => {
      compiler.run((error, stats) => {
        if (error || stats?.hasErrors()) {
          reject(error ?? new Error(stats.toString({all: false, errors: true})));
        } else {
          resolve();
        }
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.route('**/*', route => {
        return new URL(route.request().url()).origin === origin ? route.continue() : route.abort();
      });
      const workers = [];
      page.on('worker', worker => workers.push(worker.url()));
      await page.goto(origin);
      expect(await page.evaluate(() => globalThis.parquetRows)).toEqual([8, 8]);
      expect(workers.length).toBeGreaterThan(0);
      expect(workers.every(url => new URL(url).origin === origin)).toBe(true);
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    await new Promise(resolve => compiler.close(resolve));
    await rm(output, {recursive: true, force: true});
  }
}, 60_000);
