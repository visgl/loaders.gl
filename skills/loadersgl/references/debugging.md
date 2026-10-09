# Workers and streaming

Reproduce with the smallest deterministic input. Inspect the loader selected,
options, parsed result and error before changing parser code.

For workers, capture the requested URL, status and content type. Confirm that the
response contains JavaScript rather than a development-server HTML fallback and
that worker and package versions match. Inspect explicit worker configuration and
WASM/library paths; test the worker path and a supported direct-parser path separately.
Do not disable workers and claim worker deployment is fixed.

For streaming, confirm the loader actually supports batches. Consume the async
iterator to completion and inspect batch shape, metadata, errors and cancellation
where supported. Splitting an already parsed table is not proof of incremental parsing.

In repository tests, `yarn build` cleans worker output. Run `yarn build-workers`
after the final build before headless browser verification.
