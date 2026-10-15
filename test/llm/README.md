# loaders.gl agent evals

`loadersgl-skill-evals.json` is an offline manual evaluation corpus. Run each prompt
in equivalent isolated application or repository fixtures with and without the
skill. Record transcripts, concrete artifacts, expected behaviors observed and
forbidden mistakes made. A case passes only when every expected behavior is
observed and no forbidden mistake occurs. Report baseline and skill-assisted
results separately; this PR does not claim model performance measurements.

`yarn test-node test/llm/loadersgl-skill.node.spec.ts` validates corpus structure,
source paths and skill references without model calls, API keys or public network.
