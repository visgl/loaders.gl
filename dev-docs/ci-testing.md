# CI test execution

The test workflow builds packages and workers once on Node 24. It archives the
`modules/*/dist` and `apps/*/dist` directories in a tar file so paths and
permissions survive artifact transfer. Every test job installs its own dependencies
on its selected Node version, then restores the build from the same workflow run.
Runtime dependencies and native dependency installation remain specific to each job.

Node 22, 24, and 26 tests, both Chromium coverage shards, tile-converter tests, and
the full hermetic slow coverage suite continue to run. Coverage reports are merged
before checking the existing package thresholds and browser coverage ratchet.
Chromium still uses one worker per shard. External tests run on schedules and manual
invocations.

New commits cancel older runs for the same pull request. Master pushes, schedules,
and manual invocations use separate concurrency groups. Build artifacts are retained
for seven days to allow failed jobs to be rerun without rebuilding.

See GitHub's documentation for [sharing artifacts between jobs](https://docs.github.com/en/actions/tutorials/store-and-share-data)
and [workflow concurrency](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency).
