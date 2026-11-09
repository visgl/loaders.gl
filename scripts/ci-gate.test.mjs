// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {checkResults} from './ci-gate.mjs';

const workflow = readFileSync(new URL('../.github/workflows/test.yml', import.meta.url), 'utf8');
test('the aggregate gate rejects failed, cancelled, missing and unexpectedly skipped jobs', () => {
  for (const eventName of [
    'pull_request',
    'merge_group',
    'push',
    'schedule',
    'workflow_dispatch'
  ]) {
    const needs = Object.fromEntries(
      [
        'build',
        'test',
        'slow-tests',
        'coverage-finished',
        'tile-converter-tests',
        'website-build',
        'external-tests'
      ].map(name => [
        name,
        {
          result:
            name === 'external-tests' && !['schedule', 'workflow_dispatch'].includes(eventName)
              ? 'skipped'
              : 'success'
        }
      ])
    );
    assert.deepEqual(checkResults(needs, eventName), []);
    for (const name of Object.keys(needs)) {
      for (const result of ['success', 'failure', 'cancelled', 'skipped', undefined]) {
        const changed = structuredClone(needs);
        changed[name].result = result;
        assert.equal(
          checkResults(changed, eventName).length === 0,
          result === needs[name].result,
          `${eventName}/${name}/${result}`
        );
      }
      const missing = structuredClone(needs);
      delete missing[name];
      assert(checkResults(missing, eventName).length);
    }
  }
});
test('merge groups run the same workflow and required gate without PR-only guards', () => {
  assert.match(workflow, /merge_group:\n    types: \[checks_requested\]/);
  const gate = workflow.split('\n  required-ci:\n')[1].split('\n  build:\n')[0];
  assert.match(gate, /if: always\(\)/);
  assert.match(gate, /name: Required CI/);
  assert.match(gate, /run: node scripts\/ci-gate.mjs/);
  for (const name of [
    'build',
    'test',
    'slow-tests',
    'coverage-finished',
    'tile-converter-tests',
    'website-build',
    'external-tests'
  ])
    assert(gate.includes(name));
  assert.match(
    workflow,
    /github.workflow.*github.event_name.*github.event.pull_request.number \|\| github.run_id/
  );
  assert.match(
    workflow,
    /GITHUB_BASE_REF:.*github.base_ref \|\| github.event.merge_group.base_ref/
  );
});
