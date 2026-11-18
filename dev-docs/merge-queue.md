# Master merge queue

The test workflow runs on pull requests and merge groups. Require the GitHub Actions
check `Required CI` on both: its aggregate gate rejects failed, cancelled, missing
and unexpectedly skipped jobs, including test and coverage workers.

The repository ruleset [master merge queue](https://github.com/visgl/loaders.gl/rules/26899454) is staged with enforcement disabled
until this preparation PR lands. Its source configuration is
[.github/merge-queue.json](../.github/merge-queue.json). It uses squash merges, one
entry per build/merge, ALLGREEN and a 60-minute response timeout. No actor bypasses
the queue or its required check. Existing approval policy is separate.

## Activation after merging this PR

1. Confirm master contains the `merge_group: checks_requested` trigger and gate.
2. In Settings > Rules > Rulesets, change `master merge queue` from Disabled to Active.
3. Add a green PR to the queue. Verify a `merge_group` Actions run reports
   `Required CI` against the queue SHA before GitHub squashes it into master.

Use **Add to merge queue**, rather than a direct/admin merge. Release branches and
tags retain their existing rules. To roll back queue enforcement, disable only this
new ruleset; retain existing branch protections. The first live queue run requires
a separately authorized PR merge and is not claimed by preparation CI.
