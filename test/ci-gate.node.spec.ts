// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {readFileSync} from 'node:fs';
import {expect, test} from 'vitest';
import {parse} from 'yaml';
import {checkResults} from '../scripts/ci-gate.mjs';

const workflow = readFileSync(new URL('../.github/workflows/test.yml', import.meta.url), 'utf8');
test('the aggregate gate rejects failed, cancelled, missing and unexpectedly skipped jobs', () => {
  for (const eventName of [
    'pull_request',
    'merge_group',
    'push',
    'schedule',
    'workflow_dispatch'
  ]) {
    const needs: Record<string, {result?: string}> = Object.fromEntries(
      [
        'build',
        'test',
        'slow-tests',
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
    expect(checkResults(needs, eventName)).toEqual([]);
    for (const name of Object.keys(needs)) {
      for (const result of ['success', 'failure', 'cancelled', 'skipped', undefined]) {
        const changed = structuredClone(needs);
        changed[name].result = result;
        expect(
          checkResults(changed, eventName).length === 0,
          `${eventName}/${name}/${result}`
        ).toBe(result === needs[name].result);
      }
      const missing = structuredClone(needs);
      delete missing[name];
      expect(checkResults(missing, eventName).length).toBeGreaterThan(0);
    }
  }
});
test('merge groups run the same workflow and required gate without PR-only guards', () => {
  expect(workflow).toMatch(/merge_group:\n    types: \[checks_requested\]/);
  const {jobs} = parse(workflow);
  const gate = jobs['required-ci'];
  expect(gate.name).toBe('Required CI');
  expect(gate.if).toBe('always()');
  expect([...gate.needs].sort()).toEqual(
    Object.keys(jobs)
      .filter(name => name !== 'required-ci')
      .sort()
  );
  const commands = gate.steps.map((step: {run?: string}) => step.run);
  expect(commands).toContain('node scripts/ci-gate.mjs');
  expect(commands).toContain('yarn test-coverage-check');
  expect(commands.indexOf('node scripts/ci-gate.mjs')).toBeLessThan(
    commands.indexOf('yarn test-coverage-check')
  );
  expect(gate['continue-on-error']).toBeUndefined();
  expect(gate.steps.every((step: Record<string, unknown>) => !step['continue-on-error'])).toBe(
    true
  );
  expect(workflow).toMatch(
    /github.workflow.*github.event_name.*github.event.pull_request.number \|\| github.run_id/
  );
  expect(workflow).toMatch(
    /LOADERS_GL_TEST_BASE_REF:.*github.base_ref \|\| github.event.merge_group.base_ref/
  );
});
