# Vitest 5 proof of concept

## Goal

Evaluate Vitest 5.0.2 against the Vitest 4.1.11 version locked on master, preserving the existing Chromium runtime, single browser worker, hermetic projects, and coverage thresholds.

## Compatibility changes

- Pin Vitest, the Playwright provider, and V8 coverage to the same version.
- Align the browser packages pulled in by @vis.gl/dev-tools, which still declares Vitest 4 dependencies and peers. This is a POC override; upstream Vitest 5 support remains an adoption dependency, tracked in [dev-tools #59](https://github.com/visgl/dev-tools/pull/59).
- Keep explicit, unique browser blob report paths in CI so existing artifact upload and merge steps continue to work despite Vitest 5's changed defaults.
- Ignore the new .vitest artifact directory.

## Validation plan

- Build modules and workers, then run the Node and full Chromium suites.
- Compare three sequential Chromium profiles of CSV, JSON, and worker-utils with identical settings on each version. These measure a focused subset, not total CI time.
- Check coverage file selection and the browser/Node/slow report merge without reducing any committed threshold.
- Review CI and comments before deciding whether to adopt the upgrade.

## References

- [Vitest 5 release](https://vitest.dev/blog/vitest-5)
- [Vitest 5 migration guide](https://vitest.dev/guide/migration/)

## Initial compatibility results

On macOS arm64, Node 24.5.0, Playwright 1.59.1, using the same source at e165e04153:

| Check | Vitest 4.1.11 | Vitest 5.0.2 |
| --- | --- | --- |
| Node files | 79 passed | 79 passed |
| Node tests | 466 passed, 6 skipped | 466 passed, 6 skipped |
| Chromium files | 673 passed, 1 skipped | 673 passed, 1 skipped |
| Chromium tests | 5,249 passed, 39 skipped | 5,249 passed, 39 skipped |
| Discovered Node/Chromium files | 753 | 753, identical paths |
| Coverage source files | 1,647 | 1,650 |

Vitest 5's stricter glob matching adds the published deprecated.ts compatibility wrappers in geoarrow, gis, and schema-utils. No baseline source file disappears. Keep these wrappers included; do not broaden exclusions to recover the old denominator. The coverage inventory comes from the same four-test Node zlib coverage probe on each version and checks file selection, not aggregate coverage sufficiency.

Both complete suites passed without changing production code, test cases, runtime isolation, or concurrency. The existing custom profile reporter also runs under Vitest 5. Vitest 5 emits a Vite warning that configureServer on its mocks interceptor is ignored when returned from applyToEnvironment; the full fast suites pass despite the warning. Track this upstream rather than suppressing it in this POC.

## Performance interpretation

Use the profile reporter's wallMilliseconds for the comparison. Vitest 5's browser diagnostic breakdown can attribute nearly all time to worker preparation; per-file prepareDuration totals are not a reliable wall-clock comparison. Do not tune concurrency based on those totals.

The full-suite durations are single-run observations, not a benchmark. The focused comparison uses three sequential runs per version with the same 40 files, 416 tests, and one Chromium worker. It does not establish a whole-CI speedup.

| Series | Run 1 (s) | Run 2 (s) | Run 3 (s) | Median (s) |
| --- | --- | --- | --- | --- |
| 4.1.11 baseline | 7.227 | 7.832 | 7.685 | 7.685 |
| 5.0.2 initial | 6.803 | 6.624 | 7.176 | 6.803 |
| 5.0.2 repeat after rebuild | 11.122 | 14.530 | 11.902 | 11.902 |

The initial Vitest 5 median improved, but the repeat series was slower and variable. These runs share a development machine with other activity, so performance is inconclusive. Repeat on an otherwise idle host or comparable CI runners before adopting the upgrade for speed. The final repeat followed a rebuild and an update to master; the sampled module test sources did not change.

## Full coverage validation

The first CI run passed build, website, Node 22/24/26, both Chromium coverage shards, slow tests, and tile-converter tests. Report merging also worked, but the unchanged coverage gate exposed the still-published schema getMeshBoundingBox compatibility export under src/deprecated/mesh-utils.ts. The earlier four-test inventory probe did not import this file.

Add focused public-entrypoint checks for extrema and missing, empty, and unpopulated position data. The schema Chromium coverage run now reaches 100% for statements, lines, functions, and branches, including this legacy export. No production behavior, coverage exclusions, or thresholds changed.

A local full Chromium coverage run lost its browser connection partway through and is not evidence of complete coverage; CI runs both Chromium shards and merges them with Node and affected slow coverage before enforcing the gates.

## External Coveralls comparison

The complete CI comparison with master found ten newly counted compatibility files, including glTF extension handlers and WMS source factories; the small inventory probe above saw only three. Eight covered compression initializer lines also became non-coverable. The separate Coveralls status fell from 87.6940% to 87.6198%, even though all internal per-package ratchets passed. A successful coverage upload does not imply a passing external status.

Focused hermetic compatibility tests cover shader/program/texture resolution and unsupported shader input, incomplete metadata, legacy light serialization, and WMS source selection, option forwarding, and rejection. Keep the expanded denominator and verify both internal ratchets and the external status on the final CI run.
