import {expect, test} from 'vitest';
import {mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('normalizes deployment paths and rejects missing generated Markdown targets', () => {
  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'loaders-llms-'));
  try {
    mkdirSync(path.join(temporaryDirectory, 'scripts'));
    mkdirSync(path.join(temporaryDirectory, 'build/docs/developer-guide'), {recursive: true});
    mkdirSync(path.join(temporaryDirectory, 'build/docs/modules/csv/api-reference'), {
      recursive: true
    });
    for (const script of ['normalize-llm-output.mjs', 'check-llm-output.mjs'])
      copyFileSync(
        path.join(process.cwd(), 'website/scripts', script),
        path.join(temporaryDirectory, 'scripts', script)
      );
    const requiredPaths = [
      'docs/developer-guide/get-started.md',
      'docs/developer-guide/using-loaders.md',
      'docs/developer-guide/working-with-ai.md',
      'docs/modules/csv/api-reference/csv-loader.md'
    ];
    for (const relativePath of [
      ...requiredPaths,
      ...Array.from({length: 100}, (_, index) => `docs/page-${index}.md`)
    ])
      writeFileSync(
        path.join(temporaryDirectory, 'build', relativePath),
        '# Documentation\n\nA deterministic generated page for output validation.\n'
      );
    const indexPath = path.join(temporaryDirectory, 'build/llms.txt');
    writeFileSync(
      indexPath,
      '# loaders.gl\n\n## loaders.gl\n\n### next\n\n#### docs\n\n' +
        requiredPaths
          .map(
            relativePath =>
              `- [Page](https://loaders.gl/loaders.gl/next/loaders.gl/next/${relativePath})`
          )
          .join('\n')
    );
    const environment = {...process.env, DOCUSAURUS_BASE_URL: '/loaders.gl/next/'};
    for (const script of ['normalize-llm-output.mjs', 'check-llm-output.mjs']) {
      const result = spawnSync(
        process.execPath,
        [path.join(temporaryDirectory, 'scripts', script)],
        {env: environment, encoding: 'utf8'}
      );
      expect(result.status, result.stderr).toBe(0);
    }
    writeFileSync(
      indexPath,
      readFileSync(indexPath, 'utf8') +
        '\n- [Broken](https://loaders.gl/loaders.gl/next/docs/missing.md)\n'
    );
    const result = spawnSync(
      process.execPath,
      [path.join(temporaryDirectory, 'scripts/check-llm-output.mjs')],
      {env: environment, encoding: 'utf8'}
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('broken Markdown links');
  } finally {
    rmSync(temporaryDirectory, {recursive: true, force: true});
  }
});
